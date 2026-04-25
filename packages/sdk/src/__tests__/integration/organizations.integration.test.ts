import { describe, it, expect, beforeAll } from 'vitest';
import { ENV } from './env.js';
import {
  createClient,
  validateSchema,
  assertPagedResponse,
  assertContentResponse,
  describeSortEnums,
  describe404,
} from './helpers.js';
import { organizationFields, realmFields, auditLogFields } from './field-specs.js';
import { OrganizationSortField, type CcamClient } from '../../index.js';

describe.skipIf(!ENV)('organizations (integration)', () => {
  let client: CcamClient;

  beforeAll(() => {
    client = createClient(ENV!);
  });

  describe('list', () => {
    it('returns a paged response containing the known org', async () => {
      const result = await client.organizations.list({ size: 25 });
      assertPagedResponse(result, 'organizations.list');
      expect(result.content.length).toBeGreaterThan(0);
    });
  });

  describe('get', () => {
    it('returns the known org with correct schema', async () => {
      const org = await client.organizations.get(ENV!.orgId);
      expect(org.id).toBe(ENV!.orgId);
      validateSchema(org as unknown as Record<string, unknown>, organizationFields, 'Organization');
    });
  });

  describe('pagination', () => {
    it('respects page and size params', async () => {
      const result = await client.organizations.list({ page: 0, size: 1 });
      expect(result.content.length).toBe(1);
      expect(result.page.size).toBe(1);
      expect(result.page.number).toBe(0);
    });
  });

  describeSortEnums(
    'organizations',
    OrganizationSortField,
    (sort) => client.organizations.list({ sort, size: 1 }),
  );

  describe('realms', () => {
    it('returns realms for the test org', async () => {
      const result = await client.organizations.realms(ENV!.orgId);
      assertContentResponse(result, 'organizations.realms');
      expect(result.content.length).toBeGreaterThan(0);
      validateSchema(
        result.content[0] as unknown as Record<string, unknown>,
        realmFields,
        'Realm (via org)',
      );
    });
  });

  describe('getSfMyDomainVerification', () => {
    it('returns a verification URI for the test org', async () => {
      const result = await client.organizations.getSfMyDomainVerification(ENV!.orgId);
      validateSchema(
        result as unknown as Record<string, unknown>,
        { verificationUri: 'string' },
        'SfMyDomainVerificationResponse',
      );
      expect(result.verificationUri.length).toBeGreaterThan(0);
    });
  });

  describe('auditLogs', () => {
    it('returns audit log records for the test org', async () => {
      const result = await client.organizations.auditLogs(ENV!.orgId);
      assertContentResponse(result, 'organizations.auditLogs');
      if (result.content.length > 0) {
        validateSchema(
          result.content[0] as unknown as Record<string, unknown>,
          auditLogFields,
          'AuditLogRecord',
        );
      }
    });
  });

  describe('search', () => {
    // Search finders return content+links without page metadata
    it('findByName returns the test org', async () => {
      const result = await client.organizations.search.findByName({
        term: ENV!.orgName,
      });
      assertContentResponse(result, 'findByName');
      expect(result.content.length).toBeGreaterThan(0);
    });

    it.skipIf(!ENV?.sfAccountId)(
      'findBySfAccountId returns results',
      async () => {
        const result = await client.organizations.search.findBySfAccountId({
          sfAccountId: ENV!.sfAccountId!,
        });
        assertContentResponse(result, 'findBySfAccountId');
        expect(result.content.length).toBeGreaterThan(0);
      },
    );
  });

  describe404('organizations', (id) => client.organizations.get(id));
});
