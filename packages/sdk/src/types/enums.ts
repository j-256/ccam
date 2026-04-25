/**
 * User account state enumeration.
 */
export enum UserState {
  /** User account has been created but not yet activated */
  INITIAL = 'INITIAL',
  /** User account is active and enabled */
  ENABLED = 'ENABLED',
  /** User account has been deleted */
  DELETED = 'DELETED',
}

/**
 * Salesforce Identity federation status for an organization.
 */
export enum SfIdentityFederation {
  /** Salesforce Identity federation is disabled */
  DISABLED = 'DISABLED',
  /** Salesforce Identity federation is allowed */
  ALLOWED = 'ALLOWED',
  /** Salesforce Identity federation is enforced for all users */
  ENFORCED = 'ENFORCED',
}

/**
 * Role scope indicating whether a role applies globally or to specific instances.
 */
export enum RoleScope {
  /** Role applies globally across all instances */
  GLOBAL = 'GLOBAL',
  /** Role applies to specific instances only */
  INSTANCE = 'INSTANCE',
}

/**
 * Target type for role assignment.
 */
export enum RoleTargetType {
  /** Role can be assigned to users */
  USER = 'User',
  /** Role can be assigned to API clients */
  API_CLIENT = 'ApiClient',
}

/**
 * Multi-factor authentication verifier device types.
 */
export enum VerifierType {
  /** Single-factor authentication */
  SFA = 'sfa',
  /** Time-based one-time password */
  TOTP = 'totp',
  /** WebAuthn cross-platform authenticator (e.g. security key, passkey) */
  WEBAUTHN_CROSS_PLATFORM = 'webauthn.cross-platform',
}

/**
 * Valid sort fields for realm queries.
 * Populated empirically via integration testing against the AM API.
 */
export enum RealmSortField {
  ID = 'id',
  NAME = 'name',
  ORGANIZATION_ID = 'organizationId',
}

/**
 * Valid sort fields for user queries.
 * Populated empirically via integration testing against the AM API.
 *
 * Known non-sortable fields: lastName, login, mail, userState, externalId,
 * lastLoginDate, lastModified.
 */
export enum UserSortField {
  ID = 'id',
  EMAIL = 'email',
  FIRST_NAME = 'firstName',
  DISPLAY_NAME = 'displayName',
  PRIMARY_ORGANIZATION = 'primaryOrganization',
  CREATED_AT = 'createdAt',
}

/**
 * Valid sort fields for organization queries.
 * Populated empirically via integration testing against the AM API.
 *
 * Known non-sortable fields: type, twoFAEnabled, sfIdentityFederation,
 * sfMyDomain, sfMyDomainVerified, emailDomains.
 */
export enum OrganizationSortField {
  ID = 'id',
  NAME = 'name',
  PASSWORD_MIN_ENTROPY = 'passwordMinEntropy',
  PASSWORD_HISTORY_SIZE = 'passwordHistorySize',
  PASSWORD_DAYS_EXPIRATION = 'passwordDaysExpiration',
  DISABLE_INACTIVE_USERS = 'disableInactiveUsers',
  INACTIVE_USER_DAYS = 'inactiveUserDays',
  JUST_IN_TIME_USER_PROVISIONING_ENABLED = 'justInTimeUserProvisioningEnabled',
}

/**
 * Valid sort fields for API client queries.
 * Populated empirically via integration testing against the AM API.
 *
 * Known non-sortable fields: organizationCount, passwordModificationTimestamp,
 * lastAuthenticatedDate, disabledTimestamp, needsInitialPassword.
 */
export enum ApiClientSortField {
  ID = 'id',
  NAME = 'name',
  DESCRIPTION = 'description',
  ACTIVE = 'active',
  CREATED_AT = 'createdAt',
  TOKEN_ENDPOINT_AUTH_METHOD = 'tokenEndpointAuthMethod',
  PUBLIC_CLIENT = 'publicClient',
}

/**
 * Valid sort fields for role queries.
 * Populated empirically via integration testing against the AM API.
 * All JPA-exposed fields are sortable.
 */
export enum RoleSortField {
  ID = 'id',
  DESCRIPTION = 'description',
  ROLE_ENUM_NAME = 'roleEnumName',
  INTERNAL_ROLE = 'internalRole',
  SERVICE_TYPE = 'serviceType',
  SCOPE = 'scope',
  TARGET_TYPE = 'targetType',
  TWO_FA_ENABLED = 'twoFAEnabled',
  PRIVILEGED = 'privileged',
}

/**
 * Organization type classification.
 */
export enum OrganizationType {
  /** Unspecified or unknown organization type */
  UNDEFINED = 'UNDEFINED',
  /** Customer organization */
  CUSTOMER = 'CUSTOMER',
  /** Link partner organization */
  LINK_PARTNER = 'LINK_PARTNER',
  /** Solution partner organization */
  SOLUTION_PARTNER = 'SOLUTION_PARTNER',
  /** Unaffiliated partner organization */
  UNAFFILIATED_PARTNER = 'UNAFFILIATED_PARTNER',
  /** Prospect organization */
  PROSPECT = 'PROSPECT',
  /** Internal Salesforce organization */
  INTERNAL = 'INTERNAL',
}

/**
 * Token endpoint authentication method for API clients.
 */
export enum TokenEndpointAuthMethod {
  /** Private key JWT authentication */
  PRIVATE_KEY_JWT = 'private_key_jwt',
  /** Client secret via POST body */
  CLIENT_SECRET_POST = 'client_secret_post',
  /** Client secret via HTTP Basic auth */
  CLIENT_SECRET_BASIC = 'client_secret_basic',
  /** No client authentication required */
  NONE = 'none',
}
