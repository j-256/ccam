# @ccam/sdk

Typed TypeScript SDK for the Salesforce Commerce Cloud Account Manager REST API.

## What this is

A lightweight, typed API wrapper that:
- Handles OAuth2 client credentials flow with token caching
- Provides resource-oriented methods for all AM API endpoints
- Returns typed responses with proper error handling
- Supports pagination, sorting, filtering, and expansion

## Directory structure

```
src/
  auth/
    credentials.ts -- credential resolution (options -> env vars)
    token.ts       -- TokenManager: client_credentials, password, refresh_token grants + onTokenRefresh callback + initialCache
    pkce.ts        -- PKCE verifier/challenge generator (RFC 7636)
    auth-code.ts   -- authorization_code exchange, authorize URL builder, state generator
    index.ts       -- public auth exports
  
  resources/
    users.ts                       -- UsersResource (list, get, search, audit)
    organizations.ts               -- OrganizationsResource
    organization-configuration.ts  -- OrganizationConfigurationResource
    api-clients.ts                 -- ApiClientsResource
    roles.ts                       -- RolesResource
    realms.ts                      -- RealmsResource
    instances.ts                   -- InstancesResource
    permissions.ts                 -- PermissionsResource
    service-types.ts               -- ServiceTypesResource
    index.ts                       -- resource exports
  
  types/
    common.ts                   -- Link, PageInfo, PagedResponse, SortOption, AuditLogOptions
    user.ts                     -- User, UserExpanded, Verifier
    organization.ts             -- Organization
    organization-configuration.ts -- OrganizationConfiguration
    api-client.ts               -- ApiClient
    role.ts                     -- Role, RoleExpanded
    realm.ts                    -- Realm, RealmExpanded
    instance.ts                 -- Instance
    permission.ts               -- Permission
    service-type.ts             -- ServiceType
    audit-log.ts                -- AuditLogRecord
    enums.ts                    -- UserState, RoleScope, OrganizationType, TokenEndpointAuthMethod, sort field enums
    index.ts                    -- type exports
  
  client.ts       -- HttpClient (low-level HTTP with error handling)
  errors.ts       -- CcamError, CcamAuthError, CcamNotFoundError, CcamRefreshFailedError
  ccam-client.ts  -- CcamClient (main SDK entrypoint)
  index.ts        -- public SDK exports
```

## How to add a new resource

1. **Define types** in `types/<resource>.ts`:
   - Base type interface (e.g. `Role`)
   - Expanded type if the API supports it (e.g. `RoleExpanded`)
   - Sort field enum if sortable (e.g. `RoleSortField`)
   - Export from `types/index.ts`

2. **Create resource class** in `resources/<resource>s.ts`:
   - Constructor takes `HttpClient`
   - Methods: `list()`, `get(id)`, finder methods under `.search` property
   - Use `PaginationOptions` for list/search methods
   - Use `SortOption<SortField>` for sorting
   - Include TSDoc comments for all public methods
   - Export from `resources/index.ts`

3. **Add to CcamClient** in `ccam-client.ts`:
   - Add property (e.g. `readonly roles: RolesResource`)
   - Initialize in constructor

4. **Write tests** in `__tests__/<resource>s.test.ts`:
   - Test all methods with mock HTTP responses
   - Test error cases (404, auth failure)
   - Test pagination and sorting

5. **Export from SDK** in `index.ts`:
   - Export resource class
   - Export types and enums

## HTTP client notes

All network calls go through `HttpClient`:
- Never call `fetch()` directly in resource modules
- `HttpClient` handles auth token injection, error mapping, retry logic
- Injectable `fetch` for testing (default: global `fetch`)

Standard pattern:
```typescript
return this.http.get<ResponseType>(
  '/dw/rest/v1/path',
  params,
  { resource: 'resourceName', operation: 'operationName' }
);
```

## Auth notes

Credential chain (first wins):
1. Explicit options passed to `CcamClient` constructor
2. Environment variables: `CCAM_CLIENT_ID`, `CCAM_CLIENT_SECRET`, `CCAM_USER`, `CCAM_USER_PASSWORD`, `CCAM_HOST`
3. Default host: `https://account.demandware.com`

Grant types supported:
- `client_credentials` -- system context, read all resources
- `password` -- user context, required for `/users/current` endpoint
- `authorization_code` -- user context via browser OAuth, requires PKCE
- `refresh_token` -- automatic renewal when access token expires

Token management:
- `TokenManager` caches tokens in memory
- Separate cache keys for each grant type and user combination
- `initialCache` option accepts pre-populated token state (e.g. from disk storage)
- `onTokenRefresh` callback notified when tokens are refreshed (e.g. to persist to disk)
- `profileName` option adds context to refresh errors

Errors:
- `CcamRefreshFailedError` thrown on 400/401 from the refresh_token grant; carries the profile name for context

Client construction:
- Standard: pass credential options (clientId, clientSecret, user, userPassword, host)
- Advanced: pass `{ host, tokenManager }` for pre-built TokenManager scenarios (e.g. CLI profile integration)
