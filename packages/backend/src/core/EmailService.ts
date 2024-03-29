/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { URLSearchParams } from 'node:url';
import * as nodemailer from 'nodemailer';
import { Inject, Injectable } from '@nestjs/common';
import { validate as validateEmail } from 'deep-email-validator';
import { MetaService } from '@/core/MetaService.js';
import { UtilityService } from '@/core/UtilityService.js';
import { DI } from '@/di-symbols.js';
import type { Config } from '@/config.js';
import type Logger from '@/logger.js';
import type { UserProfilesRepository } from '@/models/_.js';
import { LoggerService } from '@/core/LoggerService.js';
import { bindThis } from '@/decorators.js';
import { HttpRequestService } from '@/core/HttpRequestService.js';

@Injectable()
export class EmailService {
	private logger: Logger;

	constructor(
		@Inject(DI.config)
		private config: Config,

		@Inject(DI.userProfilesRepository)
		private userProfilesRepository: UserProfilesRepository,

		private metaService: MetaService,
		private loggerService: LoggerService,
		private utilityService: UtilityService,
		private httpRequestService: HttpRequestService,
	) {
		this.logger = this.loggerService.getLogger('email');
	}

	@bindThis
	public async sendEmail(to: string, subject: string, html: string, text: string) {
		const meta = await this.metaService.fetch(true);

		if (!meta.enableEmail) return;

		const iconUrl = `${this.config.url}/static-assets/mi-white.png`;
		const emailSettingUrl = `${this.config.url}/settings/email`;

		const enableAuth = meta.smtpUser != null && meta.smtpUser !== '';

		const transporter = nodemailer.createTransport({
			host: meta.smtpHost,
			port: meta.smtpPort,
			secure: meta.smtpSecure,
			ignoreTLS: !enableAuth,
			proxy: this.config.proxySmtp,
			auth: enableAuth ? {
				user: meta.smtpUser,
				pass: meta.smtpPass,
			} : undefined,
		} as any);

		try {
			// TODO: htmlサニタイズ
			const info = await transporter.sendMail({
				from: meta.email!,
				to: to,
				subject: subject,
				text: text,
				html: `<!doctype html>
				<html>
				  <head>
					<meta name="viewport" content="width=device-width" />
					<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
					<title>${subject}</title>
				  </head>
				  <body style="background-color: #eaebed; font-family: sans-serif; -webkit-font-smoothing: antialiased; font-size: 14px; line-height: 1.4; margin: 0; padding: 0; -ms-text-size-adjust: 100%; -webkit-text-size-adjust: 100%;">
					<table role="presentation" border="0" cellpadding="0" cellspacing="0" style="border-collapse: separate; mso-table-lspace: 0pt; mso-table-rspace: 0pt; min-width: 100%; width: 100%;" class="body">
					  <tr>
						<td>&nbsp;</td>
						<td class="container" style="display: block; Margin: 0 auto !important; max-width: 580px; padding: 10px; width: 580px;">
						  <div class="header" style="padding: 20px 0;">
							<table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
							  <tr>
								<td class="align-center" width="100%">
								  <a href="https://app.piberio.com"><img src="https://static.piberio.com/300x300.png" height="80" alt="Piberio" style="border: none; -ms-interpolation-mode: bicubic; max-width: 100%;"></a>
								</td>
							  </tr>
							</table>
						  </div>
						  <div class="content" style="box-sizing: border-box; display: block; Margin: 0 auto; max-width: 580px; padding: 10px;">
							<!-- START CENTERED WHITE CONTAINER -->
							<table role="presentation" class="main" style="background: #ffffff; border-radius: 3px; width: 100%;">
							  <!-- START MAIN CONTENT AREA -->
							  <tr>
								<td class="wrapper" style="box-sizing: border-box; padding: 20px;">
								  <table role="presentation" border="0" cellpadding="0" cellspacing="0">
									<tr>
									  <td>
										<table role="presentation" border="0" cellpadding="0" cellspacing="0" class="btn btn-primary" style="min-width: auto; width: auto;">
										  <tbody>
											<tr>
											  <td align="center">
												<table role="presentation" border="0" cellpadding="0" cellspacing="0">
												  <tbody>
													<tr>
													  <h2 style="color: #06090f; font-family: sans-serif; font-weight: 400; line-height: 1.4; margin: 0; margin-bottom: 30px; font-size: 35px; text-align: center; text-transform: capitalize;">${subject}</h2>
													  <div>${html}</div>
													</tr>
												  </tbody>
												</table>
											  </td>
											</tr>
										  </tbody>
										</table>
									  </td>
									</tr>
								  </table>
								</td>
							  </tr>
							  <!-- END MAIN CONTENT AREA -->
							</table>
							<footer class="footer" style="clear: both; Margin-top: 10px; text-align: center; width: 100%;">
							  <a href="${emailSettingUrl}" style="color: #9a9ea6; font-size: 12px; text-align: center; text-decoration: none;">${'Email setting'}</a>
							</footer>
							<!-- END FOOTER -->
						  <!-- END CENTERED WHITE CONTAINER -->
						  </div>
						</td>
						<td>&nbsp;</td>
					  </tr>
					</table>
				  </body>
				</html>
				`,
			});

			this.logger.info(`Message sent: ${info.messageId}`);
		} catch (err) {
			this.logger.error(err as Error);
			throw err;
		}
	}

	@bindThis
	public async validateEmailForAccount(emailAddress: string): Promise<{
		available: boolean;
		reason: null | 'used' | 'format' | 'disposable' | 'mx' | 'smtp' | 'banned' | 'network' | 'blacklist';
	}> {
		const meta = await this.metaService.fetch();

		const exist = await this.userProfilesRepository.countBy({
			emailVerified: true,
			email: emailAddress,
		});

		if (exist !== 0) {
			return {
				available: false,
				reason: 'used',
			};
		}

		let validated: {
			valid: boolean,
			reason?: string | null,
		} = { valid: true, reason: null };

		if (meta.enableActiveEmailValidation) {
			if (meta.enableVerifymailApi && meta.verifymailAuthKey != null) {
				validated = await this.verifyMail(emailAddress, meta.verifymailAuthKey);
			} else if (meta.enableTruemailApi && meta.truemailInstance && meta.truemailAuthKey != null) {
				validated = await this.trueMail(meta.truemailInstance, emailAddress, meta.truemailAuthKey);
			} else {
				validated = await validateEmail({
					email: emailAddress,
					validateRegex: true,
					validateMx: true,
					validateTypo: false, // TLDを見ているみたいだけどclubとか弾かれるので
					validateDisposable: true, // 捨てアドかどうかチェック
					validateSMTP: false, // 日本だと25ポートが殆どのプロバイダーで塞がれていてタイムアウトになるので
				});
			}
		}

		if (!validated.valid) {
			const formatReason: Record<string, 'format' | 'disposable' | 'mx' | 'smtp' | 'network' | 'blacklist' | undefined> = {
				regex: 'format',
				disposable: 'disposable',
				mx: 'mx',
				smtp: 'smtp',
				network: 'network',
				blacklist: 'blacklist',
			};

			return {
				available: false,
				reason: validated.reason ? formatReason[validated.reason] ?? null : null,
			};
		}

		const emailDomain: string = emailAddress.split('@')[1];
		const isBanned = this.utilityService.isBlockedHost(meta.bannedEmailDomains, emailDomain);

		if (isBanned) {
			return {
				available: false,
				reason: 'banned',
			};
		}

		return {
			available: true,
			reason: null,
		};
	}

	private async verifyMail(emailAddress: string, verifymailAuthKey: string): Promise<{
		valid: boolean;
		reason: 'used' | 'format' | 'disposable' | 'mx' | 'smtp' | null;
	}> {
		const endpoint = 'https://verifymail.io/api/' + emailAddress + '?key=' + verifymailAuthKey;
		const res = await this.httpRequestService.send(endpoint, {
			method: 'GET',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
				Accept: 'application/json, */*',
			},
		});

		const json = (await res.json()) as Partial<{
			message: string;
			block: boolean;
			catch_all: boolean;
			deliverable_email: boolean;
			disposable: boolean;
			domain: string;
			email_address: string;
			email_provider: string;
			mx: boolean;
			mx_fallback: boolean;
			mx_host: string[];
			mx_ip: string[];
			mx_priority: { [key: string]: number };
			privacy: boolean;
			related_domains: string[];
		}>;

		/* api error: when there is only one `message` attribute in the returned result */
		if (Object.keys(json).length === 1 && Reflect.has(json, 'message')) {
			return {
				valid: false,
				reason: null,
			};
		}
		if (json.email_address === undefined) {
			return {
				valid: false,
				reason: 'format',
			};
		}
		if (json.deliverable_email !== undefined && !json.deliverable_email) {
			return {
				valid: false,
				reason: 'smtp',
			};
		}
		if (json.disposable) {
			return {
				valid: false,
				reason: 'disposable',
			};
		}
		if (json.mx !== undefined && !json.mx) {
			return {
				valid: false,
				reason: 'mx',
			};
		}

		return {
			valid: true,
			reason: null,
		};
	}

	private async trueMail<T>(truemailInstance: string, emailAddress: string, truemailAuthKey: string): Promise<{
		valid: boolean;
		reason: 'used' | 'format' | 'blacklist' | 'mx' | 'smtp' | 'network' | T | null;
	}> {
		const endpoint = truemailInstance + '?email=' + emailAddress;
		try {
			const res = await this.httpRequestService.send(endpoint, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Accept: 'application/json',
					Authorization: truemailAuthKey,
				},
			});

			const json = (await res.json()) as {
				email: string;
				success: boolean;
				error?: string;
				errors?: {
					list_match?: string;
					regex?: string;
					mx?: string;
					smtp?: string;
				} | null;
			};

			if (json.email === undefined || json.errors?.regex) {
				return {
					valid: false,
					reason: 'format',
				};
			}
			if (json.errors?.smtp) {
				return {
					valid: false,
					reason: 'smtp',
				};
			}
			if (json.errors?.mx) {
				return {
					valid: false,
					reason: 'mx',
				};
			}
			if (!json.success) {
				return {
					valid: false,
					reason: json.errors?.list_match as T || 'blacklist',
				};
			}

			return {
				valid: true,
				reason: null,
			};
		} catch (error) {
			return {
				valid: false,
				reason: 'network',
			};
		}
	}
}
