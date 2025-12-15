/**
 * Langfuse telemetry utilities for observability
 */

// Check if Langfuse is configured
export function isLangfuseEnabled(): boolean {
	const config = useRuntimeConfig()
	return !!config.langfusePublicKey && !!config.langfuseSecretKey
}

// Get telemetry config for streamText
export function getTelemetryConfig(params: {
	session_id?: string
	user_id?: string
}) {
	if (!isLangfuseEnabled()) return undefined

	return {
		isEnabled: true,
		recordInputs: true,
		recordOutputs: true,
		metadata: {
			sessionId: params.session_id,
			userId: params.user_id
		}
	}
}

// Update trace with input data at the start of request
export function setTraceInput(_params: {
	input: string
	session_id?: string
	user_id?: string
}) {
	// Langfuse integration placeholder
	// Will be implemented when @langfuse/tracing package is added
	if (!isLangfuseEnabled()) return
}

// Update trace with output and end the span
export function setTraceOutput(
	_output: string,
	_usage?: { prompt_tokens?: number; completion_tokens?: number }
) {
	// Langfuse integration placeholder
	if (!isLangfuseEnabled()) return
}

// Wrap a handler with Langfuse observe
export function wrapWithObserve<T>(
	handler: (event: any) => Promise<T>
): (event: any) => Promise<T> {
	// Return handler as-is until Langfuse is fully integrated
	return handler
}
