/**
 * Model selection composable
 * Manages AI provider and model selection with persistence
 */

export interface ProviderConfig {
	id: string
	name: string
	icon: string
	default_model: string
	models: string[]
	requires_api_key: boolean
	base_url_placeholder?: string
}

const STORAGE_PROVIDER_KEY = 'nuxt-ai-drawio-provider'
const STORAGE_MODEL_KEY = 'nuxt-ai-drawio-model'
const STORAGE_API_KEY_PREFIX = 'nuxt-ai-drawio-apikey-'
const STORAGE_BASE_URL_PREFIX = 'nuxt-ai-drawio-baseurl-'

// Available providers configuration
const PROVIDERS: ProviderConfig[] = [
	{
		id: 'default',
		name: 'Default',
		icon: 'i-lucide-server',
		default_model: '',
		models: [],
		requires_api_key: false
	},
	{
		id: 'openai',
		name: 'OpenAI',
		icon: 'i-simple-icons-openai',
		default_model: 'gpt-4o',
		models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'o1', 'o1-mini', 'o3-mini'],
		requires_api_key: true
	},
	{
		id: 'anthropic',
		name: 'Anthropic',
		icon: 'i-simple-icons-anthropic',
		default_model: 'claude-sonnet-4-20250514',
		models: [
			'claude-sonnet-4-20250514',
			'claude-opus-4-20250514',
			'claude-3-7-sonnet-20250219',
			'claude-3-5-sonnet-20241022',
			'claude-3-5-haiku-20241022'
		],
		requires_api_key: true
	},
	{
		id: 'google',
		name: 'Google',
		icon: 'i-simple-icons-google',
		default_model: 'gemini-2.5-flash-preview-05-20',
		models: [
			'gemini-2.5-flash-preview-05-20',
			'gemini-2.5-pro-preview-05-06',
			'gemini-2.0-flash',
			'gemini-2.0-flash-lite',
			'gemini-1.5-pro',
			'gemini-1.5-flash'
		],
		requires_api_key: true
	},
	{
		id: 'openrouter',
		name: 'OpenRouter',
		icon: 'i-lucide-route',
		default_model: 'anthropic/claude-sonnet-4',
		models: [
			'anthropic/claude-sonnet-4',
			'anthropic/claude-3.5-sonnet',
			'openai/gpt-4o',
			'google/gemini-2.0-flash-exp:free',
			'deepseek/deepseek-chat-v3-0324'
		],
		requires_api_key: true
	},
	{
		id: 'deepseek',
		name: 'DeepSeek',
		icon: 'i-lucide-brain',
		default_model: 'deepseek-chat',
		models: ['deepseek-chat', 'deepseek-reasoner'],
		requires_api_key: true
	},
	{
		id: 'azure',
		name: 'Azure OpenAI',
		icon: 'i-simple-icons-microsoftazure',
		default_model: 'gpt-4o',
		models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo'],
		requires_api_key: true,
		base_url_placeholder: 'https://your-resource.openai.azure.com'
	},
	{
		id: 'siliconflow',
		name: 'SiliconFlow',
		icon: 'i-lucide-cpu',
		default_model: 'deepseek-ai/DeepSeek-V3',
		models: [
			'deepseek-ai/DeepSeek-V3',
			'Qwen/Qwen2.5-72B-Instruct',
			'meta-llama/Llama-3.3-70B-Instruct'
		],
		requires_api_key: true
	}
]

export function useModels() {
	// Reactive state
	const provider_id = useState<string>('model-provider', () => 'default')
	const model_id = useState<string>('model-id', () => '')
	const custom_model = useState<string>('custom-model', () => '')

	// API keys and base URLs stored per provider
	const api_keys = useState<Record<string, string>>('api-keys', () => ({}))
	const base_urls = useState<Record<string, string>>('base-urls', () => ({}))

	// Computed
	const current_provider = computed((): ProviderConfig => {
		const found = PROVIDERS.find(p => p.id === provider_id.value)
		if (found) return found
		return PROVIDERS[0] as ProviderConfig
	})

	const current_model = computed(() => {
		if (provider_id.value === 'default') {
			return ''
		}
		return custom_model.value || model_id.value || current_provider.value.default_model
	})

	const current_api_key = computed(() => {
		return api_keys.value[provider_id.value] || ''
	})

	const current_base_url = computed(() => {
		return base_urls.value[provider_id.value] || ''
	})

	const is_configured = computed(() => {
		if (provider_id.value === 'default') {
			return true
		}
		if (!current_provider.value.requires_api_key) {
			return true
		}
		return !!current_api_key.value
	})

	const display_name = computed((): string => {
		if (provider_id.value === 'default') {
			return 'Default'
		}
		const provider = current_provider.value
		const model = current_model.value
		if (!model) {
			return provider.name
		}
		// Format model name for display
		const model_name = model.split('/').pop() || model
		return model_name
			.split('-')
			.map(word => {
				const lower = word.toLowerCase()
				if (['gpt', 'ai'].includes(lower)) {
					return word.toUpperCase()
				}
				return word.charAt(0).toUpperCase() + word.slice(1)
			})
			.join(' ')
	})

	// Load from localStorage on client
	function loadFromStorage() {
		if (import.meta.client) {
			const saved_provider = localStorage.getItem(STORAGE_PROVIDER_KEY)
			const saved_model = localStorage.getItem(STORAGE_MODEL_KEY)

			if (saved_provider) {
				provider_id.value = saved_provider
			}
			if (saved_model) {
				model_id.value = saved_model
			}

			// Load API keys for all providers
			for (const provider of PROVIDERS) {
				const key = localStorage.getItem(STORAGE_API_KEY_PREFIX + provider.id)
				if (key) {
					api_keys.value[provider.id] = key
				}
				const url = localStorage.getItem(STORAGE_BASE_URL_PREFIX + provider.id)
				if (url) {
					base_urls.value[provider.id] = url
				}
			}
		}
	}

	// Save to localStorage
	function saveToStorage() {
		if (import.meta.client) {
			localStorage.setItem(STORAGE_PROVIDER_KEY, provider_id.value)
			localStorage.setItem(STORAGE_MODEL_KEY, model_id.value)

			// Save API keys
			for (const [id, key] of Object.entries(api_keys.value)) {
				if (key) {
					localStorage.setItem(STORAGE_API_KEY_PREFIX + id, key)
				} else {
					localStorage.removeItem(STORAGE_API_KEY_PREFIX + id)
				}
			}

			// Save base URLs
			for (const [id, url] of Object.entries(base_urls.value)) {
				if (url) {
					localStorage.setItem(STORAGE_BASE_URL_PREFIX + id, url)
				} else {
					localStorage.removeItem(STORAGE_BASE_URL_PREFIX + id)
				}
			}
		}
	}

	// Set provider
	function setProvider(id: string) {
		provider_id.value = id
		const provider = PROVIDERS.find(p => p.id === id)
		if (provider && provider.default_model) {
			model_id.value = provider.default_model
		}
		custom_model.value = ''
		saveToStorage()
	}

	// Set model
	function setModel(model: string) {
		model_id.value = model
		custom_model.value = ''
		saveToStorage()
	}

	// Set custom model
	function setCustomModel(model: string) {
		custom_model.value = model
		saveToStorage()
	}

	// Set API key for current provider
	function setApiKey(key: string) {
		api_keys.value = { ...api_keys.value, [provider_id.value]: key }
		saveToStorage()
	}

	// Set base URL for current provider
	function setBaseUrl(url: string) {
		base_urls.value = { ...base_urls.value, [provider_id.value]: url }
		saveToStorage()
	}

	// Get headers for API request
	function getRequestHeaders(): Record<string, string> {
		if (provider_id.value === 'default' || !is_configured.value) {
			return {}
		}

		const headers: Record<string, string> = {
			'x-ai-provider': provider_id.value
		}

		if (current_api_key.value) {
			headers['x-ai-api-key'] = current_api_key.value
		}

		if (current_base_url.value) {
			headers['x-ai-base-url'] = current_base_url.value
		}

		if (current_model.value) {
			headers['x-ai-model'] = current_model.value
		}

		return headers
	}

	// Initialize on mount
	onMounted(() => {
		loadFromStorage()
	})

	return {
		// State
		providers: PROVIDERS,
		provider_id: readonly(provider_id),
		model_id: readonly(model_id),
		custom_model: readonly(custom_model),
		api_keys: readonly(api_keys),
		base_urls: readonly(base_urls),

		// Computed
		current_provider,
		current_model,
		current_api_key,
		current_base_url,
		is_configured,
		display_name,

		// Methods
		setProvider,
		setModel,
		setCustomModel,
		setApiKey,
		setBaseUrl,
		getRequestHeaders,
		loadFromStorage
	}
}
