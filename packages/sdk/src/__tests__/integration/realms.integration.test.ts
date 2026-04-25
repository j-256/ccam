import { describe, it, expect, beforeAll } from 'vitest';
import { ENV } from './env.js';
import {
  createClient,
  validateSchema,
  assertPagedResponse,
  describeSortEnums,
  describe404,
} from './helpers.js';
import { realmFields } from './field-specs.js';
import { RealmSortField, type CcamClient } from '../../index.js';

describe.skipIf(!ENV)('realms (integration)', () => {
  let client: CcamClient;

  beforeAll(() => {
    client = createClient(ENV!);
  });

  describe('list', () => {
    it('returns a paged response', async () => {
      const result = await client.realms.list({ size: 25 });
      assertPagedResponse(result, 'realms.list');
      expect(result.content.length).toBeGreaterThan(0);
    });
  });

  describe('get', () => {
    it('returns the known realm with correct schema', async () => {
      const realm = await client.realms.get(ENV!.realmId);
      expect(realm.id).toBe(ENV!.realmId);
      validateSchema(realm as unknown as Record<string, unknown>, realmFields, 'Realm');
    });
  });

  describe('pagination', () => {
    it('respects page and size params', async () => {
      const result = await client.realms.list({ page: 0, size: 1 });
      expect(result.content.length).toBe(1);
      expect(result.page.size).toBe(1);
      expect(result.page.number).toBe(0);
    });
  });

  describeSortEnums(
    'realms',
    RealmSortField,
    (sort) => client.realms.list({ sort, size: 1 }),
  );

  describe404('realms', (id) => client.realms.get(id));
});
