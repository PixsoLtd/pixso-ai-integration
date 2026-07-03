#!/usr/bin/env node

type JsonObject = Record<string, unknown>;

interface PixsoComponent {
  aliasName?: string;
  component_key?: string;
  name?: string;
  node_id?: string;
  type?: string;
  isVariant?: boolean;
  isPublishable?: boolean;
  containing_frame?: {
    pageName?: string;
    containingStateGroup?: {
      name?: string;
    };
  };
}

interface Args {
  mcpUrl: string;
  summaryOnly: boolean;
  maxFamilies: number;
  nodeDslGuid?: string;
  nodeOutput?: string;
  rawOutput?: string;
  summaryOutput?: string;
  help: boolean;
}

interface ResolvedComponentName {
  key: string;
  rawName: string;
  source: "aliasName" | "containingStateGroup.name" | "name" | "node_id" | "component_key";
}

function usage(): string {
  return [
    "Fetch Pixso get_all_components data through the local MCP HTTP endpoint.",
    "",
    "Usage:",
    "  node --experimental-strip-types fetch-pixso-components.ts [options]",
    "",
    "Options:",
    "  --mcp-url <url>          Pixso MCP endpoint. Default: http://127.0.0.1:3667/mcp",
    "  --summary-only           Print grouped family summary instead of raw components",
    "  --max-families <number>  Limit summary family rows. Default: 120",
    "  --node-dsl <guid>        Fetch get_node_dsl for a single node_id/guid and print it",
    "  --node-output <path>     Write get_node_dsl JSON to a file",
    "  --raw-output <path>      Write raw get_all_components JSON to a file",
    "  --summary-output <path>  Write summary JSON to a file",
    "  -h, --help               Show help",
  ].join("\n");
}

function parseArgs(argv: string[]): Args {
  const args: Args = {
    mcpUrl: "http://127.0.0.1:3667/mcp",
    summaryOnly: false,
    maxFamilies: 120,
    help: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const readValue = (): string => {
      const value = argv[index + 1];
      if (!value || value.startsWith("--")) {
        throw new Error(`Missing value for ${arg}`);
      }
      index += 1;
      return value;
    };

    if (arg === "-h" || arg === "--help") {
      args.help = true;
    } else if (arg === "--mcp-url") {
      args.mcpUrl = readValue();
    } else if (arg === "--summary-only") {
      args.summaryOnly = true;
    } else if (arg === "--max-families") {
      args.maxFamilies = Number(readValue());
      if (!Number.isFinite(args.maxFamilies) || args.maxFamilies < 0) {
        throw new Error("--max-families must be a non-negative number");
      }
    } else if (arg === "--node-dsl") {
      args.nodeDslGuid = readValue();
    } else if (arg === "--node-output") {
      args.nodeOutput = readValue();
    } else if (arg === "--raw-output") {
      args.rawOutput = readValue();
    } else if (arg === "--summary-output") {
      args.summaryOutput = readValue();
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  return args;
}

async function postJson(url: string, body: JsonObject, sessionId?: string): Promise<{ headers: Headers; text: string }> {
  const headers: Record<string, string> = {
    Accept: "application/json, text/event-stream",
    "Content-Type": "application/json",
  };
  if (sessionId) {
    headers["mcp-session-id"] = sessionId;
  }

  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} ${response.statusText}: ${text.slice(0, 300)}`);
  }
  return { headers: response.headers, text };
}

function parseSseJson(text: string): JsonObject {
  const line = text.split(/\r?\n/).find((entry) => entry.startsWith("data: "));
  if (!line) {
    throw new Error(`No SSE data line in response: ${text.slice(0, 200)}`);
  }
  return JSON.parse(line.slice("data: ".length)) as JsonObject;
}

async function callTool(url: string, toolName: string, toolArguments: JsonObject): Promise<JsonObject> {
  const init = await postJson(url, {
    jsonrpc: "2.0",
    id: 1,
    method: "initialize",
    params: {
      protocolVersion: "2025-06-18",
      capabilities: {},
      clientInfo: { name: "pixso-component-config", version: "1.0.0" },
    },
  });
  const sessionId = init.headers.get("mcp-session-id");
  if (!sessionId) {
    throw new Error("Pixso MCP initialize response did not include mcp-session-id");
  }

  try {
    await postJson(url, { jsonrpc: "2.0", method: "notifications/initialized", params: {} }, sessionId);
  } catch {
    // Some servers return an empty response for notifications; continue.
  }

  const response = await postJson(
    url,
    {
      jsonrpc: "2.0",
      id: 2,
      method: "tools/call",
      params: { name: toolName, arguments: toolArguments },
    },
    sessionId,
  );
  const payload = parseSseJson(response.text);
  if ("error" in payload) {
    throw new Error(JSON.stringify(payload.error));
  }
  return payload.result as JsonObject;
}

function stripAngleBracketName(name: string): string {
  const trimmed = name.trim();
  const angleMatch = trimmed.match(/^<\s*([^<>]+?)\s*>$/);
  return angleMatch?.[1]?.trim() || trimmed;
}

function toValidComponentName(name?: string): string {
  if (!name) return "";
  return stripAngleBracketName(name).replace(/[^a-zA-Z0-9_]+/g, "").replace(/^[0-9]+/, "") || "";
}

function isVariantDescriptorName(name?: string): boolean {
  if (!name) return false;
  const trimmed = name.trim();
  if (!trimmed.includes("=")) return false;
  return trimmed.split(",").every((part) => /^\s*[^=]+=\s*.+\s*$/.test(part));
}

function componentFallbackType(component: PixsoComponent): string {
  const type = component.type?.trim();
  if (!type) return "Component";
  return type === "SYMBOL" ? "Component" : type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
}

function componentNameByNodeId(component: PixsoComponent): string {
  const nodeId = component.node_id?.trim();
  const match = nodeId?.match(/(\d+):(\d+)/);
  if (match) return `${componentFallbackType(component)}_${match[1]}_${match[2]}`;

  const componentKey = toValidComponentName(component.component_key);
  if (componentKey) return componentKey;

  return "";
}

function rawFamilyName(component: PixsoComponent): string {
  const alias = component.aliasName?.trim();
  if (alias) return alias;

  const groupName = component.containing_frame?.containingStateGroup?.name?.trim();
  if (groupName) return groupName;

  return component.name?.trim() ?? "";
}

function resolveComponentName(component: PixsoComponent): ResolvedComponentName | null {
  const candidates: Array<{ rawName?: string; source: ResolvedComponentName["source"] }> = [
    { rawName: component.aliasName, source: "aliasName" },
    {
      rawName: component.containing_frame?.containingStateGroup?.name,
      source: "containingStateGroup.name",
    },
    {
      rawName: isVariantDescriptorName(component.name) ? "" : component.name,
      source: "name",
    },
  ];

  for (const candidate of candidates) {
    const key = toValidComponentName(candidate.rawName);
    if (key) {
      return {
        key,
        rawName: candidate.rawName?.trim() ?? "",
        source: candidate.source,
      };
    }
  }

  const nodeIdKey = componentNameByNodeId(component);
  if (nodeIdKey) {
    return {
      key: nodeIdKey,
      rawName: component.node_id?.trim() ?? component.component_key?.trim() ?? "",
      source: component.node_id ? "node_id" : "component_key",
    };
  }

  return null;
}

function pageName(component: PixsoComponent): string {
  return component.containing_frame?.pageName?.trim() ?? "";
}

function classifyFamily(name: string, pages: string[]): string {
  const lowered = name.toLowerCase();
  if (pages.some((page) => {
    const normalizedPageName = page.trim().toLowerCase();
    return normalizedPageName === "icon" || normalizedPageName.includes("icon") || page.includes("\u56fe\u6807");
  })) {
    return "icon";
  }
  if (lowered.startsWith(".") || lowered.startsWith("_") || lowered.includes("legacy")) {
    return "private-helper-or-legacy";
  }
  if (lowered.includes("/components/") || lowered.startsWith("components/")) {
    return "internal-component";
  }
  return "candidate";
}

function summarize(components: PixsoComponent[], maxFamilies: number): JsonObject {
  const grouped = new Map<string, Array<PixsoComponent & { resolvedComponentName: ResolvedComponentName }>>();
  for (const component of components) {
    const resolvedComponentName = resolveComponentName(component);
    if (!resolvedComponentName) continue;
    const items = grouped.get(resolvedComponentName.key) ?? [];
    items.push({ ...component, resolvedComponentName });
    grouped.set(resolvedComponentName.key, items);
  }

  const classificationCounts = new Map<string, number>();
  const families = [...grouped.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([name, items]) => {
      const pages = [...new Set(items.map(pageName).filter(Boolean))].sort();
      const sampleNames = [...new Set(items.map((item) => item.name).filter(Boolean))].slice(0, 6);
      const rawNames = [...new Set(items.map((item) => rawFamilyName(item)).filter(Boolean))].slice(0, 8);
      const keySources = [...new Set(items.map((item) => item.resolvedComponentName.source))].sort();
      const classification = classifyFamily(name, pages);
      classificationCounts.set(classification, (classificationCounts.get(classification) ?? 0) + 1);
      return {
        name,
        rawNames,
        keySources,
        count: items.length,
        variants: items.filter((item) => item.isVariant).length,
        publishable: items.filter((item) => item.isPublishable).length,
        pages,
        sampleNames,
        nodeIds: items.map((item) => item.node_id).filter(Boolean).slice(0, 5),
        classification,
      };
    });

  return {
    rawComponentCount: components.length,
    familyCount: families.length,
    classificationCounts: Object.fromEntries(classificationCounts),
    families: families.slice(0, maxFamilies),
    truncatedFamilies: Math.max(0, families.length - maxFamilies),
  };
}

async function writeJsonFile(path: string, value: unknown): Promise<void> {
  const { writeFile } = await import("node:fs/promises");
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function extractJsonTextResult(result: JsonObject, toolName: string): unknown {
  const content = result.content as Array<{ type?: string; text?: string }> | undefined;
  if (!content?.length || content[0].type !== "text" || typeof content[0].text !== "string") {
    throw new Error(`Unexpected ${toolName} response shape`);
  }

  try {
    return JSON.parse(content[0].text);
  } catch {
    return result;
  }
}

async function main(): Promise<number> {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log(usage());
    return 0;
  }

  if (args.nodeDslGuid) {
    let nodeDslResult: JsonObject;
    try {
      nodeDslResult = await callTool(args.mcpUrl, "get_node_dsl", { guid: args.nodeDslGuid });
    } catch (error) {
      console.error(`Failed to fetch Pixso node DSL for ${args.nodeDslGuid} from ${args.mcpUrl}.`);
      console.error("Pixso MCP connection and get_node_dsl are required before inspecting component layers. Stop here and connect Pixso MCP before continuing.");
      console.error("Confirm Pixso desktop is running, the current file is open, MCP is enabled, the endpoint is correct, and get_node_dsl is available.");
      console.error(`Original error: ${error instanceof Error ? error.message : String(error)}`);
      return 2;
    }

    const nodeDsl = extractJsonTextResult(nodeDslResult, "get_node_dsl");
    if (args.nodeOutput) await writeJsonFile(args.nodeOutput, nodeDsl);
    console.log(JSON.stringify(nodeDsl, null, 2));
    return 0;
  }

  let result: JsonObject;
  try {
    result = await callTool(args.mcpUrl, "get_all_components", {});
  } catch (error) {
    console.error(`Failed to fetch Pixso components from ${args.mcpUrl}.`);
    console.error("Pixso MCP connection is required before generating a component parser config. Stop here and connect Pixso MCP before continuing.");
    console.error("Confirm Pixso desktop is running, MCP is enabled, the endpoint is correct, and get_all_components is available.");
    console.error(`Original error: ${error instanceof Error ? error.message : String(error)}`);
    return 2;
  }

  const components = extractJsonTextResult(result, "get_all_components") as PixsoComponent[];
  const summary = summarize(components, args.maxFamilies);
  if (args.rawOutput) await writeJsonFile(args.rawOutput, components);
  if (args.summaryOutput) await writeJsonFile(args.summaryOutput, summary);

  console.log(JSON.stringify(args.summaryOnly ? summary : components, null, 2));
  return 0;
}

main()
  .then((code) => {
    process.exitCode = code;
  })
  .catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
