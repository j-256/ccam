# ccam-sdk

Typed TypeScript SDK for the [Salesforce Commerce Cloud Account Manager](https://account.demandware.com) REST API.

The AM API is largely undocumented. `ccam-sdk` is a first-class, documented TypeScript library covering every AM resource: users, organizations, API clients, roles, realms, permissions, service types, org configurations, and instances. It powers the [`@j-256/ccam`](https://www.npmjs.com/package/@j-256/ccam) CLI but is also designed for direct use in your own tooling.

- TSDoc on every method
- Typed sort enums (no stringly-typed `sort` params)
- Structured error taxonomy (`CcamError`, `CcamAuthError`, `CcamNotFoundError`)
- Spring Data REST pagination, normalized
- Token caching with optional disk persistence callbacks

## Installation

```bash
npm install ccam-sdk
```

Requires Node.js 22 or later.

## Usage

```typescript
import { CcamClient } from 'ccam-sdk';

const client = new CcamClient({
  clientId: 'your-client-id',
  clientSecret: 'your-client-secret',
  host: 'https://account.demandware.com' // optional, this is the default
});

// List users with pagination
const result = await client.users.list({ page: 0, size: 25 });
console.log(result.content);
console.log(`Page ${result.page.number + 1} of ${result.page.totalPages}`);

// Get user by login with expanded organizations
const user = await client.users.getByLogin('user@example.com', {
  expand: 'organizations'
});

// List roles with sorting
const roles = await client.roles.list({
  page: 0,
  size: 50,
  sort: { field: 'name', direction: 'asc' }
});
```

## Authentication

OAuth2 with four grant types: `client_credentials`, `password`, `authorization_code` (with PKCE), and `refresh_token`. Two contexts: client-only (system) or client + user (user-scoped). Token caching is built in; supply persistence callbacks if you want refresh tokens to survive process restarts.

Credentials can come from explicit constructor options or environment variables (`CCAM_CLIENT_ID`, `CCAM_CLIENT_SECRET`, `CCAM_USER`, `CCAM_USER_PASSWORD`, `CCAM_HOST`).

## Resources

| SDK property | Resource |
|--------------|----------|
| `client.users` | Users |
| `client.organizations` | Organizations |
| `client.apiClients` | API Clients |
| `client.roles` | Roles |
| `client.realms` | Realms |
| `client.permissions` | Permissions |
| `client.serviceTypes` | Service Types |

Most resources support paginated `list`, `get(id)`, and resource-specific finders (`findByOrg`, `findByRole`, `findByOrgAndRole`, etc.). Users and API clients support full CRUD; organizations support update.

## CLI

If you want a command-line tool instead of (or in addition to) the SDK, install [`@j-256/ccam`](https://www.npmjs.com/package/@j-256/ccam):

```bash
npm install -g @j-256/ccam
ccam user list --org abc123 --format csv > users.csv
```

## License

MIT
