import { HttpClient } from './client.js';
import { TokenManager } from './auth/token.js';
import { resolveCredentials } from './auth/credentials.js';
import type { CredentialOptions } from './auth/credentials.js';
import {
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

export interface CcamClientCredentialOptions extends CredentialOptions {
  fetch?: typeof fetch;
}

export interface CcamClientTokenManagerOptions {
  host: string;
  tokenManager: TokenManager;
  fetch?: typeof fetch;
}

export type CcamClientOptions = CcamClientCredentialOptions | CcamClientTokenManagerOptions;

export class CcamClient {
  /** @internal Escape hatch for untyped HTTP calls. Prefer typed resource methods. */
  readonly http: HttpClient;
  private readonly tokenManager: TokenManager;

  readonly users: UsersResource;
  readonly organizations: OrganizationsResource;
  readonly apiClients: ApiClientsResource;
  readonly roles: RolesResource;
  readonly realms: RealmsResource;
  readonly instances: InstancesResource;
  readonly permissions: PermissionsResource;
  readonly serviceTypes: ServiceTypesResource;
  readonly organizationConfiguration: OrganizationConfigurationResource;

  constructor(options: CcamClientOptions) {
    let host: string;
    if ('tokenManager' in options) {
      this.tokenManager = options.tokenManager;
      host = options.host;
    } else {
      const credentials = resolveCredentials(options);
      this.tokenManager = new TokenManager({
        clientId: credentials.clientId,
        clientSecret: credentials.clientSecret,
        user: credentials.user,
        userPassword: credentials.userPassword,
        host: credentials.host,
        fetch: options.fetch,
      });
      host = credentials.host;
    }

    this.http = new HttpClient({
      baseUrl: host,
      getToken: () => this.tokenManager.getToken(),
      fetch: options.fetch,
    });

    this.users = new UsersResource(this.http);
    this.organizations = new OrganizationsResource(this.http);
    this.apiClients = new ApiClientsResource(this.http);
    this.roles = new RolesResource(this.http);
    this.realms = new RealmsResource(this.http);
    this.instances = new InstancesResource(this.http);
    this.permissions = new PermissionsResource(this.http);
    this.serviceTypes = new ServiceTypesResource(this.http);
    this.organizationConfiguration = new OrganizationConfigurationResource(this.http);
  }

  /**
   * Returns the underlying TokenManager. Used by the CLI's `auth token`
   * command to mint or refresh a token without making an API call.
   * Not part of the primary SDK surface for typical consumers.
   */
  getTokenManager(): TokenManager {
    return this.tokenManager;
  }
}
