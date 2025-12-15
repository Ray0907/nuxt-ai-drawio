<script setup lang="ts">
/**
 * Draw.io Editor Vue Wrapper Component
 * Embeds the Draw.io editor via iframe and handles message-based communication
 */

interface Props {
	ui?: 'min' | 'sketch'
	dark?: boolean
	lang?: string
}

const props = withDefaults(defineProps<Props>(), {
	ui: 'min',
	dark: false,
	lang: 'en'
})

const emit = defineEmits<{
	(e: 'load'): void
	(e: 'export', data: { data: string }): void
	(e: 'change', xml: string): void
}>()

const { setDrawioRef, onDrawioLoad } = useDiagram()

const iframe_ref = ref<HTMLIFrameElement | null>(null)
const is_ready = ref(false)
const pending_action = ref<{ type: string; data: any } | null>(null)

// Build Draw.io URL with parameters (matching react-drawio)
const drawio_url = computed(() => {
	const params = new URLSearchParams({
		embed: '1',
		proto: 'json',
		ui: props.ui,
		spin: '1',
		libraries: '0',
		saveAndExit: '0',
		noSaveBtn: '1',
		noExitBtn: '1',
		dark: props.dark ? '1' : '0',
		lang: props.lang
	})
	return `https://embed.diagrams.net/?${params.toString()}`
})

// API methods exposed to parent components
function load(options: { xml: string }) {
	if (!is_ready.value || !iframe_ref.value?.contentWindow) {
		pending_action.value = { type: 'load', data: options }
		return
	}

	const message = {
		action: 'load',
		xml: options.xml,
		autosave: 1
	}
	iframe_ref.value.contentWindow.postMessage(JSON.stringify(message), '*')
}

function exportDiagram(options: { format: string }) {
	if (!is_ready.value || !iframe_ref.value?.contentWindow) {
		pending_action.value = { type: 'export', data: options }
		return
	}

	const message = {
		action: 'export',
		format: options.format,
		xml: true,
		spinKey: 'export'
	}
	iframe_ref.value.contentWindow.postMessage(JSON.stringify(message), '*')
}

// Empty diagram XML for initial load
const EMPTY_DIAGRAM = '<mxfile><diagram name="Page-1" id="page-1"><mxGraphModel><root><mxCell id="0"/><mxCell id="1" parent="0"/></root></mxGraphModel></diagram></mxfile>'

// Handle messages from Draw.io iframe
function handleMessage(event: MessageEvent) {
	if (!event.data || typeof event.data !== 'string') return

	try {
		const msg = JSON.parse(event.data)

		switch (msg.event) {
			case 'init':
				is_ready.value = true
				onDrawioLoad()
				emit('load')

				// Process pending action if any, otherwise load empty diagram
				if (pending_action.value) {
					const { type, data } = pending_action.value
					pending_action.value = null
					if (type === 'load') {
						load(data)
					} else if (type === 'export') {
						exportDiagram(data)
					}
				} else {
					// Send initial load to complete draw.io initialization
					load({ xml: EMPTY_DIAGRAM })
				}
				break

			case 'export':
				emit('export', { data: msg.data })
				break

			case 'autosave':
			case 'save':
				emit('change', msg.xml)
				break
		}
	} catch {
		// Ignore non-JSON messages
	}
}

// Register message listener
onMounted(() => {
	window.addEventListener('message', handleMessage)

	// Expose API methods via ref
	const api = {
		load,
		exportDiagram
	}
	setDrawioRef(api)
})

onUnmounted(() => {
	window.removeEventListener('message', handleMessage)
	setDrawioRef(null)
})

// Expose methods for parent access
defineExpose({
	load,
	exportDiagram
})
</script>

<template>
	<iframe
		ref="iframe_ref"
		:src="drawio_url"
		class="w-full h-full border-0"
		allow="clipboard-read; clipboard-write"
	/>
</template>
