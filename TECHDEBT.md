# Tech Debt

No outstanding items. Previous items were addressed or removed from scope:

- **MCP server access requests** — Resolved. Template now passes `requested.mcp_servers` and `userRole: 'scope_user_user'` to `login()`. CLI prompts for MCP server URLs at scaffold time.
- **MCP runtime usage** — Resolved. Template includes McpPopover, useMcpList, useMcpSelection hooks, and a client-side agentic tool call loop in useChat.
- **Template modularization** — Resolved. ChatDemo.tsx split into components/chat/ (ChatInput, ChatMessages, MessageBubble, ToolCallMessage, McpPopover) and hooks/ (useChat, useMcpList, useMcpSelection).
- **userRole inconsistency** — Resolved upstream (SDK commit `62a3aff`). Removed from WebUIClient config, defaults to `scope_user_user` in login().
- **Error handling** — Out of scope. Template stays happy-path; consuming apps add granular error handling as needed.
- **onProgress callback** — Out of scope. Feature, not debt.
- **Polling/timeout config** — Out of scope. SDK defaults (2s/5min/30s) are sufficient.
- **flowType** — Out of scope. Template uses redirect only.
- **client.toolsets** — Out of scope. Being deprecated.
- **tenant_selection status** — Removed. Never existed in current SDK.
