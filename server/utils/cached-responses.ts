export interface CachedResponse {
	prompt_text: string
	has_image: boolean
	xml: string
}

export const CACHED_EXAMPLE_RESPONSES: CachedResponse[] = [
	{
		prompt_text: 'Give me a **animated connector** diagram of transformer\'s architecture',
		has_image: false,
		xml: `<mxCell id="title" value="Transformer Architecture" style="text;html=1;strokeColor=none;fillColor=none;align=center;verticalAlign=middle;whiteSpace=wrap;rounded=0;fontSize=20;fontStyle=1;" vertex="1" parent="1">
    <mxGeometry x="300" y="20" width="250" height="30" as="geometry"/>
  </mxCell>
  <mxCell id="input_embed" value="Input Embedding" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#dae8fc;strokeColor=#6c8ebf;fontSize=11;" vertex="1" parent="1">
    <mxGeometry x="80" y="480" width="120" height="40" as="geometry"/>
  </mxCell>
  <mxCell id="pos_enc_left" value="Positional Encoding" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#dae8fc;strokeColor=#6c8ebf;fontSize=11;" vertex="1" parent="1">
    <mxGeometry x="80" y="420" width="120" height="40" as="geometry"/>
  </mxCell>
  <mxCell id="encoder_box" value="ENCODER" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#e1d5e7;strokeColor=#9673a6;verticalAlign=top;fontSize=12;fontStyle=1;" vertex="1" parent="1">
    <mxGeometry x="60" y="180" width="160" height="220" as="geometry"/>
  </mxCell>
  <mxCell id="mha_enc" value="Multi-Head&#xa;Attention" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#fff2cc;strokeColor=#d6b656;fontSize=10;" vertex="1" parent="1">
    <mxGeometry x="80" y="330" width="120" height="50" as="geometry"/>
  </mxCell>
  <mxCell id="add_norm1_enc" value="Add &amp; Norm" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#d5e8d4;strokeColor=#82b366;fontSize=10;" vertex="1" parent="1">
    <mxGeometry x="80" y="280" width="120" height="30" as="geometry"/>
  </mxCell>
  <mxCell id="ff_enc" value="Feed Forward" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#fff2cc;strokeColor=#d6b656;fontSize=10;" vertex="1" parent="1">
    <mxGeometry x="80" y="240" width="120" height="30" as="geometry"/>
  </mxCell>
  <mxCell id="add_norm2_enc" value="Add &amp; Norm" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#d5e8d4;strokeColor=#82b366;fontSize=10;" vertex="1" parent="1">
    <mxGeometry x="80" y="200" width="120" height="30" as="geometry"/>
  </mxCell>
  <mxCell id="output_embed" value="Output Embedding" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#dae8fc;strokeColor=#6c8ebf;fontSize=11;" vertex="1" parent="1">
    <mxGeometry x="650" y="480" width="120" height="40" as="geometry"/>
  </mxCell>
  <mxCell id="pos_enc_right" value="Positional Encoding" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#dae8fc;strokeColor=#6c8ebf;fontSize=11;" vertex="1" parent="1">
    <mxGeometry x="650" y="420" width="120" height="40" as="geometry"/>
  </mxCell>
  <mxCell id="decoder_box" value="DECODER" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#ffe6cc;strokeColor=#d79b00;verticalAlign=top;fontSize=12;fontStyle=1;" vertex="1" parent="1">
    <mxGeometry x="630" y="140" width="160" height="260" as="geometry"/>
  </mxCell>
  <mxCell id="masked_mha_dec" value="Masked Multi-Head&#xa;Attention" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#fff2cc;strokeColor=#d6b656;fontSize=10;" vertex="1" parent="1">
    <mxGeometry x="650" y="340" width="120" height="50" as="geometry"/>
  </mxCell>
  <mxCell id="add_norm1_dec" value="Add &amp; Norm" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#d5e8d4;strokeColor=#82b366;fontSize=10;" vertex="1" parent="1">
    <mxGeometry x="650" y="290" width="120" height="30" as="geometry"/>
  </mxCell>
  <mxCell id="mha_dec" value="Multi-Head&#xa;Attention" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#fff2cc;strokeColor=#d6b656;fontSize=10;" vertex="1" parent="1">
    <mxGeometry x="650" y="240" width="120" height="40" as="geometry"/>
  </mxCell>
  <mxCell id="add_norm2_dec" value="Add &amp; Norm" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#d5e8d4;strokeColor=#82b366;fontSize=10;" vertex="1" parent="1">
    <mxGeometry x="650" y="200" width="120" height="30" as="geometry"/>
  </mxCell>
  <mxCell id="ff_dec" value="Feed Forward" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#fff2cc;strokeColor=#d6b656;fontSize=10;" vertex="1" parent="1">
    <mxGeometry x="650" y="160" width="120" height="30" as="geometry"/>
  </mxCell>
  <mxCell id="linear" value="Linear" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#f8cecc;strokeColor=#b85450;fontSize=11;" vertex="1" parent="1">
    <mxGeometry x="650" y="80" width="120" height="30" as="geometry"/>
  </mxCell>
  <mxCell id="softmax" value="Softmax" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#f8cecc;strokeColor=#b85450;fontSize=11;" vertex="1" parent="1">
    <mxGeometry x="650" y="40" width="120" height="30" as="geometry"/>
  </mxCell>
  <mxCell id="conn1" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;strokeWidth=2;strokeColor=#6c8ebf;flowAnimation=1;" edge="1" parent="1" source="input_embed" target="pos_enc_left">
    <mxGeometry relative="1" as="geometry"/>
  </mxCell>
  <mxCell id="conn2" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;strokeWidth=2;strokeColor=#6c8ebf;flowAnimation=1;" edge="1" parent="1" source="pos_enc_left" target="mha_enc">
    <mxGeometry relative="1" as="geometry"/>
  </mxCell>
  <mxCell id="conn3" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;strokeWidth=2;strokeColor=#82b366;flowAnimation=1;" edge="1" parent="1" source="mha_enc" target="add_norm1_enc">
    <mxGeometry relative="1" as="geometry"/>
  </mxCell>
  <mxCell id="conn_cross" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;strokeWidth=3;strokeColor=#9673a6;flowAnimation=1;dashed=1;" edge="1" parent="1" source="add_norm2_enc" target="mha_dec">
    <mxGeometry relative="1" as="geometry">
      <Array as="points">
        <mxPoint x="400" y="215"/>
        <mxPoint x="400" y="260"/>
      </Array>
    </mxGeometry>
  </mxCell>
  <mxCell id="conn6" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;strokeWidth=2;strokeColor=#d79b00;flowAnimation=1;" edge="1" parent="1" source="output_embed" target="pos_enc_right">
    <mxGeometry relative="1" as="geometry"/>
  </mxCell>
  <mxCell id="input_label" value="Inputs" style="text;html=1;strokeColor=none;fillColor=none;align=center;verticalAlign=middle;whiteSpace=wrap;rounded=0;fontSize=12;fontStyle=1;" vertex="1" parent="1">
    <mxGeometry x="110" y="530" width="60" height="20" as="geometry"/>
  </mxCell>
  <mxCell id="output_label" value="Outputs&#xa;(shifted right)" style="text;html=1;strokeColor=none;fillColor=none;align=center;verticalAlign=middle;whiteSpace=wrap;rounded=0;fontSize=12;fontStyle=1;" vertex="1" parent="1">
    <mxGeometry x="660" y="530" width="100" height="30" as="geometry"/>
  </mxCell>`
	},
	{
		prompt_text: 'Draw a cat for me',
		has_image: false,
		xml: `<mxCell id="2" value="" style="ellipse;whiteSpace=wrap;html=1;aspect=fixed;fillColor=#FFE6CC;strokeColor=#000000;strokeWidth=2;" vertex="1" parent="1">
    <mxGeometry x="300" y="150" width="120" height="120" as="geometry"/>
  </mxCell>
  <mxCell id="3" value="" style="triangle;whiteSpace=wrap;html=1;fillColor=#FFE6CC;strokeColor=#000000;strokeWidth=2;rotation=30;" vertex="1" parent="1">
    <mxGeometry x="280" y="120" width="50" height="60" as="geometry"/>
  </mxCell>
  <mxCell id="4" value="" style="triangle;whiteSpace=wrap;html=1;fillColor=#FFE6CC;strokeColor=#000000;strokeWidth=2;rotation=-30;" vertex="1" parent="1">
    <mxGeometry x="390" y="120" width="50" height="60" as="geometry"/>
  </mxCell>
  <mxCell id="5" value="" style="triangle;whiteSpace=wrap;html=1;fillColor=#FFB6C1;strokeColor=none;rotation=30;" vertex="1" parent="1">
    <mxGeometry x="290" y="135" width="30" height="35" as="geometry"/>
  </mxCell>
  <mxCell id="6" value="" style="triangle;whiteSpace=wrap;html=1;fillColor=#FFB6C1;strokeColor=none;rotation=-30;" vertex="1" parent="1">
    <mxGeometry x="400" y="135" width="30" height="35" as="geometry"/>
  </mxCell>
  <mxCell id="7" value="" style="ellipse;whiteSpace=wrap;html=1;aspect=fixed;fillColor=#000000;strokeColor=#000000;" vertex="1" parent="1">
    <mxGeometry x="325" y="185" width="15" height="15" as="geometry"/>
  </mxCell>
  <mxCell id="8" value="" style="ellipse;whiteSpace=wrap;html=1;aspect=fixed;fillColor=#000000;strokeColor=#000000;" vertex="1" parent="1">
    <mxGeometry x="380" y="185" width="15" height="15" as="geometry"/>
  </mxCell>
  <mxCell id="9" value="" style="triangle;whiteSpace=wrap;html=1;fillColor=#FFB6C1;strokeColor=#000000;strokeWidth=1;rotation=180;" vertex="1" parent="1">
    <mxGeometry x="350" y="210" width="20" height="15" as="geometry"/>
  </mxCell>
  <mxCell id="18" value="" style="ellipse;whiteSpace=wrap;html=1;fillColor=#FFE6CC;strokeColor=#000000;strokeWidth=2;" vertex="1" parent="1">
    <mxGeometry x="285" y="250" width="150" height="180" as="geometry"/>
  </mxCell>
  <mxCell id="19" value="" style="ellipse;whiteSpace=wrap;html=1;fillColor=#FFFFFF;strokeColor=none;" vertex="1" parent="1">
    <mxGeometry x="315" y="280" width="90" height="120" as="geometry"/>
  </mxCell>
  <mxCell id="20" value="" style="ellipse;whiteSpace=wrap;html=1;fillColor=#FFE6CC;strokeColor=#000000;strokeWidth=2;" vertex="1" parent="1">
    <mxGeometry x="300" y="410" width="40" height="50" as="geometry"/>
  </mxCell>
  <mxCell id="21" value="" style="ellipse;whiteSpace=wrap;html=1;fillColor=#FFE6CC;strokeColor=#000000;strokeWidth=2;" vertex="1" parent="1">
    <mxGeometry x="380" y="410" width="40" height="50" as="geometry"/>
  </mxCell>`
	}
]

export function findCachedResponse(
	prompt_text: string,
	has_image: boolean
): CachedResponse | undefined {
	return CACHED_EXAMPLE_RESPONSES.find(
		(c) =>
			c.prompt_text === prompt_text &&
			c.has_image === has_image &&
			c.xml !== ''
	)
}
