# Tech Debt

Facade customizability gaps and unused SDK features in the `template-bodhi-react-vite` template.

## Login Flow Customization

The SDK's `login()` accepts a `LoginOptions` object with several options the template doesn't expose:

- **`onProgress`** — `LoginProgressCallback` providing stage updates (`'requesting'` | `'reviewing'` | `'authenticating'`). Could drive a multi-step progress indicator instead of the current single spinner.
- **`flowType`** — `'popup'` | `'redirect'`. Template uses SDK default (popup). No override offered.
- **`pollIntervalMs` / `pollTimeoutMs`** — Controls access request approval polling. Defaults: 2s interval, 5min timeout. Not configurable by end user.
- **`userRole`** — `UserScope` type. Defaults to `scope_user_user`. No way for the template user to request elevated roles.

## Unused SDK Features

- **`client.toolsets`** — Toolset management namespace (`list`, etc.). Not utilized.
- **`client.mcps`** — MCP server management namespace (`list`, etc.). Not utilized.
- **`apiTimeoutMs`** — Client config option (default 30s). Not exposed via BodhiProvider props in the template.

## Missing UI Handling

- **`tenant_selection` server status** — SDK returns this for multi-tenant servers. Template UI doesn't handle it (only handles `direct-not-connected`, `extension-not-found`, etc.).
- **Popup-blocked detection** — SDK throws `'Failed to open review popup - popup may be blocked'` when `window.open()` returns null. Template's `handleLogin` catches this as a toast error, but no specific user guidance (e.g., "allow popups for this site") is shown.
