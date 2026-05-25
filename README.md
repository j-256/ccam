# ccam

TypeScript CLI and SDK for the Salesforce Commerce Cloud Account Manager REST API.

The AM API is largely undocumented. **ccam** serves as both a practical tool and a reference implementation for developers working with Commerce Cloud account management.

## Why ccam?

ccam is built for people who administer Account Manager: security and compliance teams running access audits, team leads onboarding and offboarding users, and developers integrating AM into their own tooling.

- **Complete AM coverage.** Users, organizations, API clients, roles, realms, permissions, service types, org configurations, instances -- every resource, every subresource, every finder.
- **Exportable.** CSV, TSV, YAML, JSON, or table. `ccam user list --org <id> --format csv` produces a spreadsheet-ready roster.
- **Typed SDK.** `ccam-sdk` is a first-class, documented TypeScript library with TSDoc on every method, typed sort enums, and a structured error taxonomy.
- **Named auth profiles.** Switch between orgs or accounts without re-authenticating. Refresh tokens are stored at `~/.config/ccam/credentials` with 0600 permissions.
- **Interactive TUI.** Run `ccam` with no arguments for a keyboard-driven resource browser with drill-down from user to orgs to realms.

Comparisons with the other Commerce Cloud CLIs:

- [b2c-cli](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling) is Salesforce's official CLI (GA, supersedes sfcc-ci). Broad Commerce Cloud coverage (OCAPI, sandboxes, SLAS, MRT), basic AM commands. See [docs/vs-b2c-cli.md](docs/vs-b2c-cli.md).
- [sfcc-ci](https://github.com/SalesforceCommerceCloud/sfcc-ci) is the long-standing community CLI for CI/CD. Minimal AM coverage. See [docs/vs-sfcc-ci.md](docs/vs-sfcc-ci.md).

ccam fills the AM-administration gap both leave open.

## Quick Start: CLI

### Installation

```bash
npm install -g @j-256/ccam
```

### First run

ccam talks to Account Manager over OAuth2, so you need an AM API client before you can log in. If you already use sfcc-ci or other Commerce Cloud tooling, you can reuse that client; otherwise see [`docs/getting-started.md`](docs/getting-started.md) for a step-by-step walkthrough of creating one.

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

### Authentication

Set environment variables for your API client credentials:

```bash
export CCAM_CLIENT_ID="your-client-id"
export CCAM_CLIENT_SECRET="your-client-secret"
export CCAM_HOST="https://account.demandware.com"  # optional, this is the default
```

For user-context operations (e.g. `client.users.current()` in the SDK), also set:

```bash
export CCAM_USER="your-email@example.com"
export CCAM_USER_PASSWORD="your-password"
```

### Example Commands

List users:
```bash
ccam user list
```

List users with filters:
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

List roles:
```bash
ccam role list
```

Export to CSV:
```bash
ccam user list --org abc123 --format csv > users.csv
```

## Quick Start: SDK

### Installation

```bash
npm install ccam-sdk
```

### Usage

```typescript
import { CcamClient } from 'ccam-sdk';

// Create client (uses environment variables or explicit options)
const client = new CcamClient({
  clientId: 'your-client-id',
  clientSecret: 'your-client-secret',
  host: 'https://account.demandware.com' // optional
});

// List users with pagination
const result = await client.users.list({
  page: 0,
  size: 25
});

console.log(result.content);
console.log(`Page ${result.page.number + 1} of ${result.page.totalPages}`);

// Get user by login with expanded organizations
const user = await client.users.getByLogin('user@example.com', {
  expand: 'organizations'
});

console.log(user.mail, user.organizations);

// List roles with sorting
const roles = await client.roles.list({
  page: 0,
  size: 50,
  sort: { field: 'name', direction: 'asc' }
});
```

## Authentication

ccam supports three credential sources (first wins):

1. **Explicit options** passed to `CcamClient` constructor
2. **Environment variables**: `CCAM_CLIENT_ID`, `CCAM_CLIENT_SECRET`, `CCAM_USER`, `CCAM_USER_PASSWORD`, `CCAM_HOST`
3. **Default host**: `https://account.demandware.com`

Two authentication modes:

- **Client-only** (system context): read all resources, most common mode
- **Client + user** (user context): required for the `/users/current` endpoint

## Output Formats

| Format | Use case | CLI flag |
|--------|----------|----------|
| `table` | Human-readable display (TTY default) | `--format table` |
| `json` | Machine-readable, piping to jq | `--format json` or `-j` |
| `csv` | Spreadsheet import, data analysis | `--format csv` |
| `tsv` | Tab-separated (better for whitespace) | `--format tsv` |
| `yaml` | Config files, human-readable structured | `--format yaml` |

When output is piped (not a TTY), JSON is the default format.

## Resources

| Resource | CLI command | SDK property |
|----------|-------------|--------------|
| Users | `ccam user` | `client.users` |
| Organizations | `ccam org` | `client.organizations` |
| API Clients | `ccam client` | `client.apiClients` |
| Roles | `ccam role` | `client.roles` |
| Realms | `ccam realm` | `client.realms` |
| Permissions | `ccam permission` | `client.permissions` |
| Service Types | `ccam service-type` | `client.serviceTypes` |

Most resources support:
- `list` -- paginated list of resources
- `get <id>` -- get a single resource by ID

Additional commands:
- Users: `get` by login (default) or by ID (`--id`), `current`, `audit`, `roles`, `instances`, `assigned-realms`, `assigned-instances`, `create`, `update`, `delete`, `reset`, `disable`, `revoke-verifier`. Filter flags on `list` (see below).
- Organizations: `realms`, `instances`, `audit`, `update`. Filter flags on `list` (`--name`, `--starts-with`, `--sf-account-id`).
- API Clients: `audit`, `assigned-realms`, `assigned-instances`, `create`, `update`, `delete`, `set-password`, `set-auth-type`.
- Instances: `validate-filter`.

Users and API Clients support `--expand` on `get` to include related resources (`organizations`, `roles`, or `organizations,roles`). Roles and Org Realms support `--expand serviceType` / `--expand instance` respectively.

## User Search Filters

The `ccam user list` command maps filter flags to AM API finder methods:

| Flag | API finder | Example |
|------|------------|---------|
| `--login <email>` | `findByLogin` | `ccam user list --login user@example.com` |
| `--org <id>` | `findByOrg` | `ccam user list --org abc123` |
| `--org <id> --all` | `findAllByOrg` | `ccam user list --org abc123 --all` |
| `--role <id>` | `findByRole` | `ccam user list --role def456` |
| `--org <id> --role <id>` | `findByOrgAndRole` | `ccam user list --org abc123 --role def456` |
| `--org-realm-access <id>` | `findByOrgRealmAccess` | `ccam user list --org-realm-access abc123` |

Add `--modified-after <date>` with `--role` to filter by modification date.

## License

MIT
