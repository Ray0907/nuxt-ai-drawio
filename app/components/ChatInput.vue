<script setup lang="ts">
const props = defineProps<{
	chat: any
	modelValue: string
}>()

const emit = defineEmits<{
	(e: 'update:modelValue', value: string): void
	(e: 'submit', event: Event): void
}>()

const input = computed({
	get: () => props.modelValue,
	set: (value) => emit('update:modelValue', value)
})

function handleSubmit(e: Event) {
	emit('submit', e)
}

function handleStop() {
	props.chat?.stop?.()
}

function handleReload() {
	props.chat?.regenerate?.()
}
</script>

<template>
	<UChatPrompt
		v-model="input"
		:error="chat.error"
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

			<UChatPromptSubmit
				:status="chat.status"
				color="neutral"
				size="sm"
				@stop="handleStop"
				@reload="handleReload"
			/>
		</template>
	</UChatPrompt>
</template>
