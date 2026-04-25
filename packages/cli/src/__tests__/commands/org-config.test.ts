import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Command } from 'commander';
import { registerOrgConfigCommands } from '../../commands/org-config.js';

// Mock dependencies
vi.mock('../../client-factory.js');
vi.mock('../../auth/profile-resolver.js');
vi.mock('../../error-handler.js');
vi.mock('../../output/index.js');

const mockOrgConfig = {
  get: vi.fn(),
};

const mockClient = {
  organizationConfiguration: mockOrgConfig,
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

  // Setup default mock response
  mockOrgConfig.get.mockResolvedValue({
    allowedDomains: ['example.com'],
    maxUsers: 100,
  });
});

describe('org-config commands', () => {
  describe('org-config get', () => {
    it('calls SDK get', async () => {
      const program = new Command();
      registerOrgConfigCommands(program);

      await program.parseAsync(['node', 'test', 'org-config', 'get']);

      expect(mockOrgConfig.get).toHaveBeenCalledWith();
    });

    it('passes host override', async () => {
      const program = new Command();
      registerOrgConfigCommands(program);
      const profileResolver = await import('../../auth/profile-resolver.js');

      await program.parseAsync(['node', 'test', 'org-config', 'get', '--host', 'https://custom.example.com']);

      expect(profileResolver.resolveProfile).toHaveBeenCalledWith({
        flags: expect.objectContaining({
          host: 'https://custom.example.com',
        }),
      });
    });
  });
});
