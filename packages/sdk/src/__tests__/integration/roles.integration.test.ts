import { describe, it, expect, beforeAll } from 'vitest';
import { ENV } from './env.js';
import {
  createClient,
  validateSchema,
  assertPagedResponse,
  describeSortEnums,
  describe404,
} from './helpers.js';
import { roleFields } from './field-specs.js';
import { RoleSortField, type CcamClient } from '../../index.js';

describe.skipIf(!ENV)('roles (integration)', () => {
  let client: CcamClient;

  beforeAll(() => {
    client = createClient(ENV!);
  });

  describe('list', () => {
    it('returns a paged response', async () => {
      const result = await client.roles.list({ size: 25 });
      assertPagedResponse(result, 'roles.list');
      expect(result.content.length).toBeGreaterThan(0);
    });
  });

  describe('get', () => {
    it('returns the known role with correct schema', async () => {
      const role = await client.roles.get(ENV!.roleId);
      expect(role.id).toBe(ENV!.roleId);
      validateSchema(role as unknown as Record<string, unknown>, roleFields, 'Role');
    });
  });

  describe('pagination', () => {
    it('respects page and size params', async () => {
      const result = await client.roles.list({ page: 0, size: 1 });
      expect(result.content.length).toBe(1);
      expect(result.page.size).toBe(1);
      expect(result.page.number).toBe(0);
    });
  });

  describeSortEnums(
    'roles',
    RoleSortField,
    (sort) => client.roles.list({ sort, size: 1 }),
  );

  describe404('roles', (id) => client.roles.get(id));
});
