import { describe, it, expect, beforeAll } from 'vitest';
import { ENV } from './env.js';
import {
  createClient,
  validateSchema,
  assertPagedResponse,
  describe404,
} from './helpers.js';
import { serviceTypeFields } from './field-specs.js';
import type { CcamClient } from '../../index.js';

describe.skipIf(!ENV)('serviceTypes (integration)', () => {
  let client: CcamClient;

  beforeAll(() => {
    client = createClient(ENV!);
  });

  describe('list', () => {
    it('returns a paged response', async () => {
      const result = await client.serviceTypes.list({ size: 25 });
      assertPagedResponse(result, 'serviceTypes.list');
      expect(result.content.length).toBeGreaterThan(0);
    });
  });

  describe('get', () => {
    it('returns the known service type with correct schema', async () => {
      const st = await client.serviceTypes.get(ENV!.serviceTypeId);
      expect(st.id).toBe(ENV!.serviceTypeId);
      validateSchema(st as unknown as Record<string, unknown>, serviceTypeFields, 'ServiceType');
    });
  });

  describe('pagination', () => {
    it('respects page and size params', async () => {
      const result = await client.serviceTypes.list({ page: 0, size: 1 });
      expect(result.content.length).toBe(1);
      expect(result.page.size).toBe(1);
      expect(result.page.number).toBe(0);
    });
  });

  describe404('serviceTypes', (id) => client.serviceTypes.get(id));
});
