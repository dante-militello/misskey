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
				html: `
				<!DOCTYPE html>
<html xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office" lang="en">

<head>
	<title>${subject}</title>
	<meta http-equiv="Content-Type" content="text/html; charset=utf-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0"><!--[if mso]><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch><o:AllowPNG/></o:OfficeDocumentSettings></xml><![endif]--><!--[if !mso]><!-->
	<link href="https://fonts.googleapis.com/css?family=Cabin" rel="stylesheet" type="text/css"><!--<![endif]-->
	<style>
		* {
			box-sizing: border-box;
		}

		body {
			margin: 0;
			padding: 0;
		}

		a[x-apple-data-detectors] {
			color: inherit !important;
			text-decoration: inherit !important;
		}

		#MessageViewBody a {
			color: inherit;
			text-decoration: none;
		}

		p {
			line-height: inherit
		}

		.desktop_hide,
		.desktop_hide table {
			mso-hide: all;
			display: none;
			max-height: 0px;
			overflow: hidden;
		}

		.image_block img+div {
			display: none;
		}

		@media (max-width:670px) {
			.desktop_hide table.icons-inner {
				display: inline-block !important;
			}

			.icons-inner {
				text-align: center;
			}

			.icons-inner td {
				margin: 0 auto;
			}

			.mobile_hide {
				display: none;
			}

			.row-content {
				width: 100% !important;
			}

			.stack .column {
				width: 100%;
				display: block;
			}

			.mobile_hide {
				min-height: 0;
				max-height: 0;
				max-width: 0;
				overflow: hidden;
				font-size: 0px;
			}

			.desktop_hide,
			.desktop_hide table {
				display: table !important;
				max-height: none !important;
			}
		}
	</style>
</head>

<body style="background-color: #000000; margin: 0; padding: 0; -webkit-text-size-adjust: none; text-size-adjust: none;">
	<table class="nl-container" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #000000;">
		<tbody>
			<tr>
				<td>
					<table class="row row-1" align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #fcfcfc;">
						<tbody>
							<tr>
								<td>
									<table class="row-content stack" align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; color: #000000; width: 650px; margin: 0 auto;" width="650">
										<tbody>
											<tr>
												<td class="column column-1" width="100%" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; padding-bottom: 5px; padding-top: 5px; vertical-align: top; border-top: 0px; border-right: 0px; border-bottom: 0px; border-left: 0px;">
													<table class="image_block block-1" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;">
														<tr>
															<td class="pad" style="padding-bottom:15px;padding-top:15px;width:100%;padding-right:0px;padding-left:0px;">
																<div class="alignment" align="center" style="line-height:10px">
																	<div style="max-width: 130px;"><img src="https://static.piberio.com/300x300.png" style="display: block; height: auto; border: 0; width: 100%;" width="130" alt="your logo" title="your logo" height="auto"></div>
																</div>
															</td>
														</tr>
													</table>
												</td>
											</tr>
										</tbody>
									</table>
								</td>
							</tr>
						</tbody>
					</table>
					<table class="row row-2" align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #fcfcfc;">
						<tbody>
							<tr>
								<td>
									<table class="row-content stack" align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #ffffff; background-color:#fff; background-position: center top; background-repeat: no-repeat; color: #000000; width: 650px; margin: 0 auto;" width="650">
										<tbody>
											<tr>
                                                                                                ${html}
											</tr>
										</tbody>
									</table>
								</td>
							</tr>
						</tbody>
					</table>
					<table class="row row-3" align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #ffffff;">
						<tbody>
							<tr>
								<td>
									<table class="row-content stack" align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; color: #000000; background-color: #ffffff; width: 650px; margin: 0 auto;" width="650">
										<tbody>
											<tr>
												<td class="column column-1" width="100%" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; padding-bottom: 5px; padding-top: 5px; vertical-align: top; border-top: 0px; border-right: 0px; border-bottom: 0px; border-left: 0px;">
													<table class="icons_block block-1" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; text-align: center;">
														<tr>
															<td class="pad" style="vertical-align: middle; color: #1e0e4b; font-family: 'Inter', sans-serif; font-size: 15px; padding-bottom: 5px; padding-top: 5px; text-align: center;">
																<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;">
																	<tr>
																		<td class="alignment" style="vertical-align: middle; text-align: center;"><!--[if vml]><table align="center" cellpadding="0" cellspacing="0" role="presentation" style="display:inline-block;padding-left:0px;padding-right:0px;mso-table-lspace: 0pt;mso-table-rspace: 0pt;"><![endif]-->
																			<!--[if !vml]><!-->
																			<table class="icons-inner" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; display: inline-block; margin-right: -4px; padding-left: 0px; padding-right: 0px;" cellpadding="0" cellspacing="0" role="presentation"><!--<![endif]-->

																			</table>
																		</td>
																	</tr>
																</table>
															</td>
														</tr>
													</table>
												</td>
											</tr>
										</tbody>
									</table>
								</td>
							</tr>
						</tbody>
					</table>
				</td>
			</tr>
		</tbody>
	</table><!-- End -->
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
