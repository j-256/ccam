# ccam

TypeScript CLI and SDK for the Salesforce Commerce Cloud Account Manager REST API.

## Architecture

Monorepo with two packages:
- `ccam-sdk` -- typed API wrapper for the AM REST API
- `ccam` -- CLI binary built on the SDK

Built with:
- TypeScript (ESM target)
- npm workspaces
- Vitest for testing
- Commander.js for CLI
- YAML, CSV, TSV formatters for output

## Commands

Build:
- `npm run build` -- builds both packages
- `npm run build -w packages/sdk` -- build SDK only
- `npm run build -w packages/cli` -- build CLI only

Test:
- `npm test` -- runs tests for both packages
- `npm test -w packages/sdk` -- test SDK only
- `npm test -w packages/cli` -- test CLI only

Lint and format:
- `npm run lint` -- ESLint on all packages
- `npm run format` -- Prettier on all packages

## Target users (priority order)

1. **Security/compliance** -- periodic audits, "who has access to what", "what changed in the last 30 days", exportable reports
2. **Team leads** -- onboarding/offboarding, bulk role assignment, org membership management
3. **Developers/ops** -- troubleshooting login issues, checking client configuration, verifying role scopes

## Conventions

### Test-Driven Development
Write tests before implementation. Each resource module has corresponding test files in `__tests__/`.

### Module organization
- One resource module per file in `resources/`
- Types in `types/` with TSDoc comments
- Sort fields are typed enums (e.g. `UserSortField`, `RoleSortField`)

### Error handling
- SDK throws `CcamError` or subclasses (`CcamAuthError`, `CcamNotFoundError`)
- Never swallow errors -- propagate with context
- CLI catches at top level via `error-handler.ts`

### Integration tests
Separate manual suite (not CI) that hits a staging AM instance. Purpose: validate that API behavior assumptions haven't drifted -- sort field enums, expand support, finder behavior, error shapes. Run on-demand before releases. Staging AM instances are shared, long-lived environments -- not ephemeral test sandboxes. Read-only probing is safe; write operations must clean up after themselves.

### Expand parameter
Only include `expand` where confirmed by testing against the live API. Don't add expansion points speculatively.

### Write operations
Create/update/delete are supported for users and API clients; organizations support update. Write operations require corresponding AM permissions (e.g. `CREATE_USER`, `WRITE_APICLIENT`). Read-only callers (e.g. `readonly-account-admin`) will receive `403 Forbidden`.

Integration tests that exercise writes must clean up after themselves: staging AM instances are shared and long-lived, not ephemeral sandboxes.

## Roadmap

### Profiles and keychain
Named auth profiles are now implemented using file-backed storage:
- `~/.config/ccam/profiles.yaml` stores non-secret config (host, clientId, userEmail, activeProfile pointer)
- `~/.config/ccam/credentials` stores secrets (refresh tokens, client secrets, cached access tokens) with 0600 permissions

Profile management commands: `auth login` (browser/client/password/manual), `auth logout`, `auth list`, `auth show`, `auth use`, `auth rename`. The `--profile` flag selects which profile to use for any command. Credential resolution chain: CLI flags > env vars > active profile > defaults.

Future enhancement: OS keychain integration (macOS Keychain Access, Linux libsecret, Windows Credential Manager) as an alternative storage backend. Currently implemented with secure file storage.

### TUI
`ccam` with no subcommand or `ccam --interactive` launches an Ink-based TUI. Resource browser with keyboard paging, search/filter, drill-down navigation (user -> orgs -> realms, user -> audit trail). Consumes the SDK identically to the CLI commands.

## AM API notes

Base URL: `https://account.demandware.com/dw/rest/v1`

Authentication:
- OAuth2 with four grant types: client_credentials, password, authorization_code (with PKCE), refresh_token
- Two contexts: client-only (system) or client + user (user-scoped)
- Token caching via `TokenManager` with optional disk persistence callbacks

Pagination:
- Spring Data REST style
- Query params: `page` (0-indexed), `size` (default 25)
- Response: `_embedded` contains resources, `page` contains metadata

Search pattern:
- Finder methods under `/search/` subpath
- Each finder has specific query parameters
- Examples: `findByOrg`, `findByRole`, `findByOrgAndRole`

Sort quirk:
- API expects JPA field names (camelCase for simple fields, dot notation for nested)
- Format: `field,direction` (e.g. `login,asc`)
- SDK provides typed enums for known sort fields

PUT/PATCH quirk:
- PUTs behave as PATCHes -- JSON merge semantics: only fields present in the request body are changed; omitted fields retain their current values
- Upsert behavior: PUT creates if the resource doesn't exist (201), updates if it does (200)
- Some resources have restricted attributes (e.g. `realms` on organizations)
- See `docs/am-api-reference.md` for per-endpoint details

## Roles & permissions

See `docs/role-capabilities.md` for the matrix of which customer roles can invoke each SDK method.
