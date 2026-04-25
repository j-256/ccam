import type { Link } from './common.js';
import type { Instance } from './instance.js';

/**
 * Realm (instance) resource representing a SFCC environment.
 * Realms are 4-character codes identifying specific Commerce Cloud instances.
 */
export interface Realm {
  /** Unique 4-character realm code (e.g. "zzrf", "aaa1") */
  id: string;

  /** Human-readable description of the realm */
  description: string;

  /** Customer name associated with this realm */
  customerName: string;

  /** Organization identifier (NOTE: this is the org name, not UUID) */
  organizationId: string;

  /** Salesforce Account ID linked to this realm */
  sfAccountId: string;

  /** HATEOAS links for related resources */
  links: Link[];
}

/**
 * Realm with instances expanded to full objects.
 * Returned by organizations.realms() with expand='instance'.
 */
export interface RealmExpanded extends Realm {
  /** Full Instance objects instead of just instance IDs */
  instances: Instance[];
}
