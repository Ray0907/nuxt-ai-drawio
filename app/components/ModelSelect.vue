<script setup lang="ts">
const {
	providers,
	provider_id,
	model_id,
	custom_model,
	current_provider,
	current_api_key,
	current_base_url,
	is_configured,
	display_name,
	setProvider,
	setModel,
	setCustomModel,
	setApiKey,
	setBaseUrl
} = useModels()

const is_open = ref(false)
const show_api_key = ref(false)
const local_api_key = ref('')
const local_base_url = ref('')
const local_custom_model = ref('')

// Sync local state when modal opens
watch(is_open, (open) => {
	if (open) {
		local_api_key.value = current_api_key.value
		local_base_url.value = current_base_url.value
		local_custom_model.value = custom_model.value
	}
})

// Provider items for dropdown
const provider_items = computed(() => {
	return providers.map(p => ({
		label: p.name,
		value: p.id,
		icon: p.icon
	}))
})

// Model items for current provider
const model_items = computed(() => {
	const provider = current_provider.value
	return provider.models.map(m => ({
		label: formatModelName(m),
		value: m
	}))
})

function formatModelName(model: string): string {
	const name = model.split('/').pop() || model
	return name
		.split('-')
		.map(word => {
			const lower = word.toLowerCase()
			if (['gpt', 'ai'].includes(lower)) {
				return word.toUpperCase()
			}
			return word.charAt(0).toUpperCase() + word.slice(1)
		})
		.join(' ')
}

function handleProviderChange(value: string) {
	setProvider(value)
	local_api_key.value = ''
	local_base_url.value = ''
	local_custom_model.value = ''
}

function handleModelChange(value: string) {
	setModel(value)
	local_custom_model.value = ''
}

function handleSave() {
	if (local_api_key.value !== current_api_key.value) {
		setApiKey(local_api_key.value)
	}
	if (local_base_url.value !== current_base_url.value) {
		setBaseUrl(local_base_url.value)
	}
	if (local_custom_model.value !== custom_model.value) {
		setCustomModel(local_custom_model.value)
	}
	is_open.value = false
}

function handleReset() {
	setProvider('default')
	local_api_key.value = ''
	local_base_url.value = ''
	local_custom_model.value = ''
	is_open.value = false
}
</script>

<template>
	<UPopover v-model:open="is_open">
		<UButton
			:icon="current_provider.icon"
			color="neutral"
			variant="ghost"
			size="xs"
			class="gap-1"
			:class="{ 'text-warning': !is_configured && provider_id !== 'default' }"
		>
			<span class="text-xs truncate max-w-24">{{ display_name }}</span>
			<UIcon name="i-lucide-chevron-down" class="w-3 h-3" />
		</UButton>

		<template #content>
			<div class="p-4 w-80 space-y-4">
				<div class="flex items-center justify-between">
					<h3 class="font-medium">AI Provider</h3>
					<UButton
						v-if="provider_id !== 'default'"
						size="xs"
						color="neutral"
						variant="ghost"
						@click="handleReset"
					>
						Reset
					</UButton>
				</div>

				<!-- Provider Selection -->
				<UFormField label="Provider">
					<USelectMenu
						:model-value="provider_id"
						:items="provider_items"
						value-key="value"
						class="w-full"
						@update:model-value="handleProviderChange"
					>
						<template #leading="{ modelValue }">
							<UIcon
								v-if="providers.find(p => p.id === modelValue)?.icon"
								:name="providers.find(p => p.id === modelValue)?.icon || ''"
								class="w-4 h-4"
							/>
						</template>
					</USelectMenu>
				</UFormField>

				<!-- Model Selection (hidden for default) -->
				<template v-if="provider_id !== 'default'">
					<UFormField label="Model">
						<USelectMenu
							:model-value="model_id"
							:items="model_items"
							value-key="value"
							class="w-full"
							@update:model-value="handleModelChange"
						/>
					</UFormField>

					<!-- Custom Model Input -->
					<UFormField label="Custom Model (optional)" hint="Override preset models">
						<UInput
							v-model="local_custom_model"
							placeholder="e.g., gpt-4o-2024-11-20"
							size="sm"
						/>
					</UFormField>

					<!-- API Key -->
					<UFormField
						v-if="current_provider.requires_api_key"
						label="API Key"
						:hint="is_configured ? 'Configured' : 'Required'"
					>
						<UInput
							v-model="local_api_key"
							:type="show_api_key ? 'text' : 'password'"
							placeholder="sk-..."
							size="sm"
						>
							<template #trailing>
								<UButton
									:icon="show_api_key ? 'i-lucide-eye-off' : 'i-lucide-eye'"
									color="neutral"
									variant="ghost"
									size="xs"
									@click="show_api_key = !show_api_key"
								/>
							</template>
						</UInput>
					</UFormField>

					<!-- Base URL (optional) -->
					<UFormField
						v-if="current_provider.base_url_placeholder"
						label="Base URL (optional)"
					>
						<UInput
							v-model="local_base_url"
							:placeholder="current_provider.base_url_placeholder"
							size="sm"
						/>
					</UFormField>
				</template>

				<!-- Save Button -->
				<div class="flex justify-end gap-2 pt-2">
					<UButton
						color="neutral"
						variant="ghost"
						size="sm"
						@click="is_open = false"
					>
						Cancel
					</UButton>
					<UButton
						color="primary"
						size="sm"
						@click="handleSave"
					>
						Save
					</UButton>
				</div>
			</div>
		</template>
	</UPopover>
</template>
