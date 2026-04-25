# Role capabilities

Reference for the four AM roles a customer API client or user is typically granted. Each role lists its permission set and the SDK operations it unlocks.

Each role has two identifiers: a user-facing **name** shown in the Account Manager UI (e.g. "Account Administrator") and an **ID** used by the API (e.g. `account-admin`). The SDK accepts the ID.

## Role inclusion

**Account Administrator** ⊇ { **API Administrator**, **User Administrator**, **Read-only Account Administrator** }

Any operation available to API Administrator, User Administrator, or Read-only Account Administrator is also available to Account Administrator. The narrower roles exist to grant a subset of capabilities.

## Summary table

| Name | ID | Permissions | SDK capabilities |
|------|----|-------------|------------------|
| Account Administrator | `account-admin` | 30 | Full user and API client management, organization metadata updates, read-only elsewhere |
| API Administrator | `api-admin` | 10 | API client lifecycle plus read-only access to supporting resources |
| User Administrator | `user-admin` | 12 | User lifecycle plus read-only access to supporting resources |
| Read-only Account Administrator | `readonly-account-admin` | 13 | Read-only across all resources |

---

## Account Administrator

- **Role ID:** `account-admin`
- **Role enum:** `AM_ACCOUNT_ADMIN`
- **Scope:** `GLOBAL`
- **Permission count:** 30

Grants full management of users and API clients plus organization metadata updates (cannot create or delete organizations), plus read access to roles, service types, realms, and tenants. Intended for an administrator who needs to manage every kind of principal and their access within an existing organization.

### Capabilities

- **Users:** create, read, update, delete, disable, reset, read audit log.
- **API clients:** create, read, update (including secret via `setPassword` and auth-type switch), delete (deferred), read audit log.
- **Organizations:** read, update existing org metadata (including inactive-user settings), read audit log, list external users. Cannot create or delete organizations.
- **Realms, tenants, roles, service types:** read only. (The underlying permission set lists realm/tenant CREATE/WRITE/DELETE permissions, but the AM REST API does not expose any endpoints that perform those operations — realms and tenants are infrastructure provisioned by SFCC Operations through other channels.)

### Permissions granted

```
CREATE_APICLIENT                        LIST_EXTERNAL_USER_ORGANIZATION
CREATE_REALM                            LIST_ORGANIZATION
CREATE_TENANT                           READ_APICLIENT
CREATE_USER                             READ_AUDIT_LOG_APICLIENT
DELETE_APICLIENT                        READ_AUDIT_LOG_ORGANIZATION
DELETE_REALM                            READ_AUDIT_LOG_USER
DELETE_TENANT                           READ_GROUP
DELETE_USER                             READ_INACTIVE_USER_SETTINGS_ORGANIZATION
DISABLE_USER                            READ_ORGANIZATION
READ_REALM                              READ_ROLE
READ_SERVICETYPE                        READ_TENANT
READ_USER                               RESET_USER
WRITE_APICLIENT                         WRITE_INACTIVE_USER_SETTINGS_ORGANIZATION
WRITE_ORGANIZATION                      WRITE_REALM
WRITE_TENANT                            WRITE_USER
```

## API Administrator

- **Role ID:** `api-admin`
- **Role enum:** `AM_API_ADMIN`
- **Scope:** `GLOBAL`
- **Permission count:** 10

Grants full API client lifecycle management plus read-only visibility into the resources an API client interacts with (organizations, realms, tenants, service types, roles). Intended for an integration administrator who provisions and rotates API credentials without needing to manage users.

### Capabilities

- **API clients:** create, read, update (including `setPassword` and auth-type switch), delete (deferred), read audit log.
- **Organizations, realms, tenants, roles, service types:** read only.
- **Users:** no access.

### Permissions granted

```
CREATE_APICLIENT      READ_APICLIENT              READ_REALM
DELETE_APICLIENT      READ_AUDIT_LOG_APICLIENT    READ_ROLE
WRITE_APICLIENT       READ_ORGANIZATION           READ_SERVICETYPE
                                                  READ_TENANT
```

## User Administrator

- **Role ID:** `user-admin`
- **Role enum:** `AM_USER_ADMIN`
- **Scope:** `GLOBAL`
- **Permission count:** 12

Grants full user lifecycle management plus read-only visibility into the resources users interact with (organizations, realms, tenants, service types, roles). Intended for HR/onboarding automation or a team lead managing user access without touching API clients.

### Capabilities

- **Users:** create, read, update, delete, disable, reset, read audit log.
- **Organizations, realms, tenants, roles, service types:** read only.
- **API clients:** no access.

### Permissions granted

```
CREATE_USER           READ_AUDIT_LOG_USER    READ_ROLE
DELETE_USER           READ_ORGANIZATION      READ_SERVICETYPE
DISABLE_USER          READ_REALM             READ_TENANT
RESET_USER            READ_USER              WRITE_USER
```

## Read-only Account Administrator

- **Role ID:** `readonly-account-admin`
- **Role enum:** `AM_READONLY_ACCOUNT_ADMIN`
- **Scope:** `GLOBAL`
- **Permission count:** 13

Grants read-only access across every resource. Intended for audit, compliance, and reporting callers that must never modify state.

### Capabilities

- **Users, API clients, organizations, realms, tenants, roles, service types:** read only.
- **Audit logs:** readable for users, API clients, and organizations.
- **No write, create, delete, enable, disable, or reset operations.**

### Permissions granted

```
LIST_ORGANIZATION                        READ_GROUP
READ_APICLIENT                           READ_INACTIVE_USER_SETTINGS_ORGANIZATION
READ_AUDIT_LOG_APICLIENT                 READ_ORGANIZATION
READ_AUDIT_LOG_ORGANIZATION              READ_REALM
READ_AUDIT_LOG_USER                      READ_ROLE
READ_SERVICETYPE                         READ_TENANT
READ_USER
```

---

## Operations by role

Matrix of SDK methods vs. roles. ✅ = allowed. The required permission for each method is given in parentheses.

| SDK method | Required permission | Account Admin | API Admin | User Admin | Read-only Account Admin |
|------------|---------------------|:---:|:---:|:---:|:---:|
| `users.list` / `users.get` / `users.search.*` / `users.getByLogin` | `READ_USER` | ✅ | ❌ | ✅ | ✅ |
| `users.roles` / `users.instances` / `users.assignedRealms` / `users.assignedInstances` | `READ_USER` | ✅ | ❌ | ✅ | ✅ |
| `users.auditLogs` | `READ_AUDIT_LOG_USER` | ✅ | ❌ | ✅ | ✅ |
| `users.create` | `CREATE_USER` | ✅ | ❌ | ✅ | ❌ |
| `users.update` | `WRITE_USER` | ✅ | ❌ | ✅ | ❌ |
| `users.delete` | `DELETE_USER` | ✅ | ❌ | ✅ | ❌ |
| `users.disable` | `DISABLE_USER` | ✅ | ❌ | ✅ | ❌ |
| `users.reset` | `RESET_USER` | ✅ | ❌ | ✅ | ❌ |
| `users.revokeVerifier` | `WRITE_USER` | ✅ | ❌ | ✅ | ❌ |
| `apiClients.list` / `apiClients.get` | `READ_APICLIENT` | ✅ | ✅ | ❌ | ✅ |
| `apiClients.assignedRealms` / `apiClients.assignedInstances` | `READ_APICLIENT` | ✅ | ✅ | ❌ | ✅ |
| `apiClients.auditLogs` | `READ_AUDIT_LOG_APICLIENT` | ✅ | ✅ | ❌ | ✅ |
| `apiClients.create` | `CREATE_APICLIENT` | ✅ | ✅ | ❌ | ❌ |
| `apiClients.update` / `apiClients.setPassword` / `apiClients.setAuthType` | `WRITE_APICLIENT` | ✅ | ✅ | ❌ | ❌ |
| `apiClients.delete(id)` ¹ | `DELETE_APICLIENT` | ✅ | ✅ | ❌ | ❌ |
| `organizations.list` / `organizations.get` / `organizations.search.*` | `READ_ORGANIZATION` | ✅ | ✅ | ✅ | ✅ |
| `organizations.realms` / `organizations.instances` | `READ_ORGANIZATION` | ✅ | ✅ | ✅ | ✅ |
| `organizations.auditLogs` | `READ_AUDIT_LOG_ORGANIZATION` | ✅ | ❌ | ❌ | ✅ |
| `organizations.update` | `WRITE_ORGANIZATION` | ✅ | ❌ | ❌ | ❌ |
| `roles.list` / `roles.get` | `READ_ROLE` | ✅ | ✅ | ✅ | ✅ |
| `serviceTypes.list` / `serviceTypes.get` | `READ_SERVICETYPE` | ✅ | ✅ | ✅ | ✅ |
| `instances.list` / `instances.get` / `instances.search.*` | `READ_TENANT` | ✅ | ✅ | ✅ | ✅ |
| `instances.validateFilter` | _(any authenticated)_ | ✅ | ✅ | ✅ | ✅ |
| `realms.list` / `realms.get` | `READ_REALM` | ✅ | ✅ | ✅ | ✅ |
| `permissions.list` / `permissions.get` | _(any authenticated)_ | ✅ | ✅ | ✅ | ✅ |
| `organizationConfiguration.get` | _(any authenticated)_ | ✅ | ✅ | ✅ | ✅ |

¹ `apiClients.delete(id)` is granted by Account Administrator and API Administrator, but the server will reject the deletion with `412 Precondition Failed` unless the API client has been disabled for at least 7 days. Set `active: false` via `apiClients.update` first, then wait out the cooldown.
