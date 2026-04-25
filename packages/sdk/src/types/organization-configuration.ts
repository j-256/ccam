/**
 * Organization-level configuration settings.
 * Contains global settings that apply across the organization.
 */
export interface OrganizationConfiguration {
  /**
   * Allowed Salesforce My Domain suffixes for federation.
   * List of domain suffixes that are permitted for federated authentication.
   */
  allowedSfMyDomainSuffixes: string[];
}
