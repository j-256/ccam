import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { ENV } from './env.js';
import {
  createClient,
  validateSchema,
  assertPagedResponse,
  assertContentResponse,
  describeSortEnums,
  describe404,
  safeDelete,
} from './helpers.js';
import { userFields, auditLogFields, roleFields, instanceFields, realmFields } from './field-specs.js';
import { CcamNotFoundError, UserSortField, UserState, type CcamClient } from '../../index.js';

describe.skipIf(!ENV)('users (integration)', () => {
  let client: CcamClient;

  beforeAll(() => {
    console.warn(
      '\n*** User-context auth tests not yet implemented -- client-credentials only. ***\n' +
      '*** users.current() and user-scoped token flow still need coverage.         ***\n'
    );
    client = createClient(ENV!);
  });

  describe('list', () => {
    it('returns a paged response containing the known user', async () => {
      const result = await client.users.list({ size: 25 });
      assertPagedResponse(result, 'users.list');
      expect(result.content.length).toBeGreaterThan(0);
    });
  });

  describe('get', () => {
    it('returns the known user with correct schema', async () => {
      const user = await client.users.get(ENV!.userId);
      expect(user.id).toBe(ENV!.userId);
      validateSchema(user as unknown as Record<string, unknown>, userFields, 'User');
    });
  });

  describe('getByLogin', () => {
    it('returns the same user as get()', async () => {
      const user = await client.users.getByLogin(ENV!.userLogin);
      expect(user.id).toBe(ENV!.userId);
    });
  });

  describe('pagination', () => {
    it('respects page and size params', async () => {
      const result = await client.users.list({ page: 0, size: 1 });
      expect(result.content.length).toBe(1);
      expect(result.page.size).toBe(1);
      expect(result.page.number).toBe(0);
    });
  });

  describeSortEnums(
    'users',
    UserSortField,
    (sort) => client.users.list({ sort, size: 1 }),
  );

  describe('expand', () => {
    it('expand=organizations returns org objects', async () => {
      const user = await client.users.get(ENV!.userId, { expand: 'organizations' });
      expect(user.organizations.length).toBeGreaterThan(0);
      const org = user.organizations[0];
      expect(typeof org.id).toBe('string');
      expect(typeof org.name).toBe('string');
    });

    it('expand=roles returns role objects', async () => {
      const user = await client.users.get(ENV!.userId, { expand: 'roles' });
      expect(user.roles.length).toBeGreaterThan(0);
      const role = user.roles[0];
      expect(typeof role.id).toBe('string');
    });

    it('expand=organizations,roles returns both', async () => {
      const user = await client.users.get(ENV!.userId, { expand: 'organizations,roles' });
      expect(user.organizations.length).toBeGreaterThan(0);
      expect(user.roles.length).toBeGreaterThan(0);
      expect(typeof user.organizations[0].id).toBe('string');
      expect(typeof user.roles[0].id).toBe('string');
    });
  });

  describe('search', () => {
    // findByOrg, findAllByOrg, findByOrgAndRole return content+links without page metadata
    it('findByOrg returns users in the test org', async () => {
      const result = await client.users.search.findByOrg({ organization: ENV!.orgId });
      assertContentResponse(result, 'findByOrg');
      expect(result.content.length).toBeGreaterThan(0);
    });

    it('findAllByOrg returns users (including deleted) in the test org', async () => {
      const result = await client.users.search.findAllByOrg({ organization: ENV!.orgId });
      assertContentResponse(result, 'findAllByOrg');
      expect(result.content.length).toBeGreaterThan(0);
    });

    it('findByRole returns users with the test role', async () => {
      const result = await client.users.search.findByRole({ role: ENV!.roleId, size: 5 });
      assertPagedResponse(result, 'findByRole');
      expect(result.content.length).toBeGreaterThan(0);
    });

    it('findByOrgAndRole returns users in the test org with the test role', async () => {
      const result = await client.users.search.findByOrgAndRole({
        organization: ENV!.orgId,
        role: ENV!.roleId,
      });
      assertContentResponse(result, 'findByOrgAndRole');
      expect(result.content.length).toBeGreaterThan(0);
    });

    // findByOrgRealmAccess requires user-context auth (401 with client-credentials)
    it.todo('findByOrgRealmAccess (requires user-context auth)');
  });

  describe('sub-resources', () => {
    it('roles() returns roles assigned to the test user', async () => {
      const result = await client.users.roles(ENV!.userId);
      assertContentResponse(result, 'users.roles');
      if (result.content.length > 0) {
        validateSchema(
          result.content[0] as unknown as Record<string, unknown>,
          roleFields,
          'Role (via users.roles)',
        );
      }
    });

    it('instances() returns instances accessible to the test user', async () => {
      const result = await client.users.instances(ENV!.userId);
      assertContentResponse(result, 'users.instances');
      if (result.content.length > 0) {
        validateSchema(
          result.content[0] as unknown as Record<string, unknown>,
          instanceFields,
          'Instance (via users.instances)',
        );
      }
    });

    it('assignedRealms() returns realms assigned to the test user', async () => {
      const result = await client.users.assignedRealms(ENV!.userId);
      assertContentResponse(result, 'users.assignedRealms');
      if (result.content.length > 0) {
        validateSchema(
          result.content[0] as unknown as Record<string, unknown>,
          realmFields,
          'Realm (via users.assignedRealms)',
        );
      }
    });

    it('assignedInstances() returns instances assigned to the test user', async () => {
      const result = await client.users.assignedInstances(ENV!.userId);
      assertContentResponse(result, 'users.assignedInstances');
      if (result.content.length > 0) {
        validateSchema(
          result.content[0] as unknown as Record<string, unknown>,
          instanceFields,
          'Instance (via users.assignedInstances)',
        );
      }
    });
  });

  describe('auditLogs', () => {
    it('returns audit log records for the test user', async () => {
      const result = await client.users.auditLogs(ENV!.userId);
      assertContentResponse(result, 'users.auditLogs');
      if (result.content.length > 0) {
        validateSchema(
          result.content[0] as unknown as Record<string, unknown>,
          auditLogFields,
          'AuditLogRecord',
        );
      }
    });
  });

  describe404('users', (id) => client.users.get(id));

  describe.todo('user-context auth (current(), user-scoped token)');

  describe('write (integration)', () => {
    let createdId: string | null = null;

    afterAll(async () => {
      if (createdId) {
        await safeDelete(async () => {
          const user = await client.users.get(createdId!);
          if (user.userState !== UserState.DELETED) {
            await client.users.disable(createdId!);
          }
          await client.users.delete(createdId!);
        });
      }
    });

    it('creates, reads, updates, disables, deletes', async () => {
      const domainSeparator = ENV!.userLogin.lastIndexOf('@');
      if (domainSeparator <= 0 || domainSeparator === ENV!.userLogin.length - 1) {
        throw new Error('TEST_USER_LOGIN must be an email address');
      }
      const emailDomain = ENV!.userLogin.slice(domainSeparator + 1);
      const mail = `ccam-test-${Date.now()}@${emailDomain}`;
      const created = await client.users.create({
        mail,
        firstName: 'Ccam',
        lastName: 'Test',
        primaryOrganization: ENV!.orgId,
        organizations: [ENV!.orgId],
      });
      createdId = created.id;
      expect(typeof created.id).toBe('string');
      expect(created.mail).toBe(mail);

      const fetched = await client.users.get(created.id);
      expect(fetched.id).toBe(created.id);

      const updated = await client.users.update(created.id, {
        displayName: 'Ccam Test (updated)',
      });
      expect(updated.displayName).toBe('Ccam Test (updated)');

      await client.users.disable(created.id);
      const disabled = await client.users.get(created.id);
      expect(disabled.userState).toBe(UserState.DELETED);

      await client.users.delete(created.id);
      createdId = null;
    });

    it('revokeVerifier on a user with no verifiers responds with 404', async () => {
      await expect(
        client.users.revokeVerifier(ENV!.userId, 'nonexistent-verifier-id'),
      ).rejects.toBeInstanceOf(CcamNotFoundError);
    });
  });

  describe('grantRole / revokeRole', () => {
    // Fixture role: scoped (INSTANCE) role that james.klein@salesforce.com
    // currently holds. We'll cycle its tenant list, not add/remove the role
    // itself, so the baseline never drifts.
    const FIXTURE_ROLE = 'ccdx-sbx-user';
    const FIXTURE_ROLE_ENUM = 'CCDX_SBX_USER';
    const TEST_TENANT = 'tbdx_sbx';

    it('grantRole no-op returns changed=false and does not mutate server state', async () => {
      const before = await client.users.get(ENV!.userId);
      expect(before.roles).toContain(FIXTURE_ROLE);

      const result = await client.users.grantRole(ENV!.userId, FIXTURE_ROLE);
      expect(result.changed).toBe(false);

      const after = await client.users.get(ENV!.userId);
      expect(after.roleTenantFilter).toBe(before.roleTenantFilter);
      expect(after.roles.sort()).toEqual(before.roles.sort());
    });

    it('adds then removes a tenant from the filter end-to-end', async () => {
      const before = await client.users.get(ENV!.userId);
      expect(before.roles).toContain(FIXTURE_ROLE);
      expect(before.roleTenantFilter).not.toMatch(new RegExp(`${FIXTURE_ROLE_ENUM}:[^;]*${TEST_TENANT}`));

      // Add the probe tenant via grantRole.
      const granted = await client.users.grantRole(ENV!.userId, FIXTURE_ROLE, {
        tenants: [TEST_TENANT],
      });
      expect(granted.changed).toBe(true);
      expect(granted.user.roleTenantFilter).toMatch(new RegExp(`${FIXTURE_ROLE_ENUM}:[^;]*${TEST_TENANT}`));

      // Idempotency: granting the same tenant again is a no-op.
      const second = await client.users.grantRole(ENV!.userId, FIXTURE_ROLE, {
        tenants: [TEST_TENANT],
      });
      expect(second.changed).toBe(false);

      // Restore by re-PUTting the baseline filter directly (revokeRole is
      // tested below; we don't want to bundle cleanup with the feature under
      // test).
      await client.users.update(ENV!.userId, { roleTenantFilter: before.roleTenantFilter });

      const restored = await client.users.get(ENV!.userId);
      expect(restored.roleTenantFilter).toBe(before.roleTenantFilter);
    });

    it('revokeRole + regrant round-trips cleanly and server auto-strips filter', async () => {
      const before = await client.users.get(ENV!.userId);
      expect(before.roles).toContain(FIXTURE_ROLE);
      const originalFilter = before.roleTenantFilter;
      expect(originalFilter).toMatch(new RegExp(`${FIXTURE_ROLE_ENUM}:`));

      // Revoke.
      const revoked = await client.users.revokeRole(ENV!.userId, FIXTURE_ROLE);
      expect(revoked.changed).toBe(true);
      expect(revoked.user.roles).not.toContain(FIXTURE_ROLE);
      // Server auto-strips the filter entry for the removed role.
      expect(revoked.user.roleTenantFilter).not.toMatch(new RegExp(`${FIXTURE_ROLE_ENUM}:`));

      // Idempotent revoke.
      const revokedAgain = await client.users.revokeRole(ENV!.userId, FIXTURE_ROLE);
      expect(revokedAgain.changed).toBe(false);

      // Regrant with the original tenants to restore baseline.
      // Parse the original filter to extract this role's tenants.
      const entry = originalFilter.split(';').find((s) => s.startsWith(`${FIXTURE_ROLE_ENUM}:`));
      expect(entry).toBeDefined();
      const originalTenants = entry!.slice(FIXTURE_ROLE_ENUM.length + 1).split(',');

      await client.users.grantRole(ENV!.userId, FIXTURE_ROLE, { tenants: originalTenants });

      const restored = await client.users.get(ENV!.userId);
      expect(restored.roles).toContain(FIXTURE_ROLE);
      // Filter contains the same role entry as before -- exact string equality
      // may not hold because other entries could reorder; we assert the per-role
      // slice matches.
      const restoredEntry = restored.roleTenantFilter
        .split(';')
        .find((s) => s.startsWith(`${FIXTURE_ROLE_ENUM}:`));
      const beforeEntry = originalFilter
        .split(';')
        .find((s) => s.startsWith(`${FIXTURE_ROLE_ENUM}:`));
      expect(restoredEntry).toBe(beforeEntry);
    });
  });
});
