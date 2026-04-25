import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Command } from 'commander';
import { registerServiceTypeCommands } from '../../commands/service-type.js';

// Mock dependencies
vi.mock('../../client-factory.js');
vi.mock('../../auth/profile-resolver.js');
vi.mock('../../error-handler.js');
vi.mock('../../output/index.js');

const mockServiceTypes = {
  list: vi.fn(),
  get: vi.fn(),
};

const mockClient = {
  serviceTypes: mockServiceTypes,
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
  mockServiceTypes.list.mockResolvedValue({
    content: [{ id: 'ECOM', name: 'E-Commerce' }],
    page: { number: 0, size: 25, totalElements: 1, totalPages: 1 },
  });

  mockServiceTypes.get.mockResolvedValue({
    id: 'ECOM',
    name: 'E-Commerce',
  });
});

describe('service-type commands', () => {
  describe('service-type list', () => {
    it('calls SDK list with default page and size', async () => {
      const program = new Command();
      registerServiceTypeCommands(program);

      await program.parseAsync(['node', 'test', 'service-type', 'list']);

      expect(mockServiceTypes.list).toHaveBeenCalledWith({
        page: 0,
        size: 25,
      });
    });

    it('passes custom page and size', async () => {
      const program = new Command();
      registerServiceTypeCommands(program);

      await program.parseAsync(['node', 'test', 'service-type', 'list', '--page', '1', '--size', '10']);

      expect(mockServiceTypes.list).toHaveBeenCalledWith({
        page: 1,
        size: 10,
      });
    });

    it('does not pass sort parameter (not supported by SDK)', async () => {
      const program = new Command();
      registerServiceTypeCommands(program);

      await program.parseAsync(['node', 'test', 'service-type', 'list']);

      const callArgs = mockServiceTypes.list.mock.calls[0][0];
      expect(callArgs).not.toHaveProperty('sort');
    });
  });

  describe('service-type get', () => {
    it('calls SDK get with service type ID', async () => {
      const program = new Command();
      registerServiceTypeCommands(program);

      await program.parseAsync(['node', 'test', 'service-type', 'get', 'ECOM']);

      expect(mockServiceTypes.get).toHaveBeenCalledWith('ECOM');
    });
  });
});
