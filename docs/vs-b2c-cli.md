# ccam vs. b2c-cli

[b2c-cli](https://github.com/SalesforceCommerceCloud/b2c-developer-tooling) is Salesforce's new official Commerce Cloud CLI, released GA in 2026. It ships under `@salesforce/b2c-cli` alongside an SDK (`@salesforce/b2c-tooling-sdk`), an MCP server, a VS Code extension, and GitHub Action workflow templates. It is on track to supersede sfcc-ci -- the two share on-disk auth storage and b2c-cli's `auth:login` / `auth:logout` are documented as sfcc-ci replacements.

ccam is an AM-focused administration CLI and SDK, with deeper coverage of the AM surface than any other tool today.

This document lays out where the two tools overlap, where each goes further than the other, and how to decide between them.

## Scope

| | b2c-cli | ccam |
|---|---|---|
| Primary purpose | General Commerce Cloud developer tooling (code, sandbox, jobs, data, AM) | AM administration |
| Status | Salesforce-official, GA | Independent, community |
| AM resources covered | Users, roles, API clients, orgs | Users, roles, API clients, orgs, realms, permissions, service types, org configurations, instances |
| OCAPI | Yes | No |
| Sandbox / CIP / CAP | Yes | No |
| SLAS | Yes | No |
| MRT | Yes | No |
| SCAPI schemas | Yes | No |

If you need OCAPI, sandboxes, SLAS, MRT, or any non-AM Commerce Cloud surface, b2c-cli is the only option.

## Account Manager command coverage

| Resource / operation | b2c-cli | ccam |
|---|---|---|
| **Users** | | |
| List | `am users list` (size, page, columns, extended) | `user list` (size, page, sort, format, fields, filters below) |
| Filter by login | `am users get <login>` | `user get <login>`, `user list --login <login>` |
| Filter by org | -- | `user list --org <id>` |
| Filter by role | -- | `user list --role <id>` |
| Filter by org + role | -- | `user list --org <id> --role <id>` |
| Filter by org-realm-access | -- | `user list --org-realm-access <id>` |
| All users in org (no page limit) | -- | `user list --org <id> --all` |
| Modified since | -- | `user list --role <id> --modified-after <date>` |
| Current user (`/users/current`) | -- | `user current` |
| Create | `am users create` | `user create` |
| Update | `am users update` | `user update` (incl. `--roles`) |
| Delete | `am users delete` | `user delete` |
| Reset | `am users reset` | `user reset` |
| Disable | -- (spec has endpoint, no command) | `user disable` |
| Audit log | -- | `user audit` |
| Assigned roles | -- | `user roles` |
| Accessible instances | -- | `user instances` |
| Assigned realms (via RTF) | -- | `user assigned-realms` |
| Assigned instances (via RTF) | -- | `user assigned-instances` |
| Revoke 2FA verifier | -- | `user revoke-verifier` |
| **Roles** | | |
| List | `am roles list` (target-type filter) | `role list` (sort, fields) |
| Get | `am roles get` | `role get` |
| Grant to user | `am roles grant` (dedicated command) | `user grant-role` / `user update --roles` |
| Revoke from user | `am roles revoke` (dedicated command) | `user revoke-role` / `user update --roles` |
| Expand `serviceType` | -- | `role list --expand serviceType`, `role get --expand serviceType` |
| **Organizations** | | |
| List | `am orgs list` | `org list` |
| Get by ID or name | `am orgs get` (ID or name) | `org get` |
| Filter by name / starts-with / SF account ID | -- | `org list --name / --starts-with / --sf-account-id` |
| Update | -- | `org update` |
| Realms subresource | -- | `org realms` |
| Instances subresource | -- | `org instances` |
| Audit log | -- | `org audit` |
| **API Clients** | | |
| List | `am clients list` | `client list` |
| Get | `am clients get` | `client get` |
| Create | `am clients create` | `client create` |
| Update | `am clients update` | `client update` |
| Delete | `am clients delete` | `client delete` |
| Change password | `am clients password` | `client set-password` |
| Set auth type | -- | `client set-auth-type` |
| Audit log | -- | `client audit` |
| Assigned realms / instances | -- | `client assigned-realms`, `client assigned-instances` |
| **Realms** | -- | `realm list`, `realm get` |
| **Permissions** | -- | `permission list`, `permission get` |
| **Service Types** | -- | `service-type list`, `service-type get` |
| **Org Configurations** | -- | `org-config get` |
| **Instances** | -- | `instance list`, `instance get`, `instance validate-filter` |

## Tooling and UX

| | b2c-cli | ccam |
|---|---|---|
| Language | TypeScript (ESM) | TypeScript (ESM) |
| CLI framework | oclif | Commander.js |
| SDK | `@salesforce/b2c-tooling-sdk`, generated from OpenAPI specs | `@ccam/sdk`, hand-written with TSDoc |
| Auth storage | Single stateful session (shared with sfcc-ci) | Named profiles (`~/.config/ccam/profiles.yaml` + 0600 credentials file) |
| OAuth grants | Implicit (for browser), client_credentials, password | authorization_code + PKCE, client_credentials, password, refresh_token |
| Output formats | JSON, table | JSON, CSV, TSV, YAML, table |
| Filter flags on list commands | -- (size, page, columns only) | Resource-specific filters (see coverage table) |
| Typed sort fields | -- | Enums per resource (`UserSortField`, etc.) |
| Interactive TUI | -- | Ink-based browser with drill-down (`ccam` or `--interactive`) |
| MCP server | Yes (`@salesforce/b2c-dx-mcp`) | -- |
| VS Code extension | Yes (`b2c-vs-extension`) | -- |
| GitHub Actions | Yes (workflow templates shipped) | -- |
| Plugin marketplace | Yes (Claude Code, Copilot, Cursor, etc.) | -- |

## What ccam offers that b2c-cli doesn't

- **Audit logs** for users, organizations, and API clients
- **User finders**: `findByOrg`, `findByRole`, `findByOrgAndRole`, `findByOrgRealmAccess`, `findAllByOrg`
- **User and API client subresources**: roles, instances, assigned realms, assigned instances
- **Organization subresources and update**: realms, instances, PUT `/organizations/{id}`
- **Realms, permissions, service types, instances, organization configurations** as first-class resources
- **Organization finders** -- `findByName` with `startsWith` and `sfAccountId`
- **CSV, TSV, YAML output** in addition to table and JSON
- **Named auth profiles** with per-profile switching. b2c-cli uses a single stateful session shared with sfcc-ci
- **Interactive TUI** with drill-down navigation (`ccam` or `ccam --interactive`)
- **PKCE on the authorization code flow**. b2c-cli uses the implicit grant for browser-based login

## What b2c-cli offers that ccam doesn't

- **Every Commerce Cloud surface outside AM** -- OCAPI, Sandbox, SLAS, MRT, SCAPI schemas (see Scope table above)
- **Ecosystem integrations** -- MCP server, VS Code extension, GitHub Action workflow templates, plugin marketplace presence, agent skills

## How to decide

**Use b2c-cli when:**
- You need any Commerce Cloud surface beyond AM
- You use MCP, VS Code, or GitHub Actions integrations
- Your AM needs are basic CRUD on users, roles, and clients

**Use ccam when:**
- You're auditing access and need CSV/YAML exports
- You need AM finders (by org, role, org+role, modified-since)
- You need audit logs, subresource views, realms/permissions/service-types, or org updates
- You want named profiles for multi-tenant work
- You want an interactive browser for ad-hoc exploration

**Use both when:** your workflow spans both sides. They don't conflict; pick per task.

## Notes on spec provenance

b2c-cli ships OpenAPI specs for AM users, roles, and API clients in `packages/b2c-tooling-sdk/specs/am-*.yaml`. Their README describes these as "retrieved from public sources," but as of this writing AM endpoints are not documented on developer.salesforce.com. The specs are effectively published only by being in that GitHub repo. They cover the endpoints b2c-cli uses -- nothing for audit logs, finders beyond `findByLogin`, subresources, realms, permissions, service types, or organization configurations. ccam remains the only external reference for those surfaces.
