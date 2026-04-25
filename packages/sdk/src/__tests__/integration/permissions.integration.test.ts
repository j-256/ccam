import { describe, it, expect, beforeAll } from 'vitest';
import { ENV } from './env.js';
import {
  createClient,
  validateSchema,
  assertContentResponse,
  describe404,
} from './helpers.js';
import { permissionFields } from './field-specs.js';
import type { CcamClient } from '../../index.js';

describe.skipIf(!ENV)('permissions (integration)', () => {
  let client: CcamClient;

  beforeAll(() => {
    client = createClient(ENV!);
  });

  describe('list', () => {
    // Permissions endpoint returns all items without page metadata
    it('returns all permissions', async () => {
      const result = await client.permissions.list();
      assertContentResponse(result, 'permissions.list');
      expect(result.content.length).toBeGreaterThan(0);
    });
  });

  describe('get', () => {
    it('returns the known permission with correct schema', async () => {
      const permission = await client.permissions.get(ENV!.permissionName);
      expect(permission.name).toBe(ENV!.permissionName);
      validateSchema(
        permission as unknown as Record<string, unknown>,
        permissionFields,
        'Permission',
      );
    });
  });

  describe404('permissions', (id) => client.permissions.get(id));
});
