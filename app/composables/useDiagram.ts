/**
 * Diagram state management composable
 * Handles Draw.io diagram state, history, and export operations
 */

interface DiagramHistory {
	svg: string
	xml: string
	timestamp: number
}

const STORAGE_DIAGRAM_XML_KEY = 'nuxt-ai-drawio-diagram-xml'
const MAX_HISTORY_SIZE = 20

export function useDiagram() {
	// Reactive state
	const chart_xml = useState<string>('diagram-xml', () => '')
	const latest_svg = useState<string>('diagram-svg', () => '')
	const diagram_history = useState<DiagramHistory[]>('diagram-history', () => [])
	const is_drawio_ready = useState<boolean>('drawio-ready', () => false)

	// DrawIO iframe reference - will be set by DrawioEditor component
	const drawio_ref = useState<any>('drawio-ref', () => null)

	// Export resolver for async export operations
	const resolver_ref = useState<((value: string) => void) | null>('resolver-ref', () => null)

	// Track if export should be saved to history
	const expect_history_export = useState<boolean>('expect-history-export', () => false)

	// Save resolver for file operations
	const save_resolver_ref = useState<{
		resolver: ((data: string) => void) | null
		format: string | null
	}>('save-resolver-ref', () => ({ resolver: null, format: null }))

	/**
	 * Extract mxCell elements from draw.io SVG export
	 */
	function extractDiagramXml(svg_data: string): string {
		// Try to extract from content attribute in SVG
		const content_match = svg_data.match(/content="([^"]*)"/)
		if (content_match) {
			// Decode HTML entities
			const decoded = content_match[1]
				.replace(/&lt;/g, '<')
				.replace(/&gt;/g, '>')
				.replace(/&amp;/g, '&')
				.replace(/&quot;/g, '"')
			return decoded
		}

		// Fallback: return the SVG as-is if no content attribute
		return svg_data
	}

	/**
	 * Validate XML structure and optionally fix common issues
	 */
	function validateAndFixXml(xml: string): {
		valid: boolean
		error?: string
		fixed?: string
		fixes?: string[]
	} {
		if (!xml || xml.trim() === '') {
			return { valid: true }
		}

		const fixes: string[] = []
		let fixed_xml = xml

		// Check for basic XML structure
		if (!fixed_xml.includes('<mxCell') && !fixed_xml.includes('<mxfile')) {
			return { valid: false, error: 'Invalid XML: Missing mxCell or mxfile elements' }
		}

		// Wrap raw mxCell elements in proper structure
		if (!fixed_xml.includes('<mxGraphModel') && !fixed_xml.includes('<mxfile')) {
			fixed_xml = `<mxGraphModel><root><mxCell id="0"/><mxCell id="1" parent="0"/>${fixed_xml}</root></mxGraphModel>`
			fixes.push('Wrapped raw mxCell elements in mxGraphModel structure')
		}

		// Wrap mxGraphModel in mxfile if needed
		if (fixed_xml.includes('<mxGraphModel') && !fixed_xml.includes('<mxfile')) {
			fixed_xml = `<mxfile><diagram name="Page-1" id="page-1">${fixed_xml}</diagram></mxfile>`
			fixes.push('Wrapped mxGraphModel in mxfile structure')
		}

		return {
			valid: true,
			fixed: fixes.length > 0 ? fixed_xml : undefined,
			fixes: fixes.length > 0 ? fixes : undefined
		}
	}

	/**
	 * Load a diagram into the Draw.io editor
	 */
	function loadDiagram(xml: string, skip_validation = false): string | null {
		let xml_to_load = xml

		if (!skip_validation) {
			const validation = validateAndFixXml(xml)
			if (!validation.valid) {
				console.warn('[loadDiagram] Validation error:', validation.error)
				return validation.error || 'Invalid XML'
			}
			if (validation.fixed) {
				console.log('[loadDiagram] Auto-fixed XML issues:', validation.fixes)
				xml_to_load = validation.fixed
			}
		}

		chart_xml.value = xml_to_load

		if (drawio_ref.value) {
			drawio_ref.value.load({ xml: xml_to_load })
		}

		return null
	}

	/**
	 * Export diagram with history tracking
	 */
	function handleExport() {
		if (drawio_ref.value) {
			expect_history_export.value = true
			drawio_ref.value.exportDiagram({ format: 'xmlsvg' })
		}
	}

	/**
	 * Export diagram without saving to history
	 */
	function handleExportWithoutHistory() {
		if (drawio_ref.value) {
			drawio_ref.value.exportDiagram({ format: 'xmlsvg' })
		}
	}

	/**
	 * Handle export completion from Draw.io
	 */
	function handleDiagramExport(data: any) {
		// Handle file save if requested
		if (save_resolver_ref.value.resolver) {
			const format = save_resolver_ref.value.format
			save_resolver_ref.value.resolver(data.data)
			save_resolver_ref.value = { resolver: null, format: null }
			if (format === 'png' || format === 'svg') {
				return
			}
		}

		const extracted_xml = extractDiagramXml(data.data)
		chart_xml.value = extracted_xml
		latest_svg.value = data.data

		// Add to history if this was a user-initiated export
		if (expect_history_export.value) {
			const new_entry: DiagramHistory = {
				svg: data.data,
				xml: extracted_xml,
				timestamp: Date.now()
			}
			diagram_history.value = [...diagram_history.value, new_entry].slice(-MAX_HISTORY_SIZE)
			expect_history_export.value = false
		}

		// Resolve any pending export promises
		if (resolver_ref.value) {
			resolver_ref.value(extracted_xml)
			resolver_ref.value = null
		}
	}

	/**
	 * Clear the diagram to empty state
	 */
	function clearDiagram() {
		const empty_diagram = '<mxfile><diagram name="Page-1" id="page-1"><mxGraphModel><root><mxCell id="0"/><mxCell id="1" parent="0"/></root></mxGraphModel></diagram></mxfile>'
		loadDiagram(empty_diagram, true)
		latest_svg.value = ''
		diagram_history.value = []
	}

	/**
	 * Restore diagram from history
	 */
	function restoreFromHistory(index: number) {
		if (index >= 0 && index < diagram_history.value.length) {
			const history_item = diagram_history.value[index]
			loadDiagram(history_item.xml, true)
			latest_svg.value = history_item.svg
		}
	}

	/**
	 * Save diagram to file
	 */
	function saveDiagramToFile(filename: string, format: 'drawio' | 'svg' | 'png') {
		if (!drawio_ref.value) {
			console.warn('Draw.io editor not ready')
			return
		}

		const drawio_format = format === 'drawio' ? 'xmlsvg' : format

		save_resolver_ref.value = {
			resolver: (export_data: string) => {
				let file_content: string | Blob
				let mime_type: string
				let extension: string

				if (format === 'drawio') {
					const xml = extractDiagramXml(export_data)
					let xml_content = xml
					if (!xml.includes('<mxfile')) {
						xml_content = `<mxfile><diagram name="Page-1" id="page-1">${xml}</diagram></mxfile>`
					}
					file_content = xml_content
					mime_type = 'application/xml'
					extension = '.drawio'

					// Save to localStorage
					localStorage.setItem(STORAGE_DIAGRAM_XML_KEY, xml_content)
				} else if (format === 'png') {
					file_content = export_data
					mime_type = 'image/png'
					extension = '.png'
				} else {
					file_content = export_data
					mime_type = 'image/svg+xml'
					extension = '.svg'
				}

				// Create download
				let url: string
				if (typeof file_content === 'string' && file_content.startsWith('data:')) {
					url = file_content
				} else {
					const blob = new Blob([file_content], { type: mime_type })
					url = URL.createObjectURL(blob)
				}

				const a = document.createElement('a')
				a.href = url
				a.download = `${filename}${extension}`
				document.body.appendChild(a)
				a.click()
				document.body.removeChild(a)

				if (!url.startsWith('data:')) {
					setTimeout(() => URL.revokeObjectURL(url), 100)
				}
			},
			format
		}

		drawio_ref.value.exportDiagram({ format: drawio_format })
	}

	/**
	 * Set DrawIO ready state
	 */
	function onDrawioLoad() {
		is_drawio_ready.value = true
	}

	/**
	 * Reset DrawIO ready state
	 */
	function resetDrawioReady() {
		is_drawio_ready.value = false
	}

	/**
	 * Set DrawIO reference
	 */
	function setDrawioRef(ref: any) {
		drawio_ref.value = ref
	}

	return {
		// State
		chart_xml: readonly(chart_xml),
		latest_svg: readonly(latest_svg),
		diagram_history: readonly(diagram_history),
		is_drawio_ready: readonly(is_drawio_ready),
		drawio_ref,
		resolver_ref,

		// Methods
		loadDiagram,
		handleExport,
		handleExportWithoutHistory,
		handleDiagramExport,
		clearDiagram,
		restoreFromHistory,
		saveDiagramToFile,
		onDrawioLoad,
		resetDrawioReady,
		setDrawioRef,
		extractDiagramXml,
		validateAndFixXml
	}
}
