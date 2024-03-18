<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

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
	
<script lang="ts" setup>
import { definePageMetadata } from '@/scripts/page-metadata.js';

definePageMetadata(() => ({
	title: 'Hotel Piberio',
	icon: 'ti ti-ad',
}));
</script>

<script lang="ts">
import { miLocalStorage } from '@/local-storage.js';
	
export default {
	mounted() {
		const miData = miLocalStorage.getItem('account');
		const objUsrData = JSON.parse(miData);
		const theJsonData = {
			'nombre': objUsrData.username + '@app.piberio.com',
			'token': objUsrData.token,
		};
		console.log('User Token: ' + objUsrData.token);
		const jsonDataString = JSON.stringify(theJsonData);
		const encodedUriComponent = btoa(encodeURIComponent(jsonDataString));

		// console.log(miData);
		// console.log('XX_ObjectoJSon:', theJsonData);
		// console.log('XX_ResultadoStringify:', jsonDataString);
		// console.log('XX_Datos codificados en Base64:', encodedUriComponent);
	
		// Ahora construimos la URL del iframe con los datos codificados como parámetro
		const iframeSrc = `https://hotel.piberio.com/auth?token=${encodedUriComponent}`;
	
		// Acceder al elemento iframe y establecer su src
		if (this.$refs.iframeRef) {
			this.$refs.iframeRef.src = iframeSrc;
		} else {
			console.error('No se encontró el elemento iframe');
		}
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
