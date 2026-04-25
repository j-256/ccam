import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Command } from 'commander';
import { registerRealmCommands } from '../../commands/realm.js';

// Mock dependencies
vi.mock('../../client-factory.js');
vi.mock('../../auth/profile-resolver.js');
vi.mock('../../error-handler.js');
vi.mock('../../output/index.js');

const mockRealms = {
  list: vi.fn(),
  get: vi.fn(),
};

const mockClient = {
  realms: mockRealms,
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
  mockRealms.list.mockResolvedValue({
    content: [{ id: 'aabc', name: 'Test Realm' }],
    page: { number: 0, size: 25, totalElements: 1, totalPages: 1 },
  });

  mockRealms.get.mockResolvedValue({
    id: 'aabc',
    name: 'Test Realm',
  });
});

describe('realm commands', () => {
  describe('realm list', () => {
    it('calls SDK list with default page and size', async () => {
      const program = new Command();
      registerRealmCommands(program);

      await program.parseAsync(['node', 'test', 'realm', 'list']);

      expect(mockRealms.list).toHaveBeenCalledWith({
        page: 0,
        size: 25,
        sort: undefined,
      });
    });

    it('passes custom page and size', async () => {
      const program = new Command();
      registerRealmCommands(program);

      await program.parseAsync(['node', 'test', 'realm', 'list', '--page', '2', '--size', '50']);

      expect(mockRealms.list).toHaveBeenCalledWith({
        page: 2,
        size: 50,
        sort: undefined,
      });
    });

    it('passes sort parameter', async () => {
      const program = new Command();
      registerRealmCommands(program);

      await program.parseAsync(['node', 'test', 'realm', 'list', '--sort', 'name:asc']);

      expect(mockRealms.list).toHaveBeenCalledWith({
        page: 0,
        size: 25,
        sort: { field: 'name', direction: 'asc' },
      });
    });

    it('passes host override', async () => {
      const program = new Command();
      registerRealmCommands(program);
      const profileResolver = await import('../../auth/profile-resolver.js');

      await program.parseAsync(['node', 'test', 'realm', 'list', '--host', 'https://custom.example.com']);

      expect(profileResolver.resolveProfile).toHaveBeenCalledWith({
        flags: expect.objectContaining({
          host: 'https://custom.example.com',
        }),
      });
    });
  });

  describe('realm get', () => {
    it('calls SDK get with realm ID', async () => {
      const program = new Command();
      registerRealmCommands(program);

      await program.parseAsync(['node', 'test', 'realm', 'get', 'aabc']);

      expect(mockRealms.get).toHaveBeenCalledWith('aabc');
    });
  });
});
