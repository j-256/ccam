import { describe, it, expect, vi } from 'vitest';
import { CcamClient } from '../ccam-client.js';
import { TokenManager } from '../auth/token.js';
import {
  UsersResource,
  OrganizationsResource,
  ApiClientsResource,
  RolesResource,
  RealmsResource,
  PermissionsResource,
  ServiceTypesResource,
} from '../resources/index.js';

describe('CcamClient', () => {
  it('constructs with minimal config', () => {
    const client = new CcamClient({
      clientId: 'test-client',
      clientSecret: 'test-secret',
    });

    expect(client).toBeInstanceOf(CcamClient);
    expect(client.http).toBeDefined();
  });

  it('uses default host when not provided', () => {
    const client = new CcamClient({
      clientId: 'test-client',
      clientSecret: 'test-secret',
    });

    expect(client).toBeInstanceOf(CcamClient);
  });

  it('accepts custom host', () => {
    const client = new CcamClient({
      clientId: 'test-client',
      clientSecret: 'test-secret',
      host: 'https://custom.host.com',
    });

    expect(client).toBeInstanceOf(CcamClient);
  });

  it('accepts user credentials', () => {
    const client = new CcamClient({
      clientId: 'test-client',
      clientSecret: 'test-secret',
      user: 'test@example.com',
      userPassword: 'test-password',
    });

    expect(client).toBeInstanceOf(CcamClient);
  });

  it('accepts injectable fetch', () => {
    const mockFetch = vi.fn();
    const client = new CcamClient({
      clientId: 'test-client',
      clientSecret: 'test-secret',
      fetch: mockFetch,
    });

    expect(client).toBeInstanceOf(CcamClient);
  });

  it('exposes http property', () => {
    const client = new CcamClient({
      clientId: 'test-client',
      clientSecret: 'test-secret',
    });

    expect(client.http).toBeDefined();
    expect(typeof client.http.get).toBe('function');
  });

  it('exposes all resource properties', () => {
    const client = new CcamClient({
      clientId: 'test-client',
      clientSecret: 'test-secret',
    });

    expect(client.users).toBeInstanceOf(UsersResource);
    expect(client.organizations).toBeInstanceOf(OrganizationsResource);
    expect(client.apiClients).toBeInstanceOf(ApiClientsResource);
    expect(client.roles).toBeInstanceOf(RolesResource);
    expect(client.realms).toBeInstanceOf(RealmsResource);
    expect(client.permissions).toBeInstanceOf(PermissionsResource);
    expect(client.serviceTypes).toBeInstanceOf(ServiceTypesResource);
  });

  it('accepts a pre-built TokenManager instead of credentials', () => {
    const tm = new TokenManager({
      clientId: 'x',
      clientSecret: 'y',
      host: 'https://am.example',
    });
    const client = new CcamClient({ host: 'https://am.example', tokenManager: tm });
    expect(client).toBeDefined();
  });

  it('exposes its TokenManager via getTokenManager()', () => {
    const tm = new TokenManager({ clientId: 'x', clientSecret: 'y', host: 'https://am.example' });
    const client = new CcamClient({ host: 'https://am.example', tokenManager: tm });
    expect(client.getTokenManager()).toBe(tm);
    expect(client.getTokenManager()).toBe(tm);
  });
});
