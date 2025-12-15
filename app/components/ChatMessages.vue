<script setup lang="ts">
import type { DefineComponent } from 'vue'
import type { UIMessage } from 'ai'
import ProseStreamPre from './prose/PreStream.vue'

const components = {
	pre: ProseStreamPre as unknown as DefineComponent
}

interface QuickPrompt {
	label: string
	icon: string
}

const props = defineProps<{
	chat: any
	copied: boolean
	quickPrompts: QuickPrompt[]
}>()

const emit = defineEmits<{
	(e: 'copy', event: MouseEvent, message: UIMessage): void
	(e: 'startChat', prompt: string): void
}>()

function handleCopy(e: MouseEvent, message: UIMessage) {
	emit('copy', e, message)
}
</script>

<template>
	<template v-if="chat.messages.length > 0">
		<UChatMessages
			should-auto-scroll
			:messages="chat.messages"
			:status="chat.status"
			:assistant="chat.status !== 'streaming' ? { actions: [{ label: 'Copy', icon: copied ? 'i-lucide-copy-check' : 'i-lucide-copy', onClick: handleCopy }] } : { actions: [] }"
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
		<div class="flex flex-wrap justify-center gap-2">
			<UButton
				v-for="prompt in quickPrompts"
				:key="prompt.label"
				:icon="prompt.icon"
				:label="prompt.label"
				size="sm"
				color="neutral"
				variant="outline"
				class="rounded-full"
				@click="emit('startChat', prompt.label)"
			/>
		</div>
	</div>
</template>
