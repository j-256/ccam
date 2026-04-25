import type { Link } from './common.js';

/**
 * Service type resource representing a Salesforce Commerce Cloud service.
 * Examples include ECOM (core commerce), CDN, B2C (Marketing Cloud), etc.
 */
export interface ServiceType {
  /** Unique identifier for the service type (e.g. "ECOM", "CDN") */
  id: string;

  /** Human-readable description of the service */
  description: string;

  /** HATEOAS links for related resources */
  links: Link[];
}

