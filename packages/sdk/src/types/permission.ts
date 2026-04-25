import type { Link } from './common.js';

/**
 * Permission resource defining a single access right.
 * Permissions are grouped into roles.
 */
export interface Permission {
  /** Unique name of the permission (e.g. "READ_USER", "WRITE_ORGANIZATION") */
  name: string;

  /** Whether this is an administrative permission requiring elevated access */
  adminPermission: boolean;

  /** HATEOAS links for related resources */
  links: Link[];
}
