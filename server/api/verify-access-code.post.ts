export default defineEventHandler(async (event) => {
	const config = useRuntimeConfig()

	const access_codes =
		config.accessCodeList
			?.split(',')
			.map((code: string) => code.trim())
			.filter(Boolean) || []

	// If no access codes configured, verification always passes
	if (access_codes.length === 0) {
		return {
			valid: true,
			message: 'No access code required'
		}
	}

	const access_code_header = getHeader(event, 'x-access-code')

	if (!access_code_header) {
		throw createError({
			statusCode: 401,
			statusMessage: 'Access code is required'
		})
	}

	if (!access_codes.includes(access_code_header)) {
		throw createError({
			statusCode: 401,
			statusMessage: 'Invalid access code'
		})
	}

	return {
		valid: true,
		message: 'Access code is valid'
	}
})
