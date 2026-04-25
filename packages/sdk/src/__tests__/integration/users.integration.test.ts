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
import { CcamNotFoundError, UserSortField, type CcamClient } from '../../index.js';

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
    const mail = `ccam-test-${Date.now()}@ccam-test.example.com`;
    let createdId: string | null = null;

    afterAll(async () => {
      if (createdId) {
        await safeDelete(() => client.users.delete(createdId!));
      }
    });

    it('creates, reads, updates, resets, disables, deletes', async () => {
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

      await client.users.reset(created.id);
      await client.users.disable(created.id);

      await client.users.delete(created.id);
      createdId = null;
    });

    it('revokeVerifier on a user with no verifiers responds with 404', async () => {
      await expect(
        client.users.revokeVerifier(ENV!.userId, 'nonexistent-verifier-id'),
      ).rejects.toBeInstanceOf(CcamNotFoundError);
    });
  });
});
