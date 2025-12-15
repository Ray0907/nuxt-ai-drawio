/**
 * Convert draw.io XML to Mermaid syntax
 * Supports flowcharts, sequence diagrams, and basic shapes
 */

interface MxCell {
	id: string
	value: string
	style: string
	source?: string
	target?: string
	parent?: string
	vertex?: boolean
	edge?: boolean
}

/**
 * Parse draw.io XML and extract cells
 */
function parseMxCells(xml: string): MxCell[] {
	const cells: MxCell[] = []

	// Match all mxCell elements
	const cell_regex = /<mxCell([^>]*)(?:\/>|>([\s\S]*?)<\/mxCell>)/g
	let match

	while ((match = cell_regex.exec(xml)) !== null) {
		const attrs = match[1] || ''
		const cell: MxCell = {
			id: extractAttr(attrs, 'id') ?? '',
			value: decodeHtmlEntities(extractAttr(attrs, 'value') ?? ''),
			style: extractAttr(attrs, 'style') ?? '',
			source: extractAttr(attrs, 'source'),
			target: extractAttr(attrs, 'target'),
			parent: extractAttr(attrs, 'parent'),
			vertex: attrs.includes('vertex="1"'),
			edge: attrs.includes('edge="1"')
		}
		cells.push(cell)
	}

	return cells
}

/**
 * Extract attribute value from XML attributes string
 */
function extractAttr(attrs: string, name: string): string | undefined {
	const regex = new RegExp(`${name}="([^"]*)"`)
	const match = attrs.match(regex)
	return match ? match[1] : undefined
}

/**
 * Decode HTML entities
 */
function decodeHtmlEntities(text: string): string {
	return text
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>')
		.replace(/&amp;/g, '&')
		.replace(/&quot;/g, '"')
		.replace(/&#xa;/g, '\n')
		.replace(/&#10;/g, '\n')
		.replace(/<br\s*\/?>/gi, '\n')
		.replace(/<[^>]+>/g, '') // Remove HTML tags
}

/**
 * Sanitize node ID for Mermaid (alphanumeric and underscores only)
 */
function sanitizeId(id: string): string {
	return id.replace(/[^a-zA-Z0-9_]/g, '_')
}

/**
 * Sanitize label for Mermaid
 */
function sanitizeLabel(label: string): string {
	// Remove newlines and escape quotes
	return label
		.replace(/\n/g, ' ')
		.replace(/"/g, "'")
		.trim()
}

/**
 * Detect shape type from draw.io style
 */
function getShapeType(style: string): 'rect' | 'rounded' | 'diamond' | 'circle' | 'stadium' {
	if (style.includes('rhombus')) return 'diamond'
	if (style.includes('ellipse')) return 'circle'
	if (style.includes('rounded=1')) return 'rounded'
	if (style.includes('shape=parallelogram')) return 'stadium'
	return 'rect'
}

/**
 * Get arrow style from draw.io edge style
 */
function getArrowStyle(style: string): string {
	if (style.includes('dashed=1')) return '-.->'
	if (style.includes('endArrow=none') || style.includes('endArrow=classic;startArrow=classic')) return '---'
	if (style.includes('endArrow=none')) return '---'
	return '-->'
}

/**
 * Format node with shape brackets for Mermaid
 */
function formatNode(id: string, label: string, shape: string): string {
	const safe_id = sanitizeId(id)
	const safe_label = sanitizeLabel(label) || safe_id

	switch (shape) {
		case 'diamond':
			return `${safe_id}{{"${safe_label}"}}`
		case 'circle':
			return `${safe_id}(("${safe_label}"))`
		case 'rounded':
			return `${safe_id}("${safe_label}")`
		case 'stadium':
			return `${safe_id}(["${safe_label}"])`
		default:
			return `${safe_id}["${safe_label}"]`
	}
}

/**
 * Convert draw.io XML to Mermaid flowchart
 */
export function convertToMermaid(xml: string): string {
	const cells = parseMxCells(xml)

	// Separate vertices (nodes) and edges
	const vertices = cells.filter(c => c.vertex && c.parent !== '0' && c.id !== '0' && c.id !== '1')
	const edges = cells.filter(c => c.edge && c.source && c.target)

	if (vertices.length === 0 && edges.length === 0) {
		return '%%{init: {"theme": "default"}}%%\nflowchart TD\n    A["Empty diagram"]'
	}

	const lines: string[] = [
		'%%{init: {"theme": "default"}}%%',
		'flowchart TD'
	]

	// Track defined nodes
	const defined_nodes = new Set<string>()

	// Define nodes
	for (const vertex of vertices) {
		const shape = getShapeType(vertex.style)
		const node_def = formatNode(vertex.id, vertex.value, shape)
		lines.push(`    ${node_def}`)
		defined_nodes.add(vertex.id)
	}

	// Add edges
	for (const edge of edges) {
		if (!edge.source || !edge.target) continue

		const source_id = sanitizeId(edge.source)
		const target_id = sanitizeId(edge.target)
		const arrow = getArrowStyle(edge.style)
		const label = sanitizeLabel(edge.value)

		if (label) {
			lines.push(`    ${source_id} ${arrow}|"${label}"| ${target_id}`)
		} else {
			lines.push(`    ${source_id} ${arrow} ${target_id}`)
		}
	}

	return lines.join('\n')
}

/**
 * Download content as file
 */
export function downloadAsFile(content: string, filename: string, mime_type: string) {
	const blob = new Blob([content], { type: mime_type })
	const url = URL.createObjectURL(blob)
	const a = document.createElement('a')
	a.href = url
	a.download = filename
	document.body.appendChild(a)
	a.click()
	document.body.removeChild(a)
	setTimeout(() => URL.revokeObjectURL(url), 100)
}
