import {
	APICallError,
	convertToModelMessages,
	createUIMessageStream,
	createUIMessageStreamResponse,
	InvalidToolInputError,
	LoadAPIKeyError,
	stepCountIs,
	streamText
} from 'ai'
import { jsonrepair } from 'jsonrepair'
import { z } from 'zod'
import type { UIMessage } from 'ai'
import { getAiModel, supportsPromptCaching } from '../utils/ai-providers'
import { findCachedResponse } from '../utils/cached-responses'
import { getSystemPrompt } from '../utils/system-prompts'
import { diagramTools } from '../utils/diagram-tools'
import {
	getTelemetryConfig,
	setTraceInput,
	setTraceOutput
} from '../utils/langfuse'

// File upload limits (must match client-side)
const MAX_FILE_SIZE = 2 * 1024 * 1024 // 2MB
const MAX_FILES = 5

// Helper function to validate file parts in messages
function validateFileParts(messages: any[]): {
	valid: boolean
	error?: string
} {
	const last_message = messages[messages.length - 1]
	const file_parts =
		last_message?.parts?.filter((p: any) => p.type === 'file') || []

	if (file_parts.length > MAX_FILES) {
		return {
			valid: false,
			error: `Too many files. Maximum ${MAX_FILES} allowed.`
		}
	}

	for (const file_part of file_parts) {
		// Data URLs format: data:image/png;base64,<data>
		// Base64 increases size by ~33%, so we check the decoded size
		if (file_part.url?.startsWith('data:')) {
			const base64_data = file_part.url.split(',')[1]
			if (base64_data) {
				const size_in_bytes = Math.ceil((base64_data.length * 3) / 4)
				if (size_in_bytes > MAX_FILE_SIZE) {
					return {
						valid: false,
						error: `File exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit.`
					}
				}
			}
		}
	}

	return { valid: true }
}

// Helper function to check if diagram is minimal/empty
function isMinimalDiagram(xml: string): boolean {
	const stripped = xml.replace(/\s/g, '')
	return !stripped.includes('id="2"')
}

// Helper function to create cached stream response
function createCachedStreamResponse(xml: string): Response {
	const tool_call_id = `cached-${Date.now()}`

	const stream = createUIMessageStream({
		execute: async ({ writer }) => {
			writer.write({ type: 'start' })
			writer.write({
				type: 'tool-input-start',
				toolCallId: tool_call_id,
				toolName: 'display_diagram'
			})
			writer.write({
				type: 'tool-input-delta',
				toolCallId: tool_call_id,
				inputTextDelta: xml
			})
			writer.write({
				type: 'tool-input-available',
				toolCallId: tool_call_id,
				toolName: 'display_diagram',
				input: { xml }
			})
			writer.write({ type: 'finish' })
		}
	})

	return createUIMessageStreamResponse({ stream })
}

// Helper to categorize errors and return appropriate response
function handleError(error: unknown): Response {
	console.error('Error in chat route:', error)

	const is_dev = process.env.NODE_ENV === 'development'

	// Check for specific AI SDK error types
	if (APICallError.isInstance(error)) {
		return Response.json(
			{
				error: error.message,
				...(is_dev && {
					details: error.responseBody,
					stack: error.stack
				})
			},
			{ status: error.statusCode || 500 }
		)
	}

	if (LoadAPIKeyError.isInstance(error)) {
		return Response.json(
			{
				error: 'Authentication failed. Please check your API key.',
				...(is_dev && {
					stack: error.stack
				})
			},
			{ status: 401 }
		)
	}

	// Fallback for other errors with safety filter
	const message =
		error instanceof Error ? error.message : 'An unexpected error occurred'
	const status = (error as any)?.statusCode || (error as any)?.status || 500

	// Prevent leaking API keys, tokens, or other sensitive data
	const lower_message = message.toLowerCase()
	const safe_message =
		lower_message.includes('key') ||
		lower_message.includes('token') ||
		lower_message.includes('sig') ||
		lower_message.includes('signature') ||
		lower_message.includes('secret') ||
		lower_message.includes('password') ||
		lower_message.includes('credential')
			? 'Authentication failed. Please check your credentials.'
			: message

	return Response.json(
		{
			error: safe_message,
			...(is_dev && {
				details: message,
				stack: error instanceof Error ? error.stack : undefined
			})
		},
		{ status }
	)
}

export default defineEventHandler(async (event) => {
	const config = useRuntimeConfig()

	try {
		// Check for access code
		const access_codes =
			config.accessCodeList
				?.split(',')
				.map((code: string) => code.trim())
				.filter(Boolean) || []

		if (access_codes.length > 0) {
			const access_code_header = getHeader(event, 'x-access-code')
			if (!access_code_header || !access_codes.includes(access_code_header)) {
				return Response.json(
					{
						error: 'Invalid or missing access code. Please configure it in Settings.'
					},
					{ status: 401 }
				)
			}
		}

		const body = await readBody(event)

		const { messages, xml, previous_xml, session_id } = z
			.object({
				messages: z.array(z.custom<UIMessage>()),
				xml: z.string().optional(),
				previous_xml: z.string().optional(),
				session_id: z.string().optional()
			})
			.parse(body)

		// Get user IP for Langfuse tracking
		const forwarded_for = getHeader(event, 'x-forwarded-for')
		const user_id = forwarded_for?.split(',')[0]?.trim() || 'anonymous'

		// Validate sessionId for Langfuse (must be string, max 200 chars)
		const valid_session_id =
			session_id && typeof session_id === 'string' && session_id.length <= 200
				? session_id
				: undefined

		// Extract user input text for Langfuse trace
		const last_message = messages[messages.length - 1]
		const user_input_text =
			last_message?.parts?.find((p: any) => p.type === 'text')?.text || ''

		// Update Langfuse trace with input, session, and user
		setTraceInput({
			input: user_input_text,
			session_id: valid_session_id,
			user_id: user_id
		})

		// === FILE VALIDATION START ===
		const file_validation = validateFileParts(messages)
		if (!file_validation.valid) {
			return Response.json({ error: file_validation.error }, { status: 400 })
		}
		// === FILE VALIDATION END ===

		// === CACHE CHECK START ===
		const is_first_message = messages.length === 1
		const is_empty_diagram = !xml || xml.trim() === '' || isMinimalDiagram(xml)

		if (is_first_message && is_empty_diagram) {
			const text_part = last_message.parts?.find((p: any) => p.type === 'text')
			const file_part = last_message.parts?.find((p: any) => p.type === 'file')

			const cached = findCachedResponse(text_part?.text || '', !!file_part)

			if (cached) {
				return createCachedStreamResponse(cached.xml)
			}
		}
		// === CACHE CHECK END ===

		// Read client AI provider overrides from headers
		const client_overrides = {
			provider: getHeader(event, 'x-ai-provider'),
			base_url: getHeader(event, 'x-ai-base-url'),
			api_key: getHeader(event, 'x-ai-api-key'),
			model_id: getHeader(event, 'x-ai-model')
		}

		// Get AI model with optional client overrides
		const { model, provider_options, headers, model_id } =
			getAiModel(client_overrides)

		// Check if model supports prompt caching
		const should_cache = supportsPromptCaching(model_id)
		console.log(
			`[Prompt Caching] ${should_cache ? 'ENABLED' : 'DISABLED'} for model: ${model_id}`
		)

		// Get system prompt
		const system_message = getSystemPrompt(model_id)

		// Extract file parts (images) from the last message
		const file_parts =
			last_message.parts?.filter((part: any) => part.type === 'file') || []

		// User input only - XML is now in a separate cached system message
		const formatted_user_input = `User input:
"""md
${user_input_text}
"""`

		// Convert UIMessages to ModelMessages
		const model_messages = convertToModelMessages(messages)

		// Filter out messages with empty content arrays
		let enhanced_messages = model_messages.filter(
			(msg: any) =>
				msg.content && Array.isArray(msg.content) && msg.content.length > 0
		)

		// Update the last message with user input only
		if (enhanced_messages.length >= 1) {
			const last_model_message = enhanced_messages[enhanced_messages.length - 1]
			if (last_model_message.role === 'user') {
				const content_parts: any[] = [
					{ type: 'text', text: formatted_user_input }
				]

				// Add image parts back
				for (const file_part of file_parts) {
					content_parts.push({
						type: 'image',
						image: file_part.url,
						mimeType: file_part.mediaType
					})
				}

				enhanced_messages = [
					...enhanced_messages.slice(0, -1),
					{ ...last_model_message, content: content_parts }
				]
			}
		}

		// Add cache point to the last assistant message in conversation history
		if (should_cache && enhanced_messages.length >= 2) {
			for (let i = enhanced_messages.length - 2; i >= 0; i--) {
				if (enhanced_messages[i].role === 'assistant') {
					enhanced_messages[i] = {
						...enhanced_messages[i],
						providerOptions: {
							bedrock: { cachePoint: { type: 'default' } }
						}
					}
					break
				}
			}
		}

		// System messages with cache breakpoints for optimal caching
		const system_messages = [
			// Cache breakpoint 1: Instructions (rarely change)
			{
				role: 'system' as const,
				content: system_message,
				...(should_cache && {
					providerOptions: {
						bedrock: { cachePoint: { type: 'default' } }
					}
				})
			},
			// Cache breakpoint 2: Previous and Current diagram XML context
			{
				role: 'system' as const,
				content: `${
					previous_xml
						? `Previous diagram XML (before user's last message):\n"""xml\n${previous_xml}\n"""\n\n`
						: ''
				}Current diagram XML (AUTHORITATIVE - the source of truth):\n"""xml\n${
					xml || ''
				}\n"""\n\nIMPORTANT: The "Current diagram XML" is the SINGLE SOURCE OF TRUTH for what's on the canvas right now. The user can manually add, delete, or modify shapes directly in draw.io. Always count and describe elements based on the CURRENT XML, not on what you previously generated. If both previous and current XML are shown, compare them to understand what the user changed. When using edit_diagram, COPY search patterns exactly from the CURRENT XML - attribute order matters!`,
				...(should_cache && {
					providerOptions: {
						bedrock: { cachePoint: { type: 'default' } }
					}
				})
			}
		]

		const all_messages = [...system_messages, ...enhanced_messages]

		const result = streamText({
			model,
			...(config.maxOutputTokens && {
				maxOutputTokens: parseInt(config.maxOutputTokens as string, 10)
			}),
			stopWhen: stepCountIs(5),
			experimental_repairToolCall: async ({ toolCall, error }) => {
				if (
					error instanceof InvalidToolInputError ||
					error.name === 'AI_InvalidToolInputError'
				) {
					try {
						const repaired_input = jsonrepair(toolCall.input)
						console.log(
							`[repairToolCall] Repaired truncated JSON for tool: ${toolCall.toolName}`
						)
						return { ...toolCall, input: repaired_input }
					} catch (repair_error) {
						console.warn(
							`[repairToolCall] Failed to repair JSON for tool: ${toolCall.toolName}`,
							repair_error
						)
						return null
					}
				}
				return null
			},
			messages: all_messages,
			...(provider_options && { providerOptions: provider_options }),
			...(headers && { headers }),
			// Langfuse telemetry config
			...(getTelemetryConfig({
				session_id: valid_session_id,
				user_id
			}) && {
				experimental_telemetry: getTelemetryConfig({
					session_id: valid_session_id,
					user_id
				})
			}),
			onFinish: ({ text, usage }) => {
				// Pass usage to Langfuse
				setTraceOutput(text, {
					prompt_tokens: usage?.inputTokens,
					completion_tokens: usage?.outputTokens
				})
			},
			tools: diagramTools,
			toolChoice: 'auto',
			...(config.temperature && {
				temperature: parseFloat(config.temperature as string)
			})
		})

		return result.toUIMessageStreamResponse({
			sendReasoning: true,
			messageMetadata: ({ part }) => {
				if (part.type === 'finish') {
					const usage = (part as any).totalUsage
					if (!usage) {
						console.warn('[messageMetadata] No usage data in finish part')
						return undefined
					}
					// Total input = non-cached + cached
					const total_input_tokens =
						(usage.inputTokens ?? 0) + (usage.cachedInputTokens ?? 0)
					return {
						inputTokens: total_input_tokens,
						outputTokens: usage.outputTokens ?? 0,
						finishReason: (part as any).finishReason
					}
				}
				return undefined
			}
		})
	} catch (error) {
		return handleError(error)
	}
})
