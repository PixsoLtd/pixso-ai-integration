# Pixso D2C Plus Config

Use $pixso-component-config to generate or update Pixso Design-to-Code component parser JSON.

Workflow:

1. Confirm the target code resource: a local component library path or an open source component library with official documentation.
2. Fetch current Pixso component facts through Pixso MCP.
3. Inspect representative node DSL for component families that need complex mappings.
4. Output valid component parser JSON and a short manual completion list.
