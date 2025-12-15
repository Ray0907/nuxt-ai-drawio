// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
	modules: [
		'@nuxt/eslint',
		'@nuxt/ui',
		'@nuxtjs/mdc'
	],

	devtools: {
		enabled: true
	},

	css: ['~/assets/css/main.css'],

	mdc: {
		headings: {
			anchorLinks: false
		},
		highlight: {
			shikiEngine: 'javascript'
		}
	},

	experimental: {
		viewTransition: true
	},

	compatibilityDate: '2024-07-11',

	nitro: {
		experimental: {
			openAPI: true
		}
	},

	runtimeConfig: {
		// Server-side only - AI Provider Configuration
		aiProvider: process.env.AI_PROVIDER || 'openai',
		aiModel: process.env.AI_MODEL || 'gpt-4o',

		// OpenAI
		openaiApiKey: process.env.OPENAI_API_KEY,
		openaiBaseUrl: process.env.OPENAI_BASE_URL,

		// Anthropic
		anthropicApiKey: process.env.ANTHROPIC_API_KEY,
		anthropicBaseUrl: process.env.ANTHROPIC_BASE_URL,

		// Google
		googleApiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
		googleBaseUrl: process.env.GOOGLE_BASE_URL,

		// AWS Bedrock
		awsRegion: process.env.AWS_REGION || 'us-west-2',

		// Azure OpenAI
		azureApiKey: process.env.AZURE_API_KEY,
		azureBaseUrl: process.env.AZURE_BASE_URL,
		azureResourceName: process.env.AZURE_RESOURCE_NAME,

		// Ollama
		ollamaBaseUrl: process.env.OLLAMA_BASE_URL,

		// OpenRouter
		openrouterApiKey: process.env.OPENROUTER_API_KEY,
		openrouterBaseUrl: process.env.OPENROUTER_BASE_URL,

		// DeepSeek
		deepseekApiKey: process.env.DEEPSEEK_API_KEY,
		deepseekBaseUrl: process.env.DEEPSEEK_BASE_URL,

		// SiliconFlow
		siliconflowApiKey: process.env.SILICONFLOW_API_KEY,
		siliconflowBaseUrl: process.env.SILICONFLOW_BASE_URL,

		// Security
		accessCodeList: process.env.ACCESS_CODE_LIST,

		// Langfuse Telemetry
		langfusePublicKey: process.env.LANGFUSE_PUBLIC_KEY,
		langfuseSecretKey: process.env.LANGFUSE_SECRET_KEY,
		langfuseBaseUrl: process.env.LANGFUSE_BASEURL,

		// Limits and Configuration
		maxOutputTokens: process.env.MAX_OUTPUT_TOKENS,
		temperature: process.env.TEMPERATURE,

		// Public (exposed to client)
		public: {
			appName: 'Nuxt AI Draw.io'
		}
	},

	eslint: {
		config: {
			stylistic: {
				commaDangle: 'never',
				braceStyle: '1tbs',
				indent: 'tab'
			}
		}
	}
})
