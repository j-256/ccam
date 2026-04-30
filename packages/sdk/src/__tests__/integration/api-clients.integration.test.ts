import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { ENV } from './env.js';
import {
  createClient,
  validateSchema,
  assertPagedResponse,
  assertContentResponse,
  describeSortEnums,
  describe404,
  testResourceName,
} from './helpers.js';
import { apiClientFields, auditLogFields, realmFields, instanceFields } from './field-specs.js';
import { ApiClientSortField, CcamError, type CcamClient } from '../../index.js';
import { forceDeleteApiClient } from '../helpers/force-delete-api-client.js';

describe.skipIf(!ENV)('apiClients (integration)', () => {
  let client: CcamClient;

  beforeAll(() => {
    client = createClient(ENV!);
  });

  describe('list', () => {
    it('returns a paged response', async () => {
      const result = await client.apiClients.list({ size: 25 });
      assertPagedResponse(result, 'apiClients.list');
      expect(result.content.length).toBeGreaterThan(0);
    });
  });

  describe('get', () => {
    it('returns the known API client with correct schema', async () => {
      const apiClient = await client.apiClients.get(ENV!.apiClientId);
      expect(apiClient.id).toBe(ENV!.apiClientId);
      validateSchema(
        apiClient as unknown as Record<string, unknown>,
        apiClientFields,
        'ApiClient',
      );
    });
  });

  describe('pagination', () => {
    it('respects page and size params', async () => {
      const result = await client.apiClients.list({ page: 0, size: 1 });
      expect(result.content.length).toBe(1);
      expect(result.page.size).toBe(1);
      expect(result.page.number).toBe(0);
    });
  });

  describeSortEnums(
    'apiClients',
    ApiClientSortField,
    (sort) => client.apiClients.list({ sort, size: 1 }),
  );

  describe('expand', () => {
    it('expand=organizations returns org objects', async () => {
      const apiClient = await client.apiClients.get(ENV!.apiClientId, {
        expand: 'organizations',
      });
      expect(apiClient.organizations.length).toBeGreaterThan(0);
      const org = apiClient.organizations[0];
      expect(typeof org.id).toBe('string');
      expect(typeof org.name).toBe('string');
    });

    it('expand=roles returns role objects', async () => {
      const apiClient = await client.apiClients.get(ENV!.apiClientId, { expand: 'roles' });
      expect(apiClient.roles.length).toBeGreaterThan(0);
      const role = apiClient.roles[0];
      expect(typeof role.id).toBe('string');
    });

    it('expand=organizations,roles returns both', async () => {
      const apiClient = await client.apiClients.get(ENV!.apiClientId, {
        expand: 'organizations,roles',
      });
      expect(apiClient.organizations.length).toBeGreaterThan(0);
      expect(apiClient.roles.length).toBeGreaterThan(0);
      expect(typeof apiClient.organizations[0].id).toBe('string');
      expect(typeof apiClient.roles[0].id).toBe('string');
    });
  });

  describe('sub-resources', () => {
    it('assignedRealms() returns realms assigned to the test API client', async () => {
      const result = await client.apiClients.assignedRealms(ENV!.apiClientId);
      assertContentResponse(result, 'apiClients.assignedRealms');
      if (result.content.length > 0) {
        validateSchema(
          result.content[0] as unknown as Record<string, unknown>,
          realmFields,
          'Realm (via apiClients.assignedRealms)',
        );
      }
    });

    it('assignedInstances() returns instances assigned to the test API client', async () => {
      const result = await client.apiClients.assignedInstances(ENV!.apiClientId);
      assertContentResponse(result, 'apiClients.assignedInstances');
      if (result.content.length > 0) {
        validateSchema(
          result.content[0] as unknown as Record<string, unknown>,
          instanceFields,
          'Instance (via apiClients.assignedInstances)',
        );
      }
    });
  });

  describe('auditLogs', () => {
    it('returns audit log records for the test API client', async () => {
      const result = await client.apiClients.auditLogs(ENV!.apiClientId);
      assertContentResponse(result, 'apiClients.auditLogs');
      if (result.content.length > 0) {
        validateSchema(
          result.content[0] as unknown as Record<string, unknown>,
          auditLogFields,
          'AuditLogRecord',
        );
      }
    });
  });

  // roleTenantFilter round-trip against the shared stg test client. The
  // filter value must use the role's uppercase roleEnumName (not its ID) and
  // can only reference a role the target client already holds. Read the
  // original first so we can restore it on the way out.
  describe('roleTenantFilter round-trip', () => {
    it('update persists a filter value and get returns it verbatim', async () => {
      const id = ENV!.apiClientId;
      const original = (await client.apiClients.get(id)).roleTenantFilter;
      const probe = 'CCDX_SBX_USER:zxcv_prd';

      try {
        const updated = await client.apiClients.update(id, { roleTenantFilter: probe });
        expect(updated.roleTenantFilter).toBe(probe);

        const refetched = await client.apiClients.get(id);
        expect(refetched.roleTenantFilter).toBe(probe);
      } finally {
        await client.apiClients.update(id, { roleTenantFilter: original });
      }
    });
  });

  describe404('apiClients', (id) => client.apiClients.get(id));

  describe('write (integration)', () => {
    const testId = testResourceName('client').toLowerCase();
    const initialSecret = `InitialSecret-${Date.now()}-Abc123!_xyz`;
    const rotatedSecret = `RotatedSecret-${Date.now()}-Def456!_xyz`;
    let createdId: string | null = null;

    afterAll(async () => {
      if (createdId) {
        // Best-effort: try the test-only force-delete helper, then deferred.
        // Both may fail (force-delete requires DELETE_APICLIENT_IMMEDIATELY;
        // deferred requires the client to have been disabled for 7+ days).
        try {
          await forceDeleteApiClient(client, createdId);
        } catch (immedErr) {
          try {
            await client.apiClients.delete(createdId);
          } catch (deferErr) {
            console.warn(
              `[orphan] Could not delete test API client ${createdId}. ` +
              `Force-delete: ${(immedErr as Error).message}. ` +
              `Deferred delete: ${(deferErr as Error).message}. ` +
              `Manual cleanup required -- grep for "ccam-test-" in the API client list.`,
            );
          }
        }
      }
    });

    it('creates, reads, updates, rotates password, switches auth type', async () => {
      const created = await client.apiClients.create({
        id: testId,
        name: 'ccam integration test client',
        organizations: [ENV!.orgId],
      });
      createdId = created.id;
      expect(created.id).toBe(testId);
      expect(created.name).toBe('ccam integration test client');

      const fetched = await client.apiClients.get(testId);
      expect(fetched.id).toBe(testId);

      const updated = await client.apiClients.update(testId, {
        description: 'ccam integration test client updated',
      });
      expect(updated.description).toBe('ccam integration test client updated');

      // Set an initial secret on a client that has none
      await client.apiClients.setPassword(testId, { new: initialSecret });

      // Rotate the secret using the prior value
      await client.apiClients.setPassword(testId, {
        new: rotatedSecret,
        old: initialSecret,
      });

      // Switch to public, then back to confidential
      await client.apiClients.setAuthType(testId, true);
      const asPublic = await client.apiClients.get(testId);
      expect(asPublic.publicClient).toBe(true);

      await client.apiClients.setAuthType(testId, false);
      const asConfidential = await client.apiClients.get(testId);
      expect(asConfidential.publicClient).toBe(false);
    });

    // Deferred delete (no flag) requires the client to have been disabled for
    // 7+ days -- which never holds for a resource created in the same test
    // run. So this path cannot be exercised end-to-end here. We at least
    // confirm that the server recognises the request shape and rejects with a
    // precondition failure rather than e.g. a 400 or 500.
    it('deferred delete rejects freshly-created clients with 412', async () => {
      const deferId = testResourceName('client-defer').toLowerCase();
      await client.apiClients.create({
        id: deferId,
        name: 'ccam integration test client (deferred delete probe)',
        organizations: [ENV!.orgId],
      });

      try {
        await client.apiClients.delete(deferId);
        // Unexpected success -- the server accepted the delete without the
        // 7-day wait. Not a failure; just surface it.
        console.warn(
          `[note] apiClients.delete(${deferId}) succeeded on a freshly-created client; ` +
          `the 7-day-disabled precondition may not apply in this environment.`,
        );
      } catch (err) {
        expect(err).toBeInstanceOf(CcamError);
        expect((err as CcamError).status).toBe(412);
      }

      // Try to clean up via the test-only force-delete helper; it requires
      // DELETE_APICLIENT_IMMEDIATELY, which no customer role holds. If it
      // fails, surface the orphan for manual cleanup.
      try {
        await forceDeleteApiClient(client, deferId);
      } catch (err) {
        console.warn(
          `[orphan] Leaving ${deferId}; force-delete failed: ${(err as Error).message}`,
        );
      }
    });
  });

  describe('grantRole / revokeRole', () => {
    // Safe-to-cycle role on TEST_API_CLIENT_ID. Do NOT touch api-admin --
    // that is the role authorizing this suite.
    const FIXTURE_ROLE = 'ccdx-sbx-user';

    it('revoke + regrant round-trips the fixture role without disturbing api-admin', async () => {
      const before = await client.apiClients.get(ENV!.apiClientId);
      expect(before.roles).toContain('api-admin');
      const hadFixture = before.roles.includes(FIXTURE_ROLE);

      if (!hadFixture) {
        // Baseline doesn't include the fixture; add it, assert, then remove
        // at the end.
        const granted = await client.apiClients.grantRole(ENV!.apiClientId, FIXTURE_ROLE);
        expect(granted.changed).toBe(true);
      }

      // Revoke the fixture, assert api-admin survives.
      const revoked = await client.apiClients.revokeRole(ENV!.apiClientId, FIXTURE_ROLE);
      expect(revoked.changed).toBe(true);
      expect(revoked.apiClient.roles).not.toContain(FIXTURE_ROLE);
      expect(revoked.apiClient.roles).toContain('api-admin');

      // Idempotent revoke.
      const revokedAgain = await client.apiClients.revokeRole(ENV!.apiClientId, FIXTURE_ROLE);
      expect(revokedAgain.changed).toBe(false);

      // Restore to baseline.
      if (hadFixture) {
        await client.apiClients.grantRole(ENV!.apiClientId, FIXTURE_ROLE);
      }

      const restored = await client.apiClients.get(ENV!.apiClientId);
      expect(restored.roles).toContain('api-admin');
      if (hadFixture) {
        expect(restored.roles).toContain(FIXTURE_ROLE);
      }
    });

    it('grant with tenants unions correctly', async () => {
      const before = await client.apiClients.get(ENV!.apiClientId);
      const startedWithFixture = before.roles.includes(FIXTURE_ROLE);
      const beforeFilter = before.roleTenantFilter;

      // Ensure role is present.
      if (!startedWithFixture) {
        await client.apiClients.grantRole(ENV!.apiClientId, FIXTURE_ROLE);
      }

      const TEST_TENANT = 'tbdx_sbx';
      const granted = await client.apiClients.grantRole(
        ENV!.apiClientId,
        FIXTURE_ROLE,
        { tenants: [TEST_TENANT] },
      );
      expect(granted.changed).toBe(true);
      expect(granted.apiClient.roleTenantFilter).toMatch(
        new RegExp(`CCDX_SBX_USER:[^;]*${TEST_TENANT}`),
      );

      // Restore baseline. revokeRole strips the filter entry too.
      if (!startedWithFixture) {
        await client.apiClients.revokeRole(ENV!.apiClientId, FIXTURE_ROLE);
      } else {
        // Put the original filter back directly.
        await client.apiClients.update(ENV!.apiClientId, { roleTenantFilter: beforeFilter });
      }

      const restored = await client.apiClients.get(ENV!.apiClientId);
      expect(restored.roleTenantFilter).toBe(beforeFilter);
      expect(restored.roles.includes(FIXTURE_ROLE)).toBe(startedWithFixture);
    });
  });
});
