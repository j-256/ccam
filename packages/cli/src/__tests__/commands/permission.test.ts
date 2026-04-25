import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Command } from 'commander';
import { registerPermissionCommands } from '../../commands/permission.js';

// Mock dependencies
vi.mock('../../client-factory.js');
vi.mock('../../auth/profile-resolver.js');
vi.mock('../../error-handler.js');
vi.mock('../../output/index.js');

const mockPermissions = {
  list: vi.fn(),
  get: vi.fn(),
};

const mockClient = {
  permissions: mockPermissions,
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
  mockPermissions.list.mockResolvedValue({
    content: [{ name: 'READ_USER', description: 'Read user data' }],
    page: { number: 0, size: 25, totalElements: 1, totalPages: 1 },
  });

  mockPermissions.get.mockResolvedValue({
    name: 'READ_USER',
    description: 'Read user data',
  });
});

describe('permission commands', () => {
  describe('permission list', () => {
    it('calls SDK list with default page and size', async () => {
      const program = new Command();
      registerPermissionCommands(program);

      await program.parseAsync(['node', 'test', 'permission', 'list']);

      expect(mockPermissions.list).toHaveBeenCalledWith({
        page: 0,
        size: 25,
      });
    });

    it('passes custom page and size', async () => {
      const program = new Command();
      registerPermissionCommands(program);

      await program.parseAsync(['node', 'test', 'permission', 'list', '--page', '3', '--size', '100']);

      expect(mockPermissions.list).toHaveBeenCalledWith({
        page: 3,
        size: 100,
      });
    });

    it('passes adminPermission filter when --admin flag is set', async () => {
      const program = new Command();
      registerPermissionCommands(program);

      await program.parseAsync(['node', 'test', 'permission', 'list', '--admin']);

      expect(mockPermissions.list).toHaveBeenCalledWith({
        page: 0,
        size: 25,
        adminPermission: true,
      });
    });

    it('does not pass sort parameter (not supported by SDK)', async () => {
      const program = new Command();
      registerPermissionCommands(program);

      await program.parseAsync(['node', 'test', 'permission', 'list']);

      const callArgs = mockPermissions.list.mock.calls[0][0];
      expect(callArgs).not.toHaveProperty('sort');
    });
  });

  describe('permission get', () => {
    it('calls SDK get with permission name', async () => {
      const program = new Command();
      registerPermissionCommands(program);

      await program.parseAsync(['node', 'test', 'permission', 'get', 'READ_USER']);

      expect(mockPermissions.get).toHaveBeenCalledWith('READ_USER');
    });
  });
});
