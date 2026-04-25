export const VERSION = '0.1.0';

export { CcamClient } from './ccam-client.js';
export type { CcamClientOptions } from './ccam-client.js';

export { HttpClient } from './client.js';
export type { HttpClientOptions, ErrorContext } from './client.js';

export * from './errors.js';

export * from './auth/index.js';

export {
  UsersResource,
  OrganizationsResource,
  ApiClientsResource,
  RolesResource,
  RealmsResource,
  InstancesResource,
  PermissionsResource,
  ServiceTypesResource,
  OrganizationConfigurationResource,
} from './resources/index.js';

export type {
  Link,
  PageInfo,
  ContentResponse,
  PagedResponse,
  SortDirection,
  SortOption,
  PaginationOptions,
  AuditLogOptions,
  Organization,
  User,
  UserExpanded,
  UserExpandedRoles,
  UserExpandedAll,
  Verifier,
  ApiClient,
  ApiClientExpandedOrgs,
  ApiClientExpandedRoles,
  ApiClientExpandedAll,
  Role,
  RoleExpanded,
  Realm,
  RealmExpanded,
  Instance,
  Permission,
  ServiceType,
  AuditLogRecord,
  OrganizationConfiguration,
  UpdateOrganizationRequest,
  SfMyDomainVerificationResponse,
  CreateApiClientRequest,
  UpdateApiClientRequest,
  SetPasswordRequest,
  SetAuthTypeRequest,
  CreateUserRequest,
  UpdateUserRequest,
  ResetUserRequest,
  DisableUserRequest,
  ValidateFilterRequest,
} from './types/index.js';

export {
  UserState,
  SfIdentityFederation,
  RoleScope,
  RoleTargetType,
  VerifierType,
  RealmSortField,
  UserSortField,
  OrganizationSortField,
  ApiClientSortField,
  RoleSortField,
  OrganizationType,
  TokenEndpointAuthMethod,
} from './types/index.js';
