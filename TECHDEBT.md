# Tech Debt

Facade customizability gaps and unused SDK features in the `template-bodhi-react-vite` template.

## Login Flow Customization

The SDK's `login()` accepts a `LoginOptions` object with several options the template doesn't expose:

- **`onProgress`** — `LoginProgressCallback` providing stage updates (`'requesting'` | `'reviewing'` | `'authenticating'`). Could drive a multi-step progress indicator instead of the current single spinner.
- **`flowType`** — Template uses `'redirect'` flow. The SDK also supports `'popup'` flow (primarily for Chrome extensions where redirect is not allowed).
- **`pollIntervalMs` / `pollTimeoutMs`** — Controls access request approval polling. Defaults: 2s interval, 5min timeout. Not configurable by end user.
- **`userRole`** — `UserScope` type. Defaults to `scope_user_user` (set via `WebUIClient` config). No way for the template user to request elevated roles.
- **`requested`** — Access request can include specific `toolset_types` and `mcp_servers`. Template doesn't request any resources.

## Error Handling

The SDK uses `BodhiError` and `BodhiApiError` exception classes (thrown, not returned as union types):

- **`BodhiError`** — Base class for operational errors. Properties: `code` (`BodhiErrorCode`), `message`. Error codes: `network_error`, `timeout_error`, `not_initialized`, `auth_error`, `extension_error`, `connection_closed`, `parse_error`.
- **`BodhiApiError`** (extends `BodhiError`) — HTTP API errors (4xx/5xx). Properties: `status`, `body` (`OpenAiApiError`), `headers`.
- **`unwrapResponse(response)`** — Utility that returns `response.body` on success or throws `BodhiApiError` on `status >= 400`.
- **`createApiError()` / `createOperationError()`** — Factory functions for creating error instances.

The template imports `BodhiError` and `BodhiApiError` but uses minimal error handling (toast messages). More granular error discrimination (e.g., retry on network errors, re-authenticate on auth errors) is left to consuming apps.

## Unused SDK Features

- **`client.toolsets`** — Toolset management namespace (`list`, `executeTool`, etc.). Not utilized.
- **`client.mcps`** — MCP server management namespace (`list`, `listTools`, `executeTool`, etc.). Not utilized.
- **`apiTimeoutMs`** — Client config option (default 30s). Not exposed via BodhiProvider props in the template.

## Missing UI Handling

- **`tenant_selection` server status** — SDK returns this for multi-tenant servers. Template UI doesn't handle it (only handles `direct-not-connected`, `extension-not-found`, etc.).
