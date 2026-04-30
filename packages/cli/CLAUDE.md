# ccam

CLI for the Salesforce Commerce Cloud Account Manager REST API.

## What this is

A command-line interface built on `@ccam/sdk` that:
- Exposes all AM API resources as CLI commands
- Supports multiple output formats (table, JSON, CSV, TSV, YAML)
- Provides pagination and field filtering
- Maps user-friendly filter flags to API finder methods

## Directory structure

```
src/
  commands/
    auth.ts         -- login (browser/client/password/manual), logout, list, show, use, rename, status, token
    user.ts         -- user list, get, current, audit, roles, instances, assigned-realms, assigned-instances, create, update, delete, reset, disable, revoke-verifier, grant-role, revoke-role
    org.ts          -- org list, get, realms, instances, audit
    client.ts       -- client list, get, audit, assigned-realms, assigned-instances, create, update, delete, set-password, set-auth-type, grant-role, revoke-role
    role.ts         -- role list, get, audit
    realm.ts        -- realm list, get
    instance.ts     -- instance list, get (with finders)
    permission.ts   -- permission list, get
    service-type.ts -- service-type list, get
    org-config.ts   -- org-config get
  
  auth/
    paths.ts            -- XDG-aware config paths
    profile-store.ts    -- read/write profiles.yaml + credentials
    profile-resolver.ts -- flags > env > profile > defaults
    prompt.ts           -- injectable-stream prompts
    browser-login.ts    -- loopback server for OAuth code capture
    manual-login.ts     -- paste-from-browser fallback
  
  output/
    types.ts   -- OutputFormat type
    detect.ts  -- resolveFormat (TTY detection)
    json.ts    -- formatJson
    csv.ts     -- formatCsv, formatTsv
    yaml-fmt.ts -- formatYaml
    table.ts   -- formatTable
    index.ts   -- renderOutput entrypoint
  
  shared.ts         -- global options (format, fields, page, size, sort, host), parseSort
  client-factory.ts -- createClient helper
  error-handler.ts  -- handleError for CLI errors
  program.ts        -- Command registration
  bin.ts            -- CLI entrypoint
  index.ts          -- exports
```

## How to add a new command

1. **Create command file** in `commands/<resource>.ts`:
   - Import `Command`, `CcamClient`, `GlobalOptions`, helpers
   - Define filter options interface if needed
   - Implement action functions (async, call SDK, render output)
   - Export `register<Resource>Commands(program)` function

2. **Register in program.ts**:
   - Import `register<Resource>Commands`
   - Call it in the registration block

3. **Handle filter-to-finder mapping**:
   - For resources with finders (e.g. users, orgs), create a selector function
   - Map flag combinations to the right SDK method
   - See `user.ts` `selectUserFinder()` for reference

4. **Output behavior**:
   - Use `renderOutput(result, { format, fields })`
   - TTY defaults to table, piped defaults to JSON
   - For paginated results, write page info to stderr (table format only)

5. **Error handling**:
   - Wrap action in try/catch
   - Call `handleError(err)` in catch block
   - `handleError` formats error message and exits with code 1

6. **Write tests** in `__tests__/<resource>.test.ts`:
   - Mock SDK client methods
   - Test command parsing and option handling
   - Test output formatting

## Output behavior

Format resolution:
- `--format <fmt>` -- explicit format
- `-j` -- shorthand for JSON
- TTY default: table
- Piped default: JSON

Field filtering:
- `--fields id,login,email` -- comma-separated list
- Works with all formats
- Filters nested fields in paged responses

Sorting:
- `--sort field:direction` -- e.g. `--sort name:asc`, `--sort createdAt:desc`
- Parsed by `parseSort()` into `{ field, direction }` for the SDK
- Supported on: user, org, client, role, realm, instance list commands
- Not supported on: permission, service-type (SDK does not accept sort for these)

Pagination info:
- Table format: writes "Page X of Y (N total)" to stderr
- Other formats: no extra output (clean for piping)

## Expand flags

Some get/list commands accept `--expand` to inline related resources:
- `user get --expand` -- organizations, roles, organizations,roles
- `user current --expand` -- organizations, roles, organizations,roles
- `client get --expand` -- organizations, roles, organizations,roles
- `role list --expand` -- serviceType
- `role get --expand` -- serviceType
- `org realms --expand` -- instance

## Auth profiles

`ccam auth login` stores credentials in named profiles on disk:
- `~/.config/ccam/profiles.yaml` -- non-secret config (host, clientId, userEmail, activeProfile pointer). Safe to check into dotfiles.
- `~/.config/ccam/credentials` -- 0600 file with refresh tokens, client secrets, cached access tokens.

Login variants:
- `ccam auth login` -- browser-based OAuth (authorization_code + PKCE). Default. Spins up a loopback server on 127.0.0.1:65535 by default; override with `--redirect-port`. Register the redirect URI in the AM API client first.
- `ccam auth login --manual` -- same flow, but user pastes the redirect URL instead of running a loopback server. For SSH/headless environments.
- `ccam auth login --client` -- non-interactive client_credentials login. Prompts for ID/secret or pass via flags.
- `ccam auth login --password` -- non-interactive ROPC login. Prompts for ID/secret/user/password or pass via flags.

Profile management: `auth list` (marks active with `*`), `auth show [name]`, `auth use <name>`, `auth rename <old> <new>`, `auth logout [--profile name]`.

Credential resolution chain (highest to lowest): CLI flags > env vars > active profile > defaults. A profile's cached access token is ignored if any credential-affecting override (host, clientId, clientSecret, user, userPassword -- flag or env) is set at runtime.

## Sub-resource commands

Sub-resource commands fetch related data for a parent resource:
- `user roles <login>` -- roles assigned to a user
- `user instances <login>` -- instances accessible to a user
- `user assigned-realms <login>` -- realms via role-tenant filter
- `user assigned-instances <login>` -- instances via role-tenant filter
- `org realms <idOrName>` -- realms belonging to an org
- `org instances <idOrName>` -- instances belonging to an org
- `client assigned-realms <id>` -- realms via role-tenant filter
- `client assigned-instances <id>` -- instances via role-tenant filter

User sub-resource commands accept a login (email) and resolve it to a UUID internally.
