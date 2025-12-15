import { z } from "zod";

/**
 * Diagram manipulation tools for AI
 * These are CLIENT-SIDE tools - no execute function, handled by onToolCall on client
 */

export const diagramTools = {
  display_diagram: {
    description: `Display a diagram on draw.io. Pass ONLY the mxCell elements - wrapper tags and root cells are added automatically.

VALIDATION RULES (XML will be rejected if violated):
1. Generate ONLY mxCell elements - NO wrapper tags (<mxfile>, <mxGraphModel>, <root>)
2. Do NOT include root cells (id="0" or id="1") - they are added automatically
3. All mxCell elements must be siblings - never nested
4. Every mxCell needs a unique id (start from "2")
5. Every mxCell needs a valid parent attribute (use "1" for top-level)
6. Escape special chars in values: &lt; &gt; &amp; &quot;

Example (generate ONLY this - no wrapper tags):
<mxCell id="lane1" value="Frontend" style="swimlane;" vertex="1" parent="1">
  <mxGeometry x="40" y="40" width="200" height="200" as="geometry"/>
</mxCell>
<mxCell id="step1" value="Step 1" style="rounded=1;" vertex="1" parent="lane1">
  <mxGeometry x="20" y="60" width="160" height="40" as="geometry"/>
</mxCell>

Notes:
- For AWS diagrams, use **AWS 2025 icons**.
- For animated connectors, add "flowAnimation=1" to edge style.
`,
    inputSchema: z.object({
      xml: z.string().describe("XML string to be displayed on draw.io"),
    }),
  },

  edit_diagram: {
    description: `Edit specific parts of the current diagram by replacing exact line matches. Use this tool to make targeted fixes without regenerating the entire XML.
CRITICAL: Copy-paste the EXACT search pattern from the "Current diagram XML" in system context. Do NOT reorder attributes or reformat - the attribute order in draw.io XML varies and you MUST match it exactly.
IMPORTANT: Keep edits concise:
- COPY the exact mxCell line from the current XML (attribute order matters!)
- Only include the lines that are changing, plus 1-2 surrounding lines for context if needed
- Break large changes into multiple smaller edits
- Each search must contain complete lines (never truncate mid-line)
- First match only - be specific enough to target the right element`,
    inputSchema: z.object({
      edits: z
        .array(
          z.object({
            search: z
              .string()
              .describe(
                "EXACT lines copied from current XML (preserve attribute order!)"
              ),
            replace: z.string().describe("Replacement lines"),
          })
        )
        .describe("Array of search/replace pairs to apply sequentially"),
    }),
  },

  append_diagram: {
    description: `Continue generating diagram XML when previous display_diagram output was truncated due to length limits.

WHEN TO USE: Only call this tool after display_diagram was truncated (you'll see an error message about truncation).

CRITICAL INSTRUCTIONS:
1. Do NOT include any wrapper tags - just continue the mxCell elements
2. Continue from EXACTLY where your previous output stopped
3. Complete the remaining mxCell elements
4. If still truncated, call append_diagram again with the next fragment`,
    inputSchema: z.object({
      xml: z
        .string()
        .describe("Continuation XML fragment to append (NO wrapper tags)"),
    }),
  },
};
