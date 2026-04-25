import type { Link } from './common.js';
import type { OrganizationType, SfIdentityFederation } from './enums.js';

/**
 * Organization (tenant) in the Account Manager system.
 * Organizations group users, realms, and API clients under a single administrative entity.
 */
export interface Organization {
  /**
   * Unique identifier for the organization. Usually a UUID, but some
   * organizations (notably older ones) have a display-name-like string
   * instead. Treat as an opaque identifier -- do not parse or assume
   * a format.
   */
  id: string;

  /** Display name of the organization */
  name: string;

  /** List of user IDs designated as organization contacts */
  contactUsers: string[];

  /** List of realm IDs associated with this organization */
  realms: string[];

  /** Email domains allowed for users in this organization */
  emailDomains: string[];

  /** Minimum entropy requirement for passwords (higher = stronger) */
  passwordMinEntropy: number;

  /** Number of previous passwords to prevent reuse */
  passwordHistorySize: number;

  /** Number of days before passwords expire (0 = no expiration) */
  passwordDaysExpiration: number;

  /** Salesforce Account IDs linked to this organization */
  sfAccountIds: string[];

  /**
   * Organization type. See {@link OrganizationType} for the complete enum
   * (CUSTOMER, INTERNAL, etc.). Union with `string` is intentional: the server
   * may add types; prefer comparing against enum values but tolerate unknown
   * strings.
   */
  type: OrganizationType | string;

  /** Role IDs that require two-factor authentication */
  twoFARoles: string[];

  /** Whether two-factor authentication is enabled for this organization */
  twoFAEnabled: boolean;

  /** Salesforce My Domain name (subdomain part only, without suffix) */
  sfMyDomain: string | null;

  /** Salesforce My Domain suffix (e.g. ".my.salesforce.com") */
  sfMyDomainSuffix: string;

  /** Whether the Salesforce My Domain has been verified */
  sfMyDomainVerified: boolean;

  /** ISO-8601 timestamp of when Salesforce My Domain was verified */
  sfMyDomainVerificationTimestamp: string | null;

  /** Salesforce Identity federation status (DISABLED, ALLOWED) */
  sfIdentityFederation: string;

  /** Whether just-in-time user provisioning is enabled */
  justInTimeUserProvisioningEnabled: boolean;

  /** Allowed MFA verifier types for this organization */
  allowedVerifierTypes: string[];

  /** Whether to automatically disable inactive users */
  disableInactiveUsers: boolean;

  /** Number of days of inactivity before disabling users */
  inactiveUserDays: number;

  /**
   * When true, access-modification operations on this org should carry a
   * `supportTicketId`. Optional because the server omits this field when it
   * would otherwise be false -- an absent value means the org has no such
   * requirement.
   */
  supportTicketRequiredForAccessModification?: boolean;

  /** HATEOAS links for related resources */
  links: Link[];
}

/**
 * Request body for updating an organization. All fields optional (JSON merge semantics).
 * Note: `realms` is a restricted attribute and cannot be modified via PUT.
 */
export interface UpdateOrganizationRequest {
  /** Organization name (max 255 chars) */
  name?: string;

  /** Contact user IDs (max 5) */
  contactUsers?: string[];

  /** Allowed email domains */
  emailDomains?: string[];

  /** Min password entropy (12-100) */
  passwordMinEntropy?: number;

  /** Password history size (min 4) */
  passwordHistorySize?: number;

  /** Password expiration in days (min 1) */
  passwordDaysExpiration?: number;

  /** Salesforce Account IDs (max 50) */
  sfAccountIds?: string[];

  /** Organization type enum value */
  type?: OrganizationType | string;

  /** Role IDs requiring 2FA */
  twoFARoles?: string[];

  /** Whether 2FA is enabled */
  twoFAEnabled?: boolean;

  /** Salesforce My Domain name */
  sfMyDomain?: string | null;

  /** Salesforce My Domain suffix */
  sfMyDomainSuffix?: string;

  /** Salesforce Identity federation status */
  sfIdentityFederation?: SfIdentityFederation | string;

  /** Enable just-in-time user provisioning */
  justInTimeUserProvisioningEnabled?: boolean;

  /** Allowed MFA verifier types */
  allowedVerifierTypes?: string[];

  /** Auto-disable inactive users */
  disableInactiveUsers?: boolean;

  /** Days of inactivity before disable (10-90) */
  inactiveUserDays?: number;
}

/**
 * Response from GET /organizations/{id}/sf-my-domain-verification.
 * Used to set up Salesforce Identity federation for an organization.
 */
export interface SfMyDomainVerificationResponse {
  /** URI the customer visits to complete Salesforce My Domain verification */
  verificationUri: string;
}
