# ccam vs. sfcc-ci

[sfcc-ci](https://github.com/SalesforceCommerceCloud/sfcc-ci) is the de facto CLI for Commerce Cloud. It lives under the `SalesforceCommerceCloud` GitHub org but is community-supported, not an official Salesforce product. It exists to support CI/CD: deploy code, run jobs, import data, manage sandboxes. It ships a handful of Account Manager commands -- enough to provision a client or grant a role from a pipeline.

ccam is a Commerce Cloud Account Manager CLI and SDK. Its scope is AM and only AM. Every AM endpoint is covered, every resource is typed, and the output formats are built for audits and reports, not pipeline plumbing.

The two tools solve different problems. This document lays out the differences so you can pick the right one for each job.

## Scope

| | sfcc-ci | ccam |
|---|---|---|
| Primary purpose | CI/CD: deploys, code versions, job runs, sandbox lifecycle | Account Manager administration |
| AM coverage | Users, roles, orgs (list only), API clients, auth | Complete AM API surface |
| OCAPI coverage | Yes (code, jobs, data, site import, WebDAV) | No |
| Sandbox API | Yes | No |
| SLAS admin | Yes | No |

If you need to deploy cartridges or manage sandboxes, use sfcc-ci. It's the only game in town for that.

## Account Manager command coverage

| Resource / operation | sfcc-ci | ccam |
|---|---|---|
| **Users** | | |
| List / filter | `user:list` (by org, role, login) | `user list` (by org, role, login, org-realm-access, org-type, modified-after, `findAllByOrg`) |
| Get by login | embedded in `user:list --login` | `user get` (default by login, `--id` for UUID) |
| Current user | -- | `user current` |
| Create | `user:create` | `user create` |
| Update | `user:update` | `user update` (incl. `--roles` for role assignment) |
| Delete | `user:delete` | `user delete` |
| Reset | `user:reset` | `user reset` |
| Disable | -- | `user disable` |
| Audit log | `user:list --auditlogs` | `user audit` |
| Assigned roles | -- | `user roles` |
| Assigned orgs / realms / instances | -- | `user instances`, `user assigned-realms`, `user assigned-instances` |
| Revoke 2FA verifier | -- | `user revoke-verifier` |
| **Roles** | | |
| List | `role:list` | `role list` |
| Get | -- | `role get` |
| Grant to user | `role:grant` | `user update --roles` |
| Revoke from user | `role:revoke` | `user update --roles` |
| **Organizations** | | |
| List / filter | `org:list` | `org list` (by name, starts-with, sf-account-id) |
| Get | -- | `org get` |
| Update | -- | `org update` |
| Realms subresource | -- | `org realms` |
| Instances subresource | -- | `org instances` |
| Audit log | -- | `org audit` |
| **API Clients** | | |
| List | `client:list` | `client list` |
| Get | embedded in `client:list` | `client get` |
| Create | `client:create` | `client create` |
| Update | `client:update` | `client update` |
| Delete | `client:delete` | `client delete` |
| Rotate secret | `client:rotate` | -- |
| Set password | -- | `client set-password` |
| Set auth type | -- | `client set-auth-type` |
| Audit log | `client:list --auditlogs` | `client audit` |
| Assigned realms / instances | -- | `client assigned-realms`, `client assigned-instances` |
| **Realms** | -- | `realm list`, `realm get` |
| **Permissions** | -- | `permission list`, `permission get` |
| **Service Types** | -- | `service-type list`, `service-type get` |
| **Org Configurations** | -- | `org-config get` |
| **Instances** | treated as OCAPI target | `instance list`, `instance get`, `instance validate-filter` |

Two gaps are worth calling out in both directions:

- sfcc-ci has **`client:rotate`**; ccam does not (yet).
- sfcc-ci exposes **`role:grant` / `role:revoke`** as first-class commands. ccam models role assignment as a field on the user (`user update --roles`), because that's what the underlying AM PATCH accepts. sfcc-ci's form is more ergonomic for a single grant; ccam's is closer to the API and composes with other user edits.

## Tooling and UX

| | sfcc-ci | ccam |
|---|---|---|
| Language | JavaScript (CommonJS, callbacks) | TypeScript (ESM, Promises) |
| HTTP client | `request` (deprecated 2020) | `fetch` |
| Public SDK | `module.exports.api` (undocumented) | `@ccam/sdk` with TSDoc on every method |
| Auth profiles | Single session in `~/.sfcc-ci/`, plus `dw.json` in cwd | Named profiles with active-profile pointer (`~/.config/ccam/profiles.yaml`) |
| Credential storage | JSON at `~/.sfcc-ci/token.json` | `~/.config/ccam/credentials` (0600, refresh tokens only) |
| OAuth grants | `password`, `client_credentials`, `authorization_code` | `password`, `client_credentials`, `authorization_code` with PKCE, `refresh_token` |
| Output formats | `--json` or ad-hoc table | `table`, `json`, `csv`, `tsv`, `yaml` |
| Interactive mode | -- | Ink-based TUI with resource browser and drill-down (`ccam` or `ccam --interactive`) |
| Typed sort fields | -- | `UserSortField`, `RoleSortField`, etc. |
| Error types | generic `Error` | `CcamError`, `CcamAuthError`, `CcamNotFoundError` |
| Test framework | Mocha | Vitest, plus separate integration suite |

## When to use which

**Use sfcc-ci when:**
- Deploying code versions, running jobs, or importing data
- Managing sandboxes
- Configuring SLAS tenants and clients
- Your existing pipelines already depend on it

**Use ccam when:**
- Auditing who has access to what, and exporting it as CSV or YAML
- Onboarding or offboarding users in bulk
- Inspecting realms, permissions, service types, or org configurations
- Browsing AM interactively to troubleshoot
- Building your own Node/TS tooling on top of a typed AM SDK

They don't conflict. Plenty of teams will install both.
