<script setup lang="ts">
const color_mode = useColorMode()

const color = computed(() => color_mode.value === 'dark' ? '#1b1718' : 'white')

useHead({
	meta: [
		{ charset: 'utf-8' },
		{ name: 'viewport', content: 'width=device-width, initial-scale=1' },
		{ key: 'theme-color', name: 'theme-color', content: color }
	],
	link: [
		{ rel: 'icon', href: '/favicon.ico' }
	],
	htmlAttrs: {
		lang: 'en'
	}
})

const title = 'Nuxt AI Draw.io'
const description = 'AI-powered diagram editor - create and edit draw.io diagrams with natural language'

useSeoMeta({
	title,
	description,
	ogTitle: title,
	ogDescription: description,
	twitterCard: 'summary_large_image'
})
</script>

<template>
	<UApp :toaster="{ position: 'top-right' }" :tooltip="{ delayDuration: 200 }">
		<NuxtLoadingIndicator color="var(--ui-primary)" />
		<NuxtPage />
	</UApp>
</template>
