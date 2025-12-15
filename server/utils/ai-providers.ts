import { createAmazonBedrock } from '@ai-sdk/amazon-bedrock'
import { createAnthropic } from '@ai-sdk/anthropic'
import { createAzure, azure } from '@ai-sdk/azure'
import { createDeepSeek, deepseek } from '@ai-sdk/deepseek'
import { createGoogleGenerativeAI, google } from '@ai-sdk/google'
import { createOpenAI, openai } from '@ai-sdk/openai'
import { fromNodeProviderChain } from '@aws-sdk/credential-providers'
import { createOpenRouter } from '@openrouter/ai-sdk-provider'

// TODO: Ollama provider - to be rewritten with custom implementation

export type ProviderName =
	| 'bedrock'
	| 'openai'
	| 'anthropic'
	| 'google'
	| 'azure'
	| 'ollama'
	| 'openrouter'
	| 'deepseek'
	| 'siliconflow'

interface ModelConfig {
	model: any
	provider_options?: any
	headers?: Record<string, string>
	model_id: string
}

export interface ClientOverrides {
	provider?: string | null
	base_url?: string | null
	api_key?: string | null
	model_id?: string | null
}

// Providers that can be used with client-provided API keys
const ALLOWED_CLIENT_PROVIDERS: ProviderName[] = [
	'openai',
	'anthropic',
	'google',
	'azure',
	'openrouter',
	'deepseek',
	'siliconflow'
]

// Bedrock provider options for Anthropic beta features
const BEDROCK_ANTHROPIC_BETA = {
	bedrock: {
		anthropicBeta: ['fine-grained-tool-streaming-2025-05-14']
	}
}

// Direct Anthropic API headers for beta features
const ANTHROPIC_BETA_HEADERS = {
	'anthropic-beta': 'fine-grained-tool-streaming-2025-05-14'
}

/**
 * Safely parse integer from environment variable with validation
 */
function parseIntSafe(
	value: string | undefined,
	var_name: string,
	min?: number,
	max?: number
): number | undefined {
	if (!value) return undefined
	const parsed = Number.parseInt(value, 10)
	if (Number.isNaN(parsed)) {
		throw new Error(`${var_name} must be a valid integer, got: ${value}`)
	}
	if (min !== undefined && parsed < min) {
		throw new Error(`${var_name} must be >= ${min}, got: ${parsed}`)
	}
	if (max !== undefined && parsed > max) {
		throw new Error(`${var_name} must be <= ${max}, got: ${parsed}`)
	}
	return parsed
}

/**
 * Build provider-specific options from environment variables
 */
function buildProviderOptions(
	provider: ProviderName,
	model_id?: string
): Record<string, any> | undefined {
	const options: Record<string, any> = {}

	switch (provider) {
		case 'openai': {
			const reasoning_effort = process.env.OPENAI_REASONING_EFFORT
			const reasoning_summary = process.env.OPENAI_REASONING_SUMMARY

			// OpenAI reasoning models (o1, o3, gpt-5) need reasoningSummary
			if (
				model_id &&
				(model_id.includes('o1') ||
					model_id.includes('o3') ||
					model_id.includes('gpt-5'))
			) {
				options.openai = {
					reasoningSummary:
						(reasoning_summary as 'none' | 'brief' | 'detailed') || 'detailed'
				}
				if (reasoning_effort) {
					options.openai.reasoningEffort = reasoning_effort as
						| 'minimal'
						| 'low'
						| 'medium'
						| 'high'
				}
			} else if (reasoning_effort || reasoning_summary) {
				options.openai = {}
				if (reasoning_effort) {
					options.openai.reasoningEffort = reasoning_effort
				}
				if (reasoning_summary) {
					options.openai.reasoningSummary = reasoning_summary
				}
			}
			break
		}

		case 'anthropic': {
			const thinking_budget = parseIntSafe(
				process.env.ANTHROPIC_THINKING_BUDGET_TOKENS,
				'ANTHROPIC_THINKING_BUDGET_TOKENS',
				1024,
				64000
			)
			const thinking_type = process.env.ANTHROPIC_THINKING_TYPE || 'enabled'

			if (thinking_budget) {
				options.anthropic = {
					thinking: {
						type: thinking_type,
						budgetTokens: thinking_budget
					}
				}
			}
			break
		}

		case 'google': {
			const reasoning_effort = process.env.GOOGLE_REASONING_EFFORT
			const thinking_budget = parseIntSafe(
				process.env.GOOGLE_THINKING_BUDGET,
				'GOOGLE_THINKING_BUDGET',
				1024,
				100000
			)
			const thinking_level = process.env.GOOGLE_THINKING_LEVEL

			// Gemini 2.5/3 models think by default
			if (
				model_id &&
				(model_id.includes('gemini-2') ||
					model_id.includes('gemini-3') ||
					model_id.includes('gemini2') ||
					model_id.includes('gemini3'))
			) {
				const thinking_config: Record<string, any> = {
					includeThoughts: true
				}

				if (
					thinking_budget &&
					(model_id.includes('2.5') || model_id.includes('2-5'))
				) {
					thinking_config.thinkingBudget = thinking_budget
				} else if (
					thinking_level &&
					(model_id.includes('gemini-3') || model_id.includes('gemini3'))
				) {
					thinking_config.thinkingLevel = thinking_level as 'low' | 'high'
				}

				options.google = { thinkingConfig: thinking_config }
			} else if (reasoning_effort) {
				options.google = {
					reasoningEffort: reasoning_effort as 'low' | 'medium' | 'high'
				}
			}
			break
		}

		case 'azure': {
			const reasoning_effort = process.env.AZURE_REASONING_EFFORT
			const reasoning_summary = process.env.AZURE_REASONING_SUMMARY

			if (reasoning_effort || reasoning_summary) {
				options.azure = {}
				if (reasoning_effort) {
					options.azure.reasoningEffort = reasoning_effort
				}
				if (reasoning_summary) {
					options.azure.reasoningSummary = reasoning_summary
				}
			}
			break
		}

		case 'bedrock': {
			const budget_tokens = parseIntSafe(
				process.env.BEDROCK_REASONING_BUDGET_TOKENS,
				'BEDROCK_REASONING_BUDGET_TOKENS',
				1024,
				64000
			)
			const reasoning_effort = process.env.BEDROCK_REASONING_EFFORT

			// Bedrock reasoning ONLY for Claude and Nova models
			if (
				model_id &&
				(budget_tokens || reasoning_effort) &&
				(model_id.includes('claude') ||
					model_id.includes('anthropic') ||
					model_id.includes('nova') ||
					model_id.includes('amazon'))
			) {
				const reasoning_config: Record<string, any> = { type: 'enabled' }

				if (
					budget_tokens &&
					(model_id.includes('claude') || model_id.includes('anthropic'))
				) {
					reasoning_config.budgetTokens = budget_tokens
				} else if (
					reasoning_effort &&
					(model_id.includes('nova') || model_id.includes('amazon'))
				) {
					reasoning_config.maxReasoningEffort = reasoning_effort
				}

				options.bedrock = { reasoningConfig: reasoning_config }
			}
			break
		}

		case 'ollama': {
			const enable_thinking = process.env.OLLAMA_ENABLE_THINKING
			if (enable_thinking === 'true') {
				options.ollama = { think: true }
			}
			break
		}

		case 'deepseek':
		case 'openrouter':
		case 'siliconflow':
			break

		default:
			break
	}

	return Object.keys(options).length > 0 ? options : undefined
}

// Map of provider to required environment variable
const PROVIDER_ENV_VARS: Record<ProviderName, string | null> = {
	bedrock: null, // AWS SDK auto-uses IAM role
	openai: 'OPENAI_API_KEY',
	anthropic: 'ANTHROPIC_API_KEY',
	google: 'GOOGLE_GENERATIVE_AI_API_KEY',
	azure: 'AZURE_API_KEY',
	ollama: null, // No credentials needed
	openrouter: 'OPENROUTER_API_KEY',
	deepseek: 'DEEPSEEK_API_KEY',
	siliconflow: 'SILICONFLOW_API_KEY'
}

/**
 * Auto-detect provider based on available API keys
 */
function detectProvider(): ProviderName | null {
	const config = useRuntimeConfig()
	const configured_providers: ProviderName[] = []

	if (config.openaiApiKey) configured_providers.push('openai')
	if (config.anthropicApiKey) configured_providers.push('anthropic')
	if (config.googleApiKey) configured_providers.push('google')
	if (config.azureApiKey && (config.azureBaseUrl || config.azureResourceName)) {
		configured_providers.push('azure')
	}
	if (config.openrouterApiKey) configured_providers.push('openrouter')
	if (config.deepseekApiKey) configured_providers.push('deepseek')
	if (config.siliconflowApiKey) configured_providers.push('siliconflow')

	if (configured_providers.length === 1) {
		return configured_providers[0]
	}

	return null
}

/**
 * Get the AI model based on runtime config and optional client overrides
 */
export function getAiModel(overrides?: ClientOverrides): ModelConfig {
	const config = useRuntimeConfig()

	const is_client_override = !!(overrides?.provider && overrides?.api_key)
	const model_id = overrides?.model_id || config.aiModel

	if (!model_id) {
		if (is_client_override) {
			throw createError({
				statusCode: 400,
				statusMessage: 'Model ID is required when using custom AI provider'
			})
		}
		throw createError({
			statusCode: 500,
			statusMessage: 'AI_MODEL not configured'
		})
	}

	// Determine provider
	let provider: ProviderName
	if (overrides?.provider) {
		if (!ALLOWED_CLIENT_PROVIDERS.includes(overrides.provider as ProviderName)) {
			throw createError({
				statusCode: 400,
				statusMessage: `Invalid provider: ${overrides.provider}. Allowed: ${ALLOWED_CLIENT_PROVIDERS.join(', ')}`
			})
		}
		provider = overrides.provider as ProviderName
	} else if (config.aiProvider) {
		provider = config.aiProvider as ProviderName
	} else {
		const detected = detectProvider()
		if (detected) {
			provider = detected
			console.log(`[AI Provider] Auto-detected: ${provider}`)
		} else {
			throw createError({
				statusCode: 500,
				statusMessage: 'No AI provider configured. Set AI_PROVIDER or configure API keys.'
			})
		}
	}

	console.log(`[AI Provider] Initializing ${provider} with model: ${model_id}`)

	let model: any
	let provider_options: any
	let headers: Record<string, string> | undefined

	// Build provider-specific options
	const custom_provider_options = buildProviderOptions(provider, model_id)

	switch (provider) {
		case 'bedrock': {
			const bedrock_provider = createAmazonBedrock({
				region: config.awsRegion || 'us-west-2',
				credentialProvider: fromNodeProviderChain()
			})
			model = bedrock_provider(model_id)

			// Add Anthropic beta options for Claude models
			if (model_id.includes('anthropic.claude') || model_id.includes('claude')) {
				provider_options = {
					bedrock: {
						...BEDROCK_ANTHROPIC_BETA.bedrock,
						...(custom_provider_options?.bedrock || {})
					}
				}
			} else if (custom_provider_options) {
				provider_options = custom_provider_options
			}
			break
		}

		case 'openai': {
			const api_key = overrides?.api_key || config.openaiApiKey
			const base_url = overrides?.base_url || config.openaiBaseUrl

			if (!api_key && !is_client_override) {
				throw createError({
					statusCode: 500,
					statusMessage: 'OPENAI_API_KEY not configured'
				})
			}

			if (base_url || overrides?.api_key) {
				const custom_openai = createOpenAI({
					apiKey: api_key,
					...(base_url && { baseURL: base_url })
				})
				model = custom_openai.chat(model_id)
			} else {
				model = openai(model_id)
			}
			break
		}

		case 'anthropic': {
			const api_key = overrides?.api_key || config.anthropicApiKey
			const base_url = overrides?.base_url || config.anthropicBaseUrl || 'https://api.anthropic.com/v1'

			if (!api_key && !is_client_override) {
				throw createError({
					statusCode: 500,
					statusMessage: 'ANTHROPIC_API_KEY not configured'
				})
			}

			const custom_provider = createAnthropic({
				apiKey: api_key,
				baseURL: base_url,
				headers: ANTHROPIC_BETA_HEADERS
			})
			model = custom_provider(model_id)
			headers = ANTHROPIC_BETA_HEADERS
			break
		}

		case 'google': {
			const api_key = overrides?.api_key || config.googleApiKey
			const base_url = overrides?.base_url || config.googleBaseUrl

			if (!api_key && !is_client_override) {
				throw createError({
					statusCode: 500,
					statusMessage: 'GOOGLE_GENERATIVE_AI_API_KEY not configured'
				})
			}

			if (base_url || overrides?.api_key) {
				const custom_google = createGoogleGenerativeAI({
					apiKey: api_key,
					...(base_url && { baseURL: base_url })
				})
				model = custom_google(model_id)
			} else {
				model = google(model_id)
			}
			break
		}

		case 'azure': {
			const api_key = overrides?.api_key || config.azureApiKey
			const base_url = overrides?.base_url || config.azureBaseUrl
			const resource_name = config.azureResourceName

			if (!api_key && !is_client_override) {
				throw createError({
					statusCode: 500,
					statusMessage: 'AZURE_API_KEY not configured'
				})
			}

			if (base_url || resource_name || overrides?.api_key) {
				const custom_azure = createAzure({
					apiKey: api_key,
					...(base_url && { baseURL: base_url }),
					...(!base_url && resource_name && { resourceName: resource_name })
				})
				model = custom_azure(model_id)
			} else {
				model = azure(model_id)
			}
			break
		}

		case 'ollama': {
			// TODO: Ollama provider - to be rewritten with custom implementation
			throw createError({
				statusCode: 501,
				statusMessage: 'Ollama provider is not yet implemented. Coming soon!'
			})
		}

		case 'openrouter': {
			const api_key = overrides?.api_key || config.openrouterApiKey
			const base_url = overrides?.base_url || config.openrouterBaseUrl

			if (!api_key && !is_client_override) {
				throw createError({
					statusCode: 500,
					statusMessage: 'OPENROUTER_API_KEY not configured'
				})
			}

			const openrouter = createOpenRouter({
				apiKey: api_key,
				...(base_url && { baseURL: base_url })
			})
			model = openrouter(model_id)
			break
		}

		case 'deepseek': {
			const api_key = overrides?.api_key || config.deepseekApiKey
			const base_url = overrides?.base_url || config.deepseekBaseUrl

			if (!api_key && !is_client_override) {
				throw createError({
					statusCode: 500,
					statusMessage: 'DEEPSEEK_API_KEY not configured'
				})
			}

			if (base_url || overrides?.api_key) {
				const custom_deepseek = createDeepSeek({
					apiKey: api_key,
					...(base_url && { baseURL: base_url })
				})
				model = custom_deepseek(model_id)
			} else {
				model = deepseek(model_id)
			}
			break
		}

		case 'siliconflow': {
			const api_key = overrides?.api_key || config.siliconflowApiKey
			const base_url =
				overrides?.base_url ||
				config.siliconflowBaseUrl ||
				'https://api.siliconflow.com/v1'

			if (!api_key && !is_client_override) {
				throw createError({
					statusCode: 500,
					statusMessage: 'SILICONFLOW_API_KEY not configured'
				})
			}

			const siliconflow_provider = createOpenAI({
				apiKey: api_key,
				baseURL: base_url
			})
			model = siliconflow_provider.chat(model_id)
			break
		}

		default:
			throw createError({
				statusCode: 400,
				statusMessage: `Unknown AI provider: ${provider}`
			})
	}

	// Apply provider-specific options
	if (custom_provider_options && provider !== 'bedrock' && !provider_options) {
		provider_options = custom_provider_options
	}

	return { model, provider_options, headers, model_id }
}

/**
 * Check if a model supports prompt caching
 */
export function supportsPromptCaching(model_id: string): boolean {
	return (
		model_id.includes('claude') ||
		model_id.includes('anthropic') ||
		model_id.startsWith('us.anthropic') ||
		model_id.startsWith('eu.anthropic')
	)
}
