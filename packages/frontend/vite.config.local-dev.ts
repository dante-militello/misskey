import dns from 'dns';
import { readFile } from 'node:fs/promises';
import { defineConfig } from 'vite';
import * as yaml from 'js-yaml';
import locales from '../../locales/index.js';
import { getConfig } from './vite.config.js';

dns.setDefaultResultOrder('ipv4first');

const defaultConfig = getConfig();

const { port } = yaml.load(await readFile('../../.config/default.yml', 'utf-8'));

const httpUrl = `https://app.piberio.com:${port}/`;
const websocketUrl = `ws://app.piberio.com:${port}/`;

const devConfig = {
	...defaultConfig,
	root: 'src',
	publicDir: '../assets',
	base: './',
	server: {
		host: 'localhost',
		port: 5173,
		proxy: {
			'/api': {
				changeOrigin: true,
				target: 'https://app.piberio.com',
			},
			'/assets': 'https://app.piberio.com',
			'/static-assets': 'https://app.piberio.com',
			'/client-assets': 'https://app.piberio.com',
			'/files': 'https://app.piberio.com',
			'/twemoji': 'https://app.piberio.com',
			'/fluent-emoji': 'https://app.piberio.com',
			'/sw.js': 'https://app.piberio.com',
			'/streaming': {
				target: 'wss://app.piberio.com',
				ws: true,
			},
			'/favicon.ico': 'https://app.piberio.com',
			'/identicon': {
				target: 'https://app.piberio.com',
				rewrite(path) {
					return path; // No es necesario reescribir el path si apunta directamente a la URL correcta
				},
			},
			'/url': 'https://app.piberio.com',
			'/proxy': 'https://app.piberio.com',
		},
	},
	build: {
		...defaultConfig.build,
		rollupOptions: {
			...defaultConfig.build?.rollupOptions,
			input: 'index.html',
		},
	},
	define: {
		...defaultConfig.define,
		_LANGS_FULL_: JSON.stringify(Object.entries(locales)),
	},
};

export default defineConfig(({ command, mode }) => devConfig);

