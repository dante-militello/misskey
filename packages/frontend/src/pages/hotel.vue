<template>
<MkStickyContainer>
	<template #header><MkPageHeader/></template>
	  
	<MkSpacer :contentMax="5000">
		<div class="_gaps">
			<iframe ref="iframeRef" class="framehabbo" height="100%" frameborder="0"></iframe>
		</div>
	</MkSpacer>
</MkStickyContainer>
</template>
	  
<script lang="ts">
import { definePageMetadata } from '@/scripts/page-metadata.js';
import { i18n } from '@/i18n.js';
import { instance } from '@/instance.js';
	
definePageMetadata(() => ({
	title: 'Hotel Piberio',
	icon: 'ti ti-ad',
}));
	
const theJsonData = {
	'id': '15',
	'nombre': 'nuevaprueba@app.piberio.com',
	'token': 'gC!x4kñlasdk1j23',
	'iat': 1516239022,
};
	
// Codificar a base64 sin usar Buffer
const base64url = (str) => {
	return btoa(unescape(encodeURIComponent(str)))
		.replace(/\+/g, '-')
		.replace(/\//g, '_')
		.replace(/=/g, '');
};
	
// Generar el JWT manualmente
const generateJWT = async (payload, secretKey) => {
	const header = {
		alg: 'HS256',
		typ: 'JWT',
	};

	const encodedHeader = base64url(JSON.stringify(header));
	const encodedPayload = base64url(JSON.stringify(payload)); // Codificar sin usar encodeURIComponent
	const signature = base64url(
		await window.crypto.subtle
			.importKey(
				'raw',
				new TextEncoder().encode(secretKey),
				{ name: 'HMAC', hash: { name: 'SHA-256' } },
				false,
				['sign'],
			)
			.then((key) =>
				window.crypto.subtle.sign(
					'HMAC',
					key,
					new TextEncoder().encode(`${encodedHeader}.${encodedPayload}`),
				),
			),
	);

	return `${encodedHeader}.${encodedPayload}.${signature}`;
};
	
export default {
	mounted() {
		const secretKey = '8Da%o#K4n8EXaw';
		generateJWT(theJsonData, secretKey).then(token => {
			console.log('JWT generado:', token);
	
			// Construir la URL del iframe con el JWT como parámetro
			const iframeSrc = `https://hotel.piberio.com/auth?jwt=${token}`;
	
			// Acceder al elemento iframe y establecer su src
			if (this.$refs.iframeRef) {
				this.$refs.iframeRef.src = iframeSrc;
			} else {
				console.error('No se encontró el elemento iframe');
			}
		});
	},
};
</script>
	  
	<style>
	.framehabbo {
		border: 0px solid;
		width: 100%;
		height: 80vh;
	}
	</style>
	
