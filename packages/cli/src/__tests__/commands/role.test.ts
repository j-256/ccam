import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Command } from 'commander';
import { registerRoleCommands } from '../../commands/role.js';

// Mock dependencies
vi.mock('../../client-factory.js');
vi.mock('../../auth/profile-resolver.js');
vi.mock('../../error-handler.js');
vi.mock('../../output/index.js');

const mockRoles = {
  list: vi.fn(),
  get: vi.fn(),
};

const mockClient = {
  roles: mockRoles,
};

beforeEach(async () => {
  vi.clearAllMocks();

  // Mock createClientFromResolved to return our mock client
  const clientFactory = await import('../../client-factory.js');
  vi.mocked(clientFactory.createClientFromResolved).mockResolvedValue(mockClient as never);

  // Mock resolveProfile to return a valid resolved profile
  const profileResolver = await import('../../auth/profile-resolver.js');
  vi.mocked(profileResolver.resolveProfile).mockResolvedValue({
    host: 'https://am.example',
    clientId: 'cid',
    clientSecret: 'sec',
    source: 'env',
  });

  // Mock renderOutput to just resolve
  const output = await import('../../output/index.js');
  vi.mocked(output.renderOutput).mockResolvedValue(undefined);
  vi.mocked(output.resolveFormat).mockReturnValue('json');

  // Setup default mock responses
  mockRoles.list.mockResolvedValue({
    content: [{ id: 'role-123', name: 'Admin' }],
    page: { number: 0, size: 25, totalElements: 1, totalPages: 1 },
  });

  mockRoles.get.mockResolvedValue({
    id: 'role-123',
    name: 'Admin',
  });
});

describe('role commands', () => {
  describe('role list', () => {
    it('calls SDK list with default page and size', async () => {
      const program = new Command();
      registerRoleCommands(program);

      await program.parseAsync(['node', 'test', 'role', 'list']);

      expect(mockRoles.list).toHaveBeenCalledWith({
        page: 0,
        size: 25,
        sort: undefined,
      });
    });

    it('passes sort parameter', async () => {
      const program = new Command();
      registerRoleCommands(program);

      await program.parseAsync(['node', 'test', 'role', 'list', '--sort', 'name:asc']);

      expect(mockRoles.list).toHaveBeenCalledWith({
        page: 0,
        size: 25,
        sort: { field: 'name', direction: 'asc' },
      });
    });

    it('passes expand parameter when serviceType is specified', async () => {
      const program = new Command();
      registerRoleCommands(program);

      await program.parseAsync(['node', 'test', 'role', 'list', '--expand', 'serviceType']);

      expect(mockRoles.list).toHaveBeenCalledWith({
        page: 0,
        size: 25,
        sort: undefined,
        expand: 'serviceType',
      });
    });

    it('passes target-type parameter when specified', async () => {
      const program = new Command();
      registerRoleCommands(program);

      await program.parseAsync(['node', 'test', 'role', 'list', '--expand', 'serviceType', '--target-type', 'User']);

      expect(mockRoles.list).toHaveBeenCalledWith({
        page: 0,
        size: 25,
        sort: undefined,
        expand: 'serviceType',
        roleTargetType: 'User',
      });
    });

    it('does not pass expand when not serviceType', async () => {
      const program = new Command();
      registerRoleCommands(program);

      await program.parseAsync(['node', 'test', 'role', 'list', '--expand', 'other']);

      expect(mockRoles.list).toHaveBeenCalledWith({
        page: 0,
        size: 25,
        sort: undefined,
      });
    });
  });

  describe('role get', () => {
    it('calls SDK get without expand', async () => {
      const program = new Command();
      registerRoleCommands(program);

      await program.parseAsync(['node', 'test', 'role', 'get', 'role-123']);

      expect(mockRoles.get).toHaveBeenCalledWith('role-123');
    });

    it('calls SDK get with expand parameter when serviceType is specified', async () => {
      const program = new Command();
      registerRoleCommands(program);

      await program.parseAsync(['node', 'test', 'role', 'get', 'role-123', '--expand', 'serviceType']);

      expect(mockRoles.get).toHaveBeenCalledWith('role-123', { expand: 'serviceType' });
    });
  });

});
