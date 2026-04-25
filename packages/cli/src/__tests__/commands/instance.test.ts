import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Command } from 'commander';
import { registerInstanceCommands, selectInstanceFinder } from '../../commands/instance.js';

// Mock dependencies
vi.mock('../../client-factory.js');
vi.mock('../../auth/profile-resolver.js');
vi.mock('../../error-handler.js');
vi.mock('../../output/index.js');

const mockInstances = {
  list: vi.fn(),
  get: vi.fn(),
  search: {
    findByOrganization: vi.fn(),
    findByRealm: vi.fn(),
    findById: vi.fn(),
  },
};

const mockClient = {
  instances: mockInstances,
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
  const mockPagedResult = {
    content: [{ id: 'aabc_prd', realm: 'aabc', type: 'prd' }],
    page: { number: 0, size: 25, totalElements: 1, totalPages: 1 },
  };

  mockInstances.list.mockResolvedValue(mockPagedResult);
  mockInstances.search.findByOrganization.mockResolvedValue(mockPagedResult);
  mockInstances.search.findByRealm.mockResolvedValue(mockPagedResult);
  mockInstances.search.findById.mockResolvedValue(mockPagedResult);

  mockInstances.get.mockResolvedValue({
    id: 'aabc_prd',
    realm: 'aabc',
    type: 'prd',
  });
});

describe('selectInstanceFinder', () => {
  it('returns "list" when no filters are provided', () => {
    expect(selectInstanceFinder({})).toBe('list');
  });

  it('returns "findByOrganization" when org filter is provided', () => {
    expect(selectInstanceFinder({ org: 'org-123' })).toBe('findByOrganization');
  });

  it('returns "findByRealm" when realm filter is provided', () => {
    expect(selectInstanceFinder({ realm: 'aabc' })).toBe('findByRealm');
  });

  it('returns "findById" when ids filter is provided', () => {
    expect(selectInstanceFinder({ ids: 'aabc_prd,aabc_dev' })).toBe('findById');
  });

  it('prioritizes org over realm', () => {
    expect(selectInstanceFinder({ org: 'org-123', realm: 'aabc' })).toBe('findByOrganization');
  });
});

describe('instance commands', () => {
  describe('instance list', () => {
    it('calls SDK list with no filters', async () => {
      const program = new Command();
      registerInstanceCommands(program);

      await program.parseAsync(['node', 'test', 'instance', 'list']);

      expect(mockInstances.list).toHaveBeenCalledWith({
        page: 0,
        size: 25,
        sort: undefined,
      });
    });

    it('calls findByOrganization when --org is provided', async () => {
      const program = new Command();
      registerInstanceCommands(program);

      await program.parseAsync(['node', 'test', 'instance', 'list', '--org', 'org-123']);

      expect(mockInstances.search.findByOrganization).toHaveBeenCalledWith({
        organization: 'org-123',
        page: 0,
        size: 25,
      });
    });

    it('calls findByRealm when --realm is provided', async () => {
      const program = new Command();
      registerInstanceCommands(program);

      await program.parseAsync(['node', 'test', 'instance', 'list', '--realm', 'aabc,zzyx']);

      expect(mockInstances.search.findByRealm).toHaveBeenCalledWith({
        realm: 'aabc,zzyx',
        page: 0,
        size: 25,
      });
    });

    it('calls findById when --ids is provided', async () => {
      const program = new Command();
      registerInstanceCommands(program);

      await program.parseAsync(['node', 'test', 'instance', 'list', '--ids', 'aabc_prd,aabc_dev']);

      expect(mockInstances.search.findById).toHaveBeenCalledWith({
        id: 'aabc_prd,aabc_dev',
        page: 0,
        size: 25,
      });
    });

    it('passes sort parameter to list', async () => {
      const program = new Command();
      registerInstanceCommands(program);

      await program.parseAsync(['node', 'test', 'instance', 'list', '--sort', 'id:desc']);

      expect(mockInstances.list).toHaveBeenCalledWith({
        page: 0,
        size: 25,
        sort: { field: 'id', direction: 'desc' },
      });
    });
  });

  describe('instance get', () => {
    it('calls SDK get with instance ID', async () => {
      const program = new Command();
      registerInstanceCommands(program);

      await program.parseAsync(['node', 'test', 'instance', 'get', 'aabc_prd']);

      expect(mockInstances.get).toHaveBeenCalledWith('aabc_prd');
    });
  });
});
