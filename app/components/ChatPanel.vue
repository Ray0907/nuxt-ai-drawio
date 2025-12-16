<script setup lang="ts">
import type { DefineComponent } from 'vue'
import { Chat } from '@ai-sdk/vue'
import { DefaultChatTransport } from 'ai'
import type { UIMessage } from 'ai'
import { useClipboard } from '@vueuse/core'
import { getTextFromMessage } from '@nuxt/ui/utils/ai'
import ProseStreamPre from './prose/PreStream.vue'

const components = {
	pre: ProseStreamPre as unknown as DefineComponent
}

const props = defineProps<{
	chartXml: string
}>()

const emit = defineEmits<{
	(e: 'loadDiagram', xml: string): void
	(e: 'export'): void
}>()

const toast = useToast()
const clipboard = useClipboard()

// Model selection
const { getRequestHeaders, is_configured, provider_id } = useModels()

// Chat state
const input = ref('')
const previous_xml = ref('')
const is_ready = ref(false)

// Ref to track latest chartXml for use in callbacks (avoids stale closure)
const chart_xml_ref = ref('')
watch(() => props.chartXml, (val) => {
	chart_xml_ref.value = val
}, { immediate: true })

// Chat instance
let chat: Chat | null = null

// Quick prompts
const quick_prompts = [
	{ label: 'Create a flowchart', icon: 'i-lucide-git-branch' },
	{ label: 'Draw a system architecture', icon: 'i-lucide-server' },
	{ label: 'Create an ER diagram', icon: 'i-lucide-database' },
	{ label: 'Make a mind map', icon: 'i-lucide-brain' }
]

// Ref to accumulate partial XML when output is truncated
const partial_xml_ref = ref('')

// Check if mxCell XML is complete (last tag is properly closed)
function isMxCellXmlComplete(xml: string): boolean {
	const trimmed = xml.trim()
	// Check if ends with a complete tag
	return trimmed.endsWith('/>') || trimmed.endsWith('</mxCell>') || trimmed.endsWith('</mxGeometry>')
}

onMounted(() => {
	chat = new Chat({
		id: 'main-chat',
		transport: new DefaultChatTransport({
			api: '/api/chat',
			headers: () => getRequestHeaders(),
			body: () => ({
				xml: props.chartXml,
				previous_xml: previous_xml.value
			})
		}),
		onError(error) {
			const { message } = typeof error.message === 'string' && error.message[0] === '{'
				? JSON.parse(error.message)
				: error
			toast.add({
				description: message,
				icon: 'i-lucide-alert-circle',
				color: 'error',
				duration: 0
			})
		},
		async onToolCall({ toolCall }) {
			console.log('[onToolCall] Tool:', toolCall.toolName, 'CallId:', toolCall.toolCallId)

			if (toolCall.toolName === 'display_diagram') {
				const { xml } = toolCall.input as { xml: string }
				console.log('[display_diagram] XML length:', xml.length)

				// Check if XML is truncated
				const is_truncated = !isMxCellXmlComplete(xml)
				console.log('[display_diagram] isTruncated:', is_truncated)

				if (is_truncated) {
					// Store partial XML for continuation
					partial_xml_ref.value = xml
					chat!.addToolOutput({
						state: 'output-error',
						tool: 'display_diagram',
						toolCallId: toolCall.toolCallId,
						errorText: `Output was truncated. Use append_diagram to continue from: ${xml.slice(-200)}`
					})
					return
				}

				// Complete XML - load it
				partial_xml_ref.value = ''
				console.log('[display_diagram] Emitting loadDiagram')
				emit('loadDiagram', xml)
				emit('export')

				chat!.addToolOutput({
					tool: 'display_diagram',
					toolCallId: toolCall.toolCallId,
					output: 'Diagram displayed successfully'
				})
			} else if (toolCall.toolName === 'append_diagram') {
				const { xml } = toolCall.input as { xml: string }

				// Append to accumulated XML
				partial_xml_ref.value += xml
				const is_complete = isMxCellXmlComplete(partial_xml_ref.value)

				if (is_complete) {
					const final_xml = partial_xml_ref.value
					partial_xml_ref.value = ''
					emit('loadDiagram', final_xml)
					emit('export')
					chat!.addToolOutput({
						tool: 'append_diagram',
						toolCallId: toolCall.toolCallId,
						output: 'Diagram assembly complete'
					})
				} else {
					chat!.addToolOutput({
						state: 'output-error',
						tool: 'append_diagram',
						toolCallId: toolCall.toolCallId,
						errorText: `Still incomplete. Continue from: ${partial_xml_ref.value.slice(-200)}`
					})
				}
			} else if (toolCall.toolName === 'edit_diagram') {
				const { edits } = toolCall.input as { edits: Array<{ search: string; replace: string }> }

				let current = chart_xml_ref.value
				let edit_count = 0
				for (const edit of edits) {
					if (current.includes(edit.search)) {
						current = current.replace(edit.search, edit.replace)
						edit_count++
					}
				}

				if (edit_count > 0) {
					emit('loadDiagram', current)
					emit('export')
					chat!.addToolOutput({
						tool: 'edit_diagram',
						toolCallId: toolCall.toolCallId,
						output: `Applied ${edit_count} edit(s)`
					})
				} else {
					chat!.addToolOutput({
						state: 'output-error',
						tool: 'edit_diagram',
						toolCallId: toolCall.toolCallId,
						errorText: 'No matching patterns found in current diagram'
					})
				}
			}
		}
	})
	is_ready.value = true
})

// Reactive getters for chat state
const messages = computed(() => chat?.messages || [])
const status = computed(() => chat?.status || 'ready')
const error = computed(() => chat?.error)

// Handle submit
function handleSubmit(e: Event) {
	e.preventDefault()
	if (input.value.trim() && chat) {
		previous_xml.value = props.chartXml
		chat.sendMessage({ text: input.value })
		input.value = ''
	}
}

// Copy message
const copied = ref(false)
function copy(e: MouseEvent, message: UIMessage) {
	clipboard.copy(getTextFromMessage(message))
	copied.value = true
	setTimeout(() => { copied.value = false }, 2000)
}

function startQuickChat(prompt: string) {
	input.value = prompt
	handleSubmit(new Event('submit'))
}

function clearChat() {
	chat?.setMessages([])
	partial_xml_ref.value = ''
}

defineExpose({ clearChat })
</script>

<template>
	<div class="h-full flex flex-col">
		<!-- Messages -->
		<div class="flex-1 overflow-hidden">
			<template v-if="is_ready && messages.length > 0">
				<UChatMessages
					should-auto-scroll
					:messages="messages"
					:status="status"
					:assistant="status !== 'streaming' ? { actions: [{ label: 'Copy', icon: copied ? 'i-lucide-copy-check' : 'i-lucide-copy', onClick: copy }] } : { actions: [] }"
					:spacing-offset="120"
					class="h-full px-4 py-4"
				>
					<template #content="{ message }">
						<template v-for="(part, index) in message.parts" :key="`${message.id}-${part.type}-${index}`">
							<Reasoning
								v-if="part.type === 'reasoning'"
								:text="part.text"
								:is-streaming="part.state !== 'done'"
							/>
							<MDCCached
								v-else-if="part.type === 'text'"
								:value="part.text"
								:cache-key="`${message.id}-${index}`"
								:components="components"
								:parser-options="{ highlight: false }"
								class="*:first:mt-0 *:last:mb-0"
							/>
							<div
								v-else-if="part.type === 'tool-display_diagram' || part.type === 'tool-edit_diagram' || part.type === 'tool-append_diagram'"
								class="flex items-center gap-2 text-sm text-muted py-1"
							>
								<UIcon name="i-lucide-check-circle" class="w-4 h-4 text-success" />
								<span>Diagram updated</span>
							</div>
						</template>
					</template>
				</UChatMessages>
			</template>

			<!-- Empty state -->
			<div v-else class="h-full flex flex-col items-center justify-center gap-6 px-6">
				<div class="text-center">
					<h2 class="text-xl font-semibold mb-2">Create diagrams with AI</h2>
					<p class="text-muted text-sm">Describe what you want to draw and I'll create it for you</p>
				</div>
				<div v-if="is_ready" class="flex flex-wrap justify-center gap-2">
					<UButton
						v-for="prompt in quick_prompts"
						:key="prompt.label"
						:icon="prompt.icon"
						:label="prompt.label"
						size="sm"
						color="neutral"
						variant="outline"
						class="rounded-full"
						@click="startQuickChat(prompt.label)"
					/>
				</div>
			</div>
		</div>

		<!-- Input -->
		<div class="px-4 pb-4">
			<UChatPrompt
				v-if="is_ready"
				v-model="input"
				:error="error"
				variant="subtle"
				class="rounded-b-none"
				:ui="{ base: 'px-1.5' }"
				@submit="handleSubmit"
			>
				<template #footer>
					<div class="flex items-center gap-1">
						<UTooltip text="Upload image">
							<UButton
								icon="i-lucide-paperclip"
								color="neutral"
								variant="ghost"
								size="sm"
								disabled
							/>
						</UTooltip>
						<UTooltip text="History">
							<UButton
								icon="i-lucide-history"
								color="neutral"
								variant="ghost"
								size="sm"
								disabled
							/>
						</UTooltip>
					</div>

					<div class="flex items-center gap-1">
						<ModelSelect />
						<UChatPromptSubmit
							:status="status"
							color="neutral"
							size="sm"
							@stop="chat?.stop()"
							@reload="chat?.regenerate()"
						/>
					</div>
				</template>
			</UChatPrompt>
			<div v-else class="h-12 bg-muted rounded-lg animate-pulse" />
		</div>
	</div>
</template>
