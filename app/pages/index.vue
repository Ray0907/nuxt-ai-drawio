<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'
import { convertToMermaid, downloadAsFile } from '~/utils/mermaid-converter'

const color_mode = useColorMode()

// Diagram state
const {
	chart_xml,
	handleExport,
	handleDiagramExport,
	loadDiagram,
	clearDiagram,
	saveDiagramToFile
} = useDiagram()

// DrawIO settings
const drawio_ui = ref<'min' | 'sketch'>('min')

// Close protection
const STORAGE_CLOSE_PROTECTION_KEY = 'nuxt-ai-drawio-close-protection'
const close_protection = ref(false)

// Chat panel ref
const chat_panel_ref = ref<{ clearChat: () => void } | null>(null)

// Load close protection preference from localStorage
onMounted(() => {
	const saved_close_protection = localStorage.getItem(STORAGE_CLOSE_PROTECTION_KEY)
	if (saved_close_protection === 'true') {
		close_protection.value = true
	}
})

// Show confirmation dialog when user tries to leave the page
onMounted(() => {
	const handleBeforeUnload = (event: BeforeUnloadEvent) => {
		if (!close_protection.value) return
		event.preventDefault()
		return ''
	}

	window.addEventListener('beforeunload', handleBeforeUnload)

	onUnmounted(() => {
		window.removeEventListener('beforeunload', handleBeforeUnload)
	})
})

// Toggle close protection
function toggleCloseProtection() {
	close_protection.value = !close_protection.value
	localStorage.setItem(STORAGE_CLOSE_PROTECTION_KEY, String(close_protection.value))
}

// Handle diagram load from chat
function handleLoadDiagram(xml: string) {
	console.log('[handleLoadDiagram] Called with xml length:', xml?.length)
	console.log('[handleLoadDiagram] XML preview:', xml?.substring(0, 200))
	const error = loadDiagram(xml)
	console.log('[handleLoadDiagram] loadDiagram returned:', error)
	if (error) {
		const toast = useToast()
		toast.add({
			description: `Diagram validation error: ${error}`,
			icon: 'i-lucide-alert-circle',
			color: 'error'
		})
	}
}

// Toggle DrawIO UI style
function toggleDrawioUi() {
	drawio_ui.value = drawio_ui.value === 'min' ? 'sketch' : 'min'
}

// Clear chat and diagram
function handleClear() {
	chat_panel_ref.value?.clearChat()
	clearDiagram()
}

// Handle manual save from draw.io (Ctrl+S or autosave)
function handleDiagramChange(xml: string) {
	loadDiagram(xml, true) // skip validation since it's from draw.io
}

// Save menu items
const save_menu_items: DropdownMenuItem[][] = [
	[
		{
			label: 'Save as PNG',
			icon: 'i-lucide-image',
			onSelect: () => saveDiagramToFile('diagram', 'png')
		},
		{
			label: 'Save as XML',
			icon: 'i-lucide-file-code',
			onSelect: () => saveDiagramToFile('diagram', 'drawio')
		},
		{
			label: 'Save as Mermaid',
			icon: 'i-lucide-git-branch',
			onSelect: () => {
				const mermaid_code = convertToMermaid(chart_xml.value)
				downloadAsFile(mermaid_code, 'diagram.mmd', 'text/plain')
			}
		}
	]
]
</script>

<template>
	<div class="h-screen flex">
		<!-- Left: DrawIO Editor -->
		<div class="flex-1 h-full border-r border-default">
			<ClientOnly>
				<DrawioEditor
					:ui="drawio_ui"
					:dark="color_mode.value === 'dark'"
					@export="handleDiagramExport"
					@change="handleDiagramChange"
				/>
				<template #fallback>
					<div class="h-full flex items-center justify-center bg-muted">
						<UIcon name="i-lucide-loader-2" class="w-8 h-8 animate-spin text-muted" />
					</div>
				</template>
			</ClientOnly>
		</div>

		<!-- Right: Chat Panel -->
		<div class="w-[480px] h-full flex flex-col bg-default">
			<!-- Header -->
			<div class="flex items-center justify-between px-4 py-3 border-b border-default">
				<div class="flex items-center gap-2">
					<UIcon name="i-lucide-pencil-ruler" class="w-5 h-5 text-primary" />
					<h1 class="font-semibold">AI Draw.io</h1>
				</div>
				<div class="flex items-center gap-1">
					<ClientOnly>
						<UTooltip text="Toggle theme">
							<UButton
								:icon="color_mode.value === 'dark' ? 'i-lucide-sun' : 'i-lucide-moon'"
								color="neutral"
								variant="ghost"
								size="sm"
								@click="color_mode.preference = color_mode.value === 'dark' ? 'light' : 'dark'"
							/>
						</UTooltip>
					</ClientOnly>
					<UTooltip :text="`Style: ${drawio_ui === 'min' ? 'Minimal' : 'Sketch'}`">
						<UButton
							icon="i-lucide-palette"
							color="neutral"
							variant="ghost"
							size="sm"
							@click="toggleDrawioUi"
						/>
					</UTooltip>
					<UTooltip :text="close_protection ? 'Close protection: ON' : 'Close protection: OFF'">
						<UButton
							:icon="close_protection ? 'i-lucide-shield-check' : 'i-lucide-shield'"
							:color="close_protection ? 'primary' : 'neutral'"
							variant="ghost"
							size="sm"
							@click="toggleCloseProtection"
						/>
					</UTooltip>
					<UDropdownMenu :items="save_menu_items">
						<UTooltip text="Save diagram">
							<UButton
								icon="i-lucide-download"
								color="neutral"
								variant="ghost"
								size="sm"
							/>
						</UTooltip>
					</UDropdownMenu>
					<UTooltip text="Clear chat">
						<UButton
							icon="i-lucide-trash-2"
							color="neutral"
							variant="ghost"
							size="sm"
							@click="handleClear"
						/>
					</UTooltip>
				</div>
			</div>

			<!-- Chat Panel -->
			<ClientOnly>
				<ChatPanel
					ref="chat_panel_ref"
					:chart-xml="chart_xml"
					@load-diagram="handleLoadDiagram"
					@export="handleExport"
				/>
				<template #fallback>
					<div class="flex-1 flex flex-col items-center justify-center gap-6 px-6">
						<div class="text-center">
							<h2 class="text-xl font-semibold mb-2">Create diagrams with AI</h2>
							<p class="text-muted text-sm">Describe what you want to draw and I'll create it for you</p>
						</div>
					</div>
				</template>
			</ClientOnly>
		</div>
	</div>
</template>
