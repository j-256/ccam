# @j-256/ccam

Command-line tool for the Salesforce Commerce Cloud Account Manager REST API.

The AM API is largely undocumented. **ccam** gives Account Manager administrators a tool that covers every resource, every subresource, and every finder -- exportable to CSV/TSV/YAML/JSON for audits, automation, and integrations.

Built for:

- **Security and compliance** -- access audits, "who has access to what", "what changed in the last 30 days", exportable reports
- **Team leads** -- onboarding/offboarding, bulk role assignment, org membership management
- **Developers and ops** -- troubleshooting login issues, checking client configuration, verifying role scopes

Highlights:

- **Complete AM coverage.** Users, organizations, API clients, roles, realms, permissions, service types, org configurations, instances.
- **Exportable.** CSV, TSV, YAML, JSON, or a human-readable table. `ccam user list --org <id> --format csv` produces a spreadsheet-ready roster.
- **Named auth profiles.** Switch between orgs or accounts without re-authenticating. Refresh tokens stored at `~/.config/ccam/credentials` with 0600 permissions.
- **Interactive TUI.** Run `ccam` with no arguments for a keyboard-driven resource browser.

For programmatic use, see [`ccam-sdk`](https://www.npmjs.com/package/ccam-sdk) -- the typed TypeScript library that powers this CLI.

## Installation

```bash
npm install -g @j-256/ccam
```

The install adds a `ccam` binary to your PATH. Requires Node.js 22 or later.

## First run

ccam talks to Account Manager over OAuth2, so you need an AM API client before you can log in. If you already use sfcc-ci or other Commerce Cloud tooling, you can reuse that client; otherwise see [the getting-started guide](https://github.com/j-256/ccam/blob/main/docs/getting-started.md) for a step-by-step walkthrough.

Once you have a client ID (and secret, for confidential clients):

```bash
ccam auth login --client-id <your-client-id>
```

This opens a browser to AM, captures the authorization code on a loopback server, and saves a profile to `~/.config/ccam/profiles.yaml` (non-secret) and `~/.config/ccam/credentials` (0600; contains refresh token).

Non-interactive alternatives:

- `ccam auth login --client` -- client_credentials flow (for CI/automation)
- `ccam auth login --password` -- ROPC flow (when SSO/MFA are not enforced)
- `ccam auth login --manual` -- browser flow without a loopback server (for SSH/headless)
- Set environment variables instead -- see below

## Environment variables

For non-profile-based auth, set:

```bash
export CCAM_CLIENT_ID="your-client-id"
export CCAM_CLIENT_SECRET="your-client-secret"
export CCAM_HOST="https://account.demandware.com"  # optional, this is the default
```

For user-context operations (e.g. `ccam user current`):

```bash
export CCAM_USER="your-email@example.com"
export CCAM_USER_PASSWORD="your-password"
```

Resolution order: CLI flags > env vars > active profile > defaults.

## Example commands

List users:
```bash
ccam user list
```

Filter users:
```bash
ccam user list --org abc123 --role def456
ccam user list --login user@example.com
ccam user list --org-realm-access abc123
```

Filter organizations:
```bash
ccam org list --name "Acme Corp"
ccam org list --starts-with "Acme"
ccam org list --sf-account-id "001..."
```

Export to CSV:
```bash
ccam user list --org abc123 --format csv > users.csv
```

## Output formats

| Format | Use case | CLI flag |
|--------|----------|----------|
| `table` | Human-readable display (TTY default) | `--format table` |
| `json` | Machine-readable, piping to jq | `--format json` or `-j` |
| `csv` | Spreadsheet import, data analysis | `--format csv` |
| `tsv` | Tab-separated (better for whitespace) | `--format tsv` |
| `yaml` | Config files, human-readable structured | `--format yaml` |

When output is piped (not a TTY), JSON is the default.

## Resources

| Resource | Command |
|----------|---------|
| Users | `ccam user` |
| Organizations | `ccam org` |
| API Clients | `ccam client` |
| Roles | `ccam role` |
| Realms | `ccam realm` |
| Permissions | `ccam permission` |
| Service Types | `ccam service-type` |
| Instances | `ccam instance` |
| Org Configurations | `ccam org-config` |

Most resources support `list` (paginated) and `get <id>`.

Additional commands:

- **Users**: `get` by login (default) or by ID (`--id`), `current`, `audit`, `roles`, `instances`, `assigned-realms`, `assigned-instances`, `create`, `update`, `delete`, `reset`, `disable`, `revoke-verifier`, `grant-role`, `revoke-role`.
- **Organizations**: `realms`, `instances`, `audit`, `update`.
- **API Clients**: `audit`, `assigned-realms`, `assigned-instances`, `create`, `update`, `delete`, `set-password`, `set-auth-type`, `grant-role`, `revoke-role`.
- **Instances**: `validate-filter`.

Users and API Clients support `--expand` on `get` to include related resources (`organizations`, `roles`, or `organizations,roles`). Roles and Org Realms support `--expand serviceType` and `--expand instance` respectively.

## User search filters

`ccam user list` maps filter flags to AM API finder methods:

| Flag | API finder | Example |
|------|------------|---------|
| `--login <email>` | `findByLogin` | `ccam user list --login user@example.com` |
| `--org <id>` | `findByOrg` | `ccam user list --org abc123` |
| `--org <id> --all` | `findAllByOrg` | `ccam user list --org abc123 --all` |
| `--role <id>` | `findByRole` | `ccam user list --role def456` |
| `--org <id> --role <id>` | `findByOrgAndRole` | `ccam user list --org abc123 --role def456` |
| `--org-realm-access <id>` | `findByOrgRealmAccess` | `ccam user list --org-realm-access abc123` |

Add `--modified-after <date>` with `--role` to filter by modification date.

## Source and issues

- Source: <https://github.com/j-256/ccam>
- Issues: <https://github.com/j-256/ccam/issues>

## License

MIT
