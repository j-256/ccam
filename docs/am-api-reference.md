# Account Manager REST API Reference

Reference for the Salesforce B2C Commerce Cloud Account Manager (AM) REST API at `account.demandware.com`.

## Base URL

```
https://account.demandware.com/dw/rest/v1
```

The host is configurable (e.g. staging AM instances), but the path prefix `/dw/rest/v1` is fixed.

## Authentication

### Token endpoint

```
POST https://account.demandware.com/dwsso/oauth2/access_token
```

Note: the token path is `/dwsso/oauth2/access_token`, NOT under `/dw/rest/v1`.

Authentication: HTTP Basic with base64-encoded `{clientId}:{clientSecret}` in the `Authorization` header.

Content type: `application/x-www-form-urlencoded`

### Token response

```json
{
  "access_token": "...",
  "expires_in": 1800,
  "token_type": "Bearer"
}
```

`expires_in` is in seconds.

### Grant types

AM supports four OAuth2 grant types at the token endpoint: `client_credentials`, `authorization_code`, `password`, and `refresh_token`.

**Client credentials** -- authenticates as an API client (no user identity):

```
grant_type=client_credentials
```

Client ID and secret are in the Basic auth header, not the body. The token's identity is the API client itself. Used for scripting, CI, and most read operations. Does not issue a refresh token.

**Authorization code** -- interactive browser-based user login:

```
grant_type=authorization_code&code={code}&redirect_uri={uri}&code_verifier={verifier}
```

Standard OAuth2 authorization code flow with local redirect. PKCE is supported with `code_challenge_method=S256`. The token carries the user's identity, which matters for audit trail attribution, accessing `/users/current`, and any write operations that enforce user-level permissions.

Confidential clients send Basic auth; public clients (API client configured with `tokenEndpointAuthMethod="none"`) omit it and rely on PKCE for proof of possession.

**Resource owner password credentials** -- non-interactive user authentication:

```
grant_type=password&username={email}&password={pass}
```

Client ID and secret are in the Basic auth header. Username and password are URL-encoded in the body.

**Refresh token** -- exchanges a refresh token for a new access token:

```
grant_type=refresh_token&refresh_token={token}
```

Client ID and secret are in the Basic auth header (public clients omit). Issued by the authorization code and password grants; not issued for client credentials. Used to extend sessions without reprompting the user.

User grants (authorization code, password) require an API client and add a user identity on top of the client context. Refresh tokens preserve whatever identity was attached to the original token.

### Token behavior

- Tokens are Bearer tokens passed via `Authorization` header on all `/dw/rest/v1` requests
- On 401, one token refresh attempt is safe before treating it as a hard auth failure

### Client authentication methods

The API client's `tokenEndpointAuthMethod` field determines how a confidential client authenticates at the token endpoint. Three methods are available:

- **client_secret_basic** -- client ID and secret base64-encoded in the `Authorization: Basic` header. Used by this SDK.
- **client_secret_post** -- client ID and secret sent as `client_id` and `client_secret` form parameters in the request body.
- **private_key_jwt** -- client signs a short-lived JWT assertion with its private key. The corresponding public key is registered in AM as the client's `jwtPublicKey`. No shared secret is sent. Replace the usual client credentials with two form parameters:

  ```
  client_assertion_type=urn:ietf:params:oauth:client-assertion-type:jwt-bearer
  client_assertion={signed_jwt}
  ```

  Required JWT claims:
  - `iss` and `sub`: the client ID
  - `aud`: the token endpoint URL (e.g. `https://account.demandware.com/dwsso/oauth2/access_token`) -- identifies AM as the intended audience per RFC 7523
  - `exp`: expiration timestamp bounding the assertion's validity window
  - `iat`: issued-at timestamp

  RS256 is known to work.

This is orthogonal to the grant type: any method can be combined with `client_credentials`, `authorization_code`, `password`, or `refresh_token`. Public clients (`tokenEndpointAuthMethod=none`) skip client authentication entirely and are covered under the authorization code grant above.

## CRUD support by resource

The API follows a consistent pattern where each resource supports a predictable set of HTTP methods:

| CRUD Level | Supported Methods | Resources |
|------------|-------------------|-----------|
| Read + update | GET /, GET /{id}, GET /search, PUT /{id} | Organizations |
| Read + write | GET /, GET /{id}, GET /search, POST /, PUT /{id}, DELETE /{id} | Users, API Clients |
| Read-only | GET /, GET /{id}, GET /search | Realms, Instances, Roles, Service Types |
| Custom | Varies | Permissions, Org Configuration |

Responses are wrapped in HATEOAS wrappers. Every response includes `_v: "1"`.

### PUT semantics

**PUTs behave as PATCHes** -- the API uses JSON merge semantics. Only fields present in the request body are changed; omitted fields retain their current values.

Additional PUT behaviors:
- **Upsert**: if the resource does not exist, PUT creates it (returns 201). If it exists, it updates (returns 200)
- **Restricted attributes**: some fields cannot be changed via PUT. Organizations restrict `realms`. All read-only fields are immutable via PUT
- **Conflict**: returns 409 on validation failure (e.g. ID already exists)

## Pagination

All list endpoints use Spring Data REST-style pagination.

### Request parameters

| Parameter | Default | Description |
|-----------|---------|-------------|
| `page` | `0` | Page number (zero-indexed) |
| `size` | `25` | Results per page |
| `sort` | varies | Format: `field,direction` (e.g. `login,asc`) |

### Response shape

```json
{
  "_embedded": {
    "<resource>": [ ... ]
  },
  "page": {
    "number": 0,
    "size": 25,
    "totalElements": 1234,
    "totalPages": 50
  },
  "_links": { ... },
  "_v": "1"
}
```

### Sort field names

Sort field names are **JPA entity property names**, not the JSON response field names. For example, `email` works as a sort field but the JSON response key is `mail`. Invalid sort fields return 400 with `PropertyReferenceException` (e.g. `No property 'type' found for type 'OrganizationEntity'`).

**Sortable fields by resource**:

| Resource | Sortable fields |
|----------|----------------|
| Users | `id`, `email`, `firstName`, `displayName`, `primaryOrganization`, `createdAt` |
| Organizations | `id`, `name`, `passwordMinEntropy`, `passwordHistorySize`, `passwordDaysExpiration`, `disableInactiveUsers`, `inactiveUserDays`, `justInTimeUserProvisioningEnabled` |
| API Clients | `id`, `name`, `description`, `active`, `createdAt`, `tokenEndpointAuthMethod`, `publicClient` |
| Roles | `id`, `description`, `roleEnumName`, `internalRole`, `serviceType`, `scope`, `targetType`, `twoFAEnabled`, `privileged` |
| Realms | `id`, `name`, `organizationId` |

**Known non-sortable fields**: `lastName`, `login`, `mail`, `userState`, `lastLoginDate`, `lastModified` (users); `type`, `twoFAEnabled` (orgs); `organizationCount`, `passwordModificationTimestamp`, `lastAuthenticatedDate` (API clients).

## Resources

### Users

**Endpoint:** `/dw/rest/v1/users`

#### Operations

| Method | Path | Description |
|--------|------|-------------|
| GET | `/users` | Paginated list |
| GET | `/users/{id}` | Get by UUID (supports `expand`) |
| GET | `/users/current` | Authenticated user. Requires a user-context token; returns 404 with a client_credentials token |
| POST | `/users` | Create user |
| PUT | `/users/{id}` | Update user (JSON merge semantics) |
| DELETE | `/users/{id}` | Delete user |

#### Search finders

Discovered via `/users/search`:

| Finder | Parameters | Notes |
|--------|-----------|-------|
| `findByLogin` | `login`, `expand?` | Exact match by email; returns a **single user object**, not a paged response |
| `findByOrg` | `organization` | Users in an organization |
| `findAllByOrg` | `organization` | All users in an org (variant of findByOrg) |
| `findByRole` | `role`, `modifiedAfter?`, `sort?`, `page?`, `size?` | Users with a role; modifiedAfter accepts ISO-8601 OffsetDateTime (e.g. `2026-01-01T00:00:00Z`); supports sort |
| `findByOrgAndRole` | `organization`, `role` | Users in an org with a specific role |
| `findByOrgRealmAccess` | `organization` | Users with realm access in an org |

#### Expand support

The `expand` parameter replaces ID/name arrays with full nested objects. Behavior varies by endpoint type:

| Endpoint type | `expand=organizations` | `expand=roles` | `expand=organizations,roles` |
|---------------|----------------------|----------------|------------------------------|
| `GET /users/{id}` | Organizations expanded | Roles expanded | Both expanded |
| `GET /users/current` | Organizations expanded | Roles expanded | Both expanded |
| `findByLogin` | Organizations expanded | Not supported | Not supported |
| `GET /users` (list) | Silently ignored | Silently ignored | Silently ignored |
| Other finders | Silently ignored | Silently ignored | Silently ignored |

Multi-expand works with either comma syntax (`expand=organizations,roles`) or repeated param (`expand=organizations&expand=roles`).

**Warning:** Invalid expand values (e.g. `expand=bogus`) return HTTP 200 with an **empty response body** -- not a JSON error. Callers must validate expand values before sending.

#### Sub-resources

| Method | Path | Description |
|--------|------|-------------|
| GET | `/users/{id}/audit-log-records` | Audit trail. Optional `querySize` (int) param. No pagination |
| GET | `/users/{id}/roles` | Roles assigned to this user |
| GET | `/users/{id}/instances` | Instances accessible to user |
| GET | `/users/{id}/assigned-realms` | Realms via role-tenant filter |
| GET | `/users/{id}/assigned-instances` | Instances via role-tenant filter |

#### User actions

Write operations on individual users:

| Method | Path | Request Body | Description |
|--------|------|-------------|-------------|
| POST | `/users/{id}/reset` | `{ supportTicketId? }` | Reset user password |
| POST | `/users/{id}/disable` | `{ supportTicketId? }` | Deactivate user |
| POST | `/users/{uid}/revokeVerifier/{vid}` | -- | Revoke MFA verifier |

#### Fields

| Field | Type | Notes |
|-------|------|-------|
| `id` | string | UUID |
| `mail` | string | Email address (note: JSON key is `mail`, not `email`) |
| `firstName` | string | Max 40 chars |
| `lastName` | string | Max 40 chars, required |
| `displayName` | string | Max 100 chars |
| `businessPhone` | string \| null | |
| `homePhone` | string \| null | |
| `mobilePhone` | string \| null | |
| `preferredLocale` | string \| null | Constrained enum: `none`, `de`, `de_DE`, `en`, `en_CA`, `en_US`, `es`, `fr`, `fr_CA`, `nl` |
| `roles` | string[] | Role IDs |
| `organizations` | string[] | Org IDs (or Organization[] when expanded) |
| `primaryOrganization` | string | UUID, required |
| `roleTenantFilter` | string | Semicolon-delimited: `ENUM:tenant1,tenant2;ENUM2:tenant3`. Tokens before `:` are role `roleEnumName` values (NOT role IDs); each referenced role must be present in the user's `roles` or the server rejects the update with 400 |
| `roleTenantFilterMap` | Record<string, string[]> | Parsed version of roleTenantFilter, keyed by `roleEnumName` |
| `passwordExpirationTimestamp` | number \| null | Epoch millis. Read-only |
| `passwordModificationTimestamp` | number \| null | Epoch millis. Read-only |
| `createdAt` | string | ISO-8601. Read-only |
| `lastModified` | string | ISO-8601. Read-only |
| `lastLoginDate` | string \| null | Date only (YYYY-MM-DD), no time. Read-only |
| `userState` | string | `INITIAL`, `ENABLED`, or `DELETED` (three states) |
| `activationCodeCreationTimestamp` | number \| null | Epoch millis. Read-only |
| `sfUserId` | string \| null | Salesforce user ID. Read-only |
| `verifiers` | Verifier[] | MFA verifiers. Read-only |
| `deleteTimestamp` | number \| null | Epoch millis. Read-only |
| `supportTicketId` | string \| null | Present when a support ticket was used for the last action. Only included when non-null |
| `links` | Link[] | HATEOAS links |

**Verifier object:**

| Field | Type | Notes |
|-------|------|-------|
| `id` | string | |
| `type` | string | `sfa`, `totp`, or `webauthn.cross-platform` |
| `displayName` | string | |
| `status` | string | e.g. `enabled` |

---

### Organizations

**Endpoint:** `/dw/rest/v1/organizations`

#### Operations

| Method | Path | Description |
|--------|------|-------------|
| GET | `/organizations` | Paginated list |
| GET | `/organizations/{id}` | Get by UUID |
| PUT | `/organizations/{id}` | Update org. `realms` is a restricted attribute |

#### Search finders

Discovered via `/organizations/search`:

| Finder | Parameters | Notes |
|--------|-----------|-------|
| `findByName` | `term?`, `startsWith?`, `ignoreCase?` | Two modes: `term` for substring search, `startsWith` for prefix search |
| `findBySfAccountId` | `sfAccountId` | By Salesforce account ID |

#### Sub-resources

| Method | Path | Description |
|--------|------|-------------|
| GET | `/organizations/{id}/realms` | Realms belonging to an org. Supports `expand=instance` |
| GET | `/organizations/{id}/instances` | Instances belonging to an org |
| GET | `/organizations/{id}/audit-log-records` | Audit trail. Optional `querySize` (int) param. No pagination |
| GET | `/organizations/{id}/sf-my-domain-verification` | Returns `{ verificationUri }` for SF domain federation setup |

#### Fields

| Field | Type | Notes |
|-------|------|-------|
| `id` | string | UUID |
| `name` | string | Max 255 chars |
| `contactUsers` | string[] | Max 5 entries |
| `realms` | string[] | Restricted attribute -- cannot be modified via PUT |
| `emailDomains` | string[] | |
| `passwordMinEntropy` | number | Min 12, max 100, default 12 |
| `passwordHistorySize` | number | Min 4, default 4 |
| `passwordDaysExpiration` | number | Min 1, default 90 |
| `sfAccountIds` | string[] | Salesforce account IDs. Max 50 |
| `type` | string | Enum: `UNDEFINED`, `CUSTOMER`, `LINK_PARTNER`, `SOLUTION_PARTNER`, `UNAFFILIATED_PARTNER`, `PROSPECT`, `INTERNAL` |
| `twoFARoles` | string[] | Roles requiring 2FA |
| `twoFAEnabled` | boolean | Default true |
| `sfMyDomain` | string \| null | |
| `sfMyDomainSuffix` | string | Default "salesforce.com" |
| `sfMyDomainVerified` | boolean | |
| `sfMyDomainVerificationTimestamp` | string \| null | ISO-8601. Read-only |
| `sfIdentityFederation` | string | Enum: `DISABLED`, `ALLOWED`, `ENFORCED` |
| `justInTimeUserProvisioningEnabled` | boolean | Default false |
| `allowedVerifierTypes` | string[] | Default ["sfa"] |
| `disableInactiveUsers` | boolean | Default true |
| `inactiveUserDays` | number | Min 10, max 90 |
| `supportTicketRequiredForAccessModification` | boolean | Only included when true |
| `links` | Link[] | HATEOAS links |

---

### API Clients

**Endpoint:** `/dw/rest/v1/apiclients`

#### Operations

| Method | Path | Description |
|--------|------|-------------|
| GET | `/apiclients` | Paginated list |
| GET | `/apiclients/{id}` | Get by client ID (supports `expand`) |
| POST | `/apiclients` | Create API client |
| PUT | `/apiclients/{id}` | Update API client |
| DELETE | `/apiclients/{id}` | Delete. Server requires the client to have been disabled 7+ days; returns 412 otherwise |
| PUT | `/apiclients/{id}/password` | Change client secret. Body: `{ "new": "...", "old"?: "..." }`. `old` is required when the client already has a password |
| POST | `/apiclients/{id}/client-authentication-type` | Switch public/confidential. Body: `{ "public": true\|false }` |

#### Expand support

| Endpoint type | `expand=organizations` | `expand=roles` | `expand=organizations,roles` |
|---------------|----------------------|----------------|------------------------------|
| `GET /apiclients/{id}` | Organizations expanded | Roles expanded | Both expanded |
| `GET /apiclients` (list) | Silently ignored | Silently ignored | Silently ignored |

Same expand behavior as users: works on get, silently ignored on list.

#### Sub-resources

| Method | Path | Description |
|--------|------|-------------|
| GET | `/apiclients/{id}/audit-log-records` | Audit trail. Optional `querySize` (int) param. No pagination |
| GET | `/apiclients/{id}/assigned-realms` | Realms assigned via role-tenant filter |
| GET | `/apiclients/{id}/assigned-instances` | Instances assigned via role-tenant filter |

#### Fields

| Field | Type | Notes |
|-------|------|-------|
| `id` | string | Client ID |
| `name` | string | Max 200 chars |
| `description` | string \| null | Max 256 chars |
| `jwtPublicKey` | string \| null | PEM format, max 8192 chars |
| `redirectUrls` | string[] | OAuth redirect URIs |
| `scopes` | string[] | |
| `defaultScopes` | string[] | Default ["mail"] |
| `organizations` | string[] | **Returns org names, not UUIDs** (unlike Users, which return UUIDs) |
| `organizationCount` | number | |
| `active` | boolean | |
| `roles` | string[] | |
| `roleTenantFilter` | string | Same format as User.roleTenantFilter; referenced roles must be present in this client's `roles` |
| `roleTenantFilterMap` | Record<string, string[]> | Parsed version of roleTenantFilter, keyed by `roleEnumName` |
| `tokenEndpointAuthMethod` | string | Enum: `private_key_jwt`, `client_secret_post`, `client_secret_basic`, `none`. Default: `private_key_jwt` |
| `passwordModificationTimestamp` | number \| null | Epoch millis |
| `lastAuthenticatedDate` | string \| null | Date only (YYYY-MM-DD). Read-only |
| `disabledTimestamp` | string \| null | **ISO-8601** string, not epoch millis. Read-only |
| `createdAt` | string | ISO-8601. Read-only |
| `publicClient` | boolean | |
| `needsInitialPassword` | boolean | Server-computed; true when the client is confidential and has never had a password set. Read-only |
| `links` | Link[] | HATEOAS links |

---

### Roles

**Endpoint:** `/dw/rest/v1/roles`

#### Operations

| Method | Path | Description |
|--------|------|-------------|
| GET | `/roles` | Paginated list |
| GET | `/roles/{id}` | Get by role ID |
| GET | `/roles?expand=serviceType` | List with expanded ServiceType object. Optional `roleTargetType` filter |
| GET | `/roles/{id}?expand=serviceType` | Get with expanded ServiceType object |

#### Expand support

| Endpoint type | `expand=serviceType` |
|---------------|---------------------|
| `GET /roles` | ServiceType object expanded inline. Also accepts `roleTargetType` filter param |
| `GET /roles/{id}` | ServiceType object expanded inline |

This is different from user/apiClient expand -- it replaces the `serviceType` string ID with a full ServiceType object.

#### Fields

| Field | Type | Notes |
|-------|------|-------|
| `id` | string | Pattern: `[-_a-zA-Z0-9]+` |
| `description` | string | |
| `roleEnumName` | string | Max 50 chars, unique |
| `internalRole` | boolean | Default false |
| `serviceType` | string | Maps to a ServiceType.id |
| `permissions` | string[] | Permission names |
| `scope` | string | `GLOBAL` or `INSTANCE`. Default: GLOBAL |
| `targetType` | string \| null | `User`, `ApiClient`, or null |
| `twoFAEnabled` | boolean | Default true |
| `privileged` | boolean | Default false |
| `links` | Link[] | HATEOAS links |

---

### Realms

**Endpoint:** `/dw/rest/v1/realms`

#### Operations

| Method | Path | Description |
|--------|------|-------------|
| GET | `/realms` | Paginated list |
| GET | `/realms/{id}` | Get by realm ID |

#### Fields

| Field | Type | Notes |
|-------|------|-------|
| `id` | string | 4-character code (e.g. `aaay`) |
| `description` | string | |
| `customerName` | string | |
| `organizationId` | string | Org name, not UUID |
| `sfAccountId` | string | Salesforce account ID |
| `links` | Link[] | HATEOAS links |

Default sort is `name,asc`.

---

### Instances (Tenants)

**Endpoint:** `/dw/rest/v1/instances`

The API uses "Tenants" internally but the REST path is `/instances`.

#### Operations

| Method | Path | Description |
|--------|------|-------------|
| GET | `/instances` | Paginated list |
| GET | `/instances/{id}` | Get by ID (format: `REALM_TYPE`, e.g. `aabc_prd`) |

#### Search finders

| Finder | Parameters | Notes |
|--------|-----------|-------|
| `findByOrganization` | `organization` (required) | Instances belonging to an org |
| `findByRealm` | `realm` (comma-separated) | Instances by realm ID(s) |
| `findById` | `id` (comma-separated) | Bulk lookup by instance IDs |

#### Utility endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/instances/validatefilter` | Validate tenant filter string. Body: `{ tenantfilter: "aalm_prd" }`. Returns empty 200 on success, 400 ErrorsResponse on failure |

#### Fields

| Field | Type | Notes |
|-------|------|-------|
| `id` | string | Format: `REALM_TYPE` (e.g. `aabc_prd`, `aabc_stg`) |
| `description` | string | Max 500 chars |
| `podId` | string | Pod identifier |
| `tenantType` | string | `prd`, `stg`, `dev`, `sbx`, `other` |
| `inactiveSinceTimestamp` | number \| null | Epoch millis. Read-only |
| `links` | Link[] | HATEOAS links |

---

### Permissions

**Endpoint:** `/dw/rest/v1/permissions`

#### Operations

| Method | Path | Description |
|--------|------|-------------|
| GET | `/permissions` | List all. Optional `adminPermission` (boolean) filter param |
| GET | `/permissions/{name}` | Get by name |

#### Fields

| Field | Type | Notes |
|-------|------|-------|
| `name` | string | e.g. `READ_USER` |
| `adminPermission` | boolean | Computed field |
| `links` | Link[] | HATEOAS links |

---

### Service Types

**Endpoint:** `/dw/rest/v1/service-types`

#### Operations

| Method | Path | Description |
|--------|------|-------------|
| GET | `/service-types` | List all |
| GET | `/service-types/{id}` | Get by ID |

#### Fields

| Field | Type | Notes |
|-------|------|-------|
| `id` | string | e.g. `ECOM`, `AM`, `CCDX` |
| `description` | string | Max 500 chars |
| `links` | Link[] | HATEOAS links |

#### Service types catalog

`AM`, `API`, `APPD`, `BILLINGAPP`, `CC`, `CCDX`, `CHURN`, `CIP`, `CLOUD`, `CNP_OPS`, `CONFIG_CENTRAL`, `CQUOTIENT`, `CRM`, `DOC`, `ECOM`, `GRAFANA`, `INPUT_QUEUE`, `LC`, `MCP`, `OCAPI_EXPLORER`, `OEPS`, `OM`, `ReleaseManagement`, `RND`, `SF`, `SLAS_SAA`, `split.io`, `STATUSPAGE_IO`, `UMON`, `XCHANGE`

---

### Organization Configuration

**Endpoint:** `/dw/rest/v1/configurations/organization`

#### Operations

| Method | Path | Description |
|--------|------|-------------|
| GET | `/configurations/organization` | Get org configuration. Returns 404 if unavailable |

#### Fields

| Field | Type | Notes |
|-------|------|-------|
| `allowedSfMyDomainSuffixes` | string[] | Allowed Salesforce domain suffixes for federation |

No HATEOAS wrapper on this response.

## Audit log records

Audit logs are sub-resources available on Users, Organizations, and API Clients.

**Path pattern:** `/<resource>/{id}/audit-log-records`

### Response shape

Audit log endpoints return a `ContentResponse` (`{ _v, content, links }`), not a `PagedResponse`. There is no `page` object and no way to paginate through results.

**No pagination support.** The following were tested and confirmed to have no effect -- the API returns 200 but ignores the parameters entirely:

- `page` / `size` (Spring Data REST style)
- `offset` / `count`
- `start` / `limit`

The `links` array contains only a `self` link. No `next`, `prev`, `first`, or `last` links ever appear. Individual audit log records have empty `links` arrays.

### querySize parameter

All audit-log-records endpoints accept an optional `querySize` (Integer) query parameter. This is the only way to control the number of records returned, but its behavior is non-obvious.

**querySize does not map 1:1 to the number of records returned.** For small values it is approximately correct, but larger values return fewer or more records than requested. Observed behavior on an org with 109 total audit log records:

| querySize | records returned |
|-----------|-----------------|
| 1 | 1 |
| 2 | 2 |
| 3 | 3 |
| 5 | 5 |
| 6 | 5 |
| 7 | 6 |
| 10 | 9 |
| 15 | 15 |
| 20 | 20 |
| 25 | 38 |
| 50 | 65 |
| 75 | 90 |
| 100 | 109 (all) |

Similarly, for a user with 9 total records: `querySize=2` returned 4, `querySize=3` returned 5, `querySize=5` returned 7. The pattern is not a simple ratio -- it appears that `querySize` controls an internal query window rather than directly limiting the output row count. Records within a window boundary are returned in full even if that exceeds the requested size.

**Gotchas:**
- **Default (no querySize):** returns all records
- **Very large values (e.g. 10000):** returns 0 records, not all records. There appears to be an internal cap that causes the query to return nothing. Avoid passing arbitrarily large values; omit the parameter to get all records
- **querySize=0:** untested, avoid

### Fields

| Field | Type | Notes |
|-------|------|-------|
| `authorId` | string \| null | null when the action was a system process |
| `authorDisplayName` | string | |
| `authorEmail` | string \| null | |
| `eventType` | string | See observed values below |
| `eventMessage` | string | Human-readable, localized via Accept-Language header |
| `supportTicketId` | string \| null | Null or omitted when no ticket is associated |
| `timestamp` | string | ISO-8601 |
| `arguments` | string[] \| null | Contextual data (e.g. old/new values: `["Password Length", "7", "12"]`) |
| `links` | Link[] | Always empty array on individual records |

### Observed eventType values

`USER_CHANGE_PASSWORD`, `USER_ASSIGN_TO_ROLE`, `USER_ASSIGN_FILTER_TO_ROLE`, `ORGANIZATION_MODIFIED`, `USER_REMOVE_FILTER_FROM_ROLE`

This is not exhaustive -- the API does not publish a full enum of event types.

## Enums

Complete enum values:

| Enum | Values |
|------|--------|
| UserState | `INITIAL`, `ENABLED`, `DELETED` |
| SfIdentityFederation | `DISABLED`, `ALLOWED`, `ENFORCED` |
| OrganizationType | `UNDEFINED`, `CUSTOMER`, `LINK_PARTNER`, `SOLUTION_PARTNER`, `UNAFFILIATED_PARTNER`, `PROSPECT`, `INTERNAL` |
| TokenEndpointAuthMethod | `private_key_jwt`, `client_secret_post`, `client_secret_basic`, `none` |
| Locale (User) | `none`, `de`, `de_DE`, `en`, `en_CA`, `en_US`, `es`, `fr`, `fr_CA`, `nl` |
| RoleScope | `GLOBAL`, `INSTANCE` |
| RoleTargetType | `User`, `ApiClient` |
| TenantType | `prd`, `stg`, `dev`, `sbx`, `other` |

## Error response shapes

The AM API returns errors in inconsistent formats depending on the error type:

| Status | Shape | Example |
|--------|-------|---------|
| 400 (validation) | `{ errors: [{ code, message, fieldErrors }] }` | Bad request parameters |
| 401 (auth) | `{ errors: [{ code: "InvalidBearerTokenException", message }] }` | Expired/invalid token |
| 403 (permission) | `{ fault: { type, message } }` | Insufficient permissions |
| 404 (not found) | Empty body or HTML | Resource doesn't exist |
| 409 (conflict) | `{ errors: [{ code, message }] }` | Create/update validation failure |
| 412 (precondition failed) | varies | Delete constraints (e.g. API client not yet disabled 7+ days) |
| 504 (timeout) | `"upstream request timeout"` (plain text) | Expensive query |

### Observed error codes

- `MissingServletRequestParameterException` -- 400, a required query parameter is missing (e.g. calling `findByOrgRealmAccess` without `organization`)
- `InvalidBearerTokenException` -- 401, token expired or invalid
- `ClientAccessForbiddenException` -- 403, client lacks required permissions
- `PropertyReferenceException` -- 400, invalid sort field name

## Known quirks

- **`/users/current` requires user-context token** -- returns 404 with a client_credentials token (no user identity to return)
- **Sort fields are JPA property names, not JSON keys** -- e.g. the JSON field is `mail` but the sort field is `email`; `lastLoginDate` does not work as a sort field. Invalid fields return 400 `PropertyReferenceException`
- **ApiClient `organizations` field returns names, not UUIDs** -- unlike User responses which return org IDs in the `organizations` array
- **`expand` works on single-resource GET, silently ignored on list** -- `GET /users/{id}` and `GET /apiclients/{id}` support `expand=organizations`, `expand=roles`, and `expand=organizations,roles`. List endpoints and most finders silently ignore expand. Invalid expand values return 200 with empty body
- **Organization `expand` does not work** -- `GET /organizations/{id}` ignores expand for realms and contactUsers
- **Organization `id` may be a string name, not a UUID** -- observed org IDs like `"Demandware  Inc."` (with double space); treat as opaque strings
- **`findByName` has two modes** -- `term` for substring search, `startsWith` for prefix search; they are mutually exclusive parameters
- **`findByRole` supports `modifiedAfter`** -- accepts ISO-8601 OffsetDateTime (e.g. `2026-01-01T00:00:00Z`)
- **Audit logs have no pagination** -- `page`, `size`, `offset`, `count`, `start`, `limit` params are all silently ignored. The only control is `querySize`, which is approximate (see "Audit log records" section above)
- **Audit log `querySize` overflow** -- very large `querySize` values (e.g. 10000) return 0 records instead of all records. Omit the parameter entirely to get all records
- **PUTs behave as PATCHes** -- JSON merge semantics: only fields present in the request body are changed
- **Realm `organizationId` is an org name, not UUID** -- inconsistent with other resources that use UUIDs for org references
- **ApiClient `disabledTimestamp` is ISO-8601, not epoch millis** -- serializes as a string, not a number. Unlike other Epoch-millis timestamp fields on the same resource
- **ApiClient `setPassword` body uses `new`/`old`, not `password`** -- `PUT /apiclients/{id}/password` expects `{ "new": "...", "old"?: "..." }`. `old` is required when the client already has a password set
- **ApiClient create defaults to `active: false`** -- a freshly-created client is disabled; the server starts a 7-day cooldown before the delete path becomes available. Set `active: true` on create (or via subsequent update) to make the client usable
- **ApiClient delete has a 7-day cooldown** -- `DELETE /apiclients/{id}` rejects with 412 unless the client has been disabled (`active: false`) for 7+ days
