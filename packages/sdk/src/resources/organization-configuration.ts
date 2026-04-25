import type { HttpClient } from '../client.js';
import type { OrganizationConfiguration } from '../types/index.js';

/**
 * Resource class for managing organization configuration in the Account Manager API.
 * Provides access to organization-level settings.
 */
export class OrganizationConfigurationResource {
  private readonly http: HttpClient;

  constructor(httpClient: HttpClient) {
    this.http = httpClient;
  }

  /**
   * Get the current organization configuration.
   * @returns Organization configuration settings
   */
  async get(): Promise<OrganizationConfiguration> {
    return this.http.get<OrganizationConfiguration>(
      '/dw/rest/v1/configurations/organization',
      undefined,
      { resource: 'organizationConfiguration', operation: 'get' }
    );
  }
}
