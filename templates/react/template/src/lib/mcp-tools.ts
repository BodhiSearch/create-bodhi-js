const MCP_PREFIX = 'mcp__';
const SEPARATOR = '__';

export interface McpToolDefinition {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
}

export interface DecodedToolName {
  mcpSlug: string;
  toolName: string;
}

export function encodeMcpToolName(slug: string, toolName: string): string {
  return `${MCP_PREFIX}${slug}${SEPARATOR}${toolName}`;
}

export function decodeMcpToolName(encodedName: string): DecodedToolName | null {
  if (!encodedName.startsWith(MCP_PREFIX)) return null;
  const withoutPrefix = encodedName.slice(MCP_PREFIX.length);
  const separatorIndex = withoutPrefix.indexOf(SEPARATOR);
  if (separatorIndex === -1) return null;
  return {
    mcpSlug: withoutPrefix.slice(0, separatorIndex),
    toolName: withoutPrefix.slice(separatorIndex + SEPARATOR.length),
  };
}

export interface Mcp {
  id: string;
  slug: string;
  name: string;
  enabled: boolean;
  mcp_server: {
    enabled: boolean;
  };
  tools_cache?: McpTool[] | null;
  tools_filter?: string[] | null;
}

export interface McpTool {
  name: string;
  description?: string;
  input_schema?: Record<string, unknown>;
}

export function isMcpAvailable(mcp: Mcp): boolean {
  return (
    mcp.mcp_server.enabled &&
    mcp.enabled &&
    mcp.tools_cache != null &&
    mcp.tools_cache.length > 0 &&
    (mcp.tools_filter == null || mcp.tools_filter.length > 0)
  );
}

export function getUnavailableReason(mcp: Mcp): string | null {
  if (!mcp.mcp_server.enabled) return 'Disabled by administrator';
  if (!mcp.enabled) return 'Disabled by user';
  if (!mcp.tools_cache || mcp.tools_cache.length === 0) return 'Tools not yet discovered';
  if (mcp.tools_filter && mcp.tools_filter.length === 0) return 'All tools blocked by filter';
  return null;
}

export function getVisibleTools(mcp: Mcp): McpTool[] {
  if (!mcp.tools_cache) return [];
  if (mcp.tools_filter == null) return mcp.tools_cache;
  return mcp.tools_cache.filter(t => mcp.tools_filter!.includes(t.name));
}

export function buildMcpToolsArray(
  enabledMcpTools: Record<string, string[]>,
  mcps: Mcp[]
): McpToolDefinition[] {
  const result: McpToolDefinition[] = [];

  for (const mcp of mcps) {
    const enabledToolNames = enabledMcpTools[mcp.id];
    if (!enabledToolNames || enabledToolNames.length === 0) continue;
    if (!isMcpAvailable(mcp)) continue;

    const visibleTools = getVisibleTools(mcp);
    for (const tool of visibleTools) {
      if (enabledToolNames.includes(tool.name)) {
        result.push({
          type: 'function',
          function: {
            name: encodeMcpToolName(mcp.slug, tool.name),
            description: tool.description ?? '',
            parameters: tool.input_schema ?? {},
          },
        });
      }
    }
  }

  return result;
}
