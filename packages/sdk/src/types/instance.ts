import type { Link } from './common.js';

/**
 * Tenant instance in the Account Manager.
 * Instances represent specific SFCC environments with format REALM_TYPE (e.g. "aabc_prd").
 */
export interface Instance {
  /** Instance ID in REALM_TYPE format (e.g. "aabc_prd") */
  id: string;

  /** Instance description */
  description: string;

  /** Pod identifier */
  podId: string;

  /** Instance type: prd, stg, dev, sbx, or other */
  tenantType: string;

  /** Unix timestamp (milliseconds) when instance became inactive. Read-only */
  inactiveSinceTimestamp: number | null;

  /** HATEOAS links */
  links: Link[];
}

/**
 * Request body for POST /instances/validatefilter.
 */
export interface ValidateFilterRequest {
  /** Tenant filter string to validate (e.g. "aalm_prd") */
  tenantfilter: string;
}
