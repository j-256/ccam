import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Command } from 'commander';
import { CcamNotFoundError } from 'ccam-sdk';
import { selectOrgFinder, registerOrgCommands } from '../../commands/org.js';

// Mock dependencies
vi.mock('../../client-factory.js');
vi.mock('../../auth/profile-resolver.js');
vi.mock('../../error-handler.js');
vi.mock('../../output/index.js');

const mockOrganizations = {
  list: vi.fn(),
  get: vi.fn(),
  realms: vi.fn(),
  instances: vi.fn(),
  auditLogs: vi.fn(),
  search: {
    findByName: vi.fn(),
    findBySfAccountId: vi.fn(),
  },
};

const mockClient = {
  organizations: mockOrganizations,
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
  const mockOrg = { id: 'org-123', name: 'Acme Corp' };
  const mockPagedResult = {
    content: [mockOrg],
    page: { number: 0, size: 25, totalElements: 1, totalPages: 1 },
  };

  mockOrganizations.list.mockResolvedValue(mockPagedResult);
  mockOrganizations.get.mockResolvedValue(mockOrg);
  mockOrganizations.realms.mockResolvedValue({ content: [{ id: 'aabc', name: 'Test Realm' }] });
  mockOrganizations.instances.mockResolvedValue({ content: [{ id: 'aabc_prd' }] });
  mockOrganizations.auditLogs.mockResolvedValue(mockPagedResult);

  mockOrganizations.search.findByName.mockResolvedValue(mockPagedResult);
  mockOrganizations.search.findBySfAccountId.mockResolvedValue(mockPagedResult);
});

describe('selectOrgFinder', () => {
  it('returns "list" when no filters are provided', () => {
    expect(selectOrgFinder({})).toBe('list');
  });

  it('returns "findByName" when name filter is provided', () => {
    expect(selectOrgFinder({ name: 'Acme Corp' })).toBe('findByName');
  });

  it('returns "findByName" when startsWith filter is provided', () => {
    expect(selectOrgFinder({ startsWith: 'Acme' })).toBe('findByName');
  });

  it('returns "findBySfAccountId" when sfAccountId filter is provided', () => {
    expect(selectOrgFinder({ sfAccountId: '001234567890ABC' })).toBe('findBySfAccountId');
  });

  it('prioritizes sfAccountId over name filters', () => {
    expect(selectOrgFinder({ sfAccountId: '001234567890ABC', name: 'Acme' }))
      .toBe('findBySfAccountId');
  });

  it('handles both name and startsWith together', () => {
    expect(selectOrgFinder({ name: 'Acme', startsWith: 'Ac' })).toBe('findByName');
  });
});

describe('org commands', () => {
  describe('org list', () => {
    it('calls SDK list with no filters', async () => {
      const program = new Command();
      registerOrgCommands(program);

      await program.parseAsync(['node', 'test', 'org', 'list']);

      expect(mockOrganizations.list).toHaveBeenCalledWith({
        page: 0,
        size: 25,
        sort: undefined,
      });
    });

    it('calls findByName when --name is provided', async () => {
      const program = new Command();
      registerOrgCommands(program);

      await program.parseAsync(['node', 'test', 'org', 'list', '--name', 'Acme Corp']);

      expect(mockOrganizations.search.findByName).toHaveBeenCalledWith({
        term: 'Acme Corp',
        startsWith: undefined,
        ignoreCase: undefined,
        page: 0,
        size: 25,
      });
    });

    it('passes --ignore-case to findByName', async () => {
      const program = new Command();
      registerOrgCommands(program);

      await program.parseAsync(['node', 'test', 'org', 'list', '--name', 'acme', '--ignore-case']);

      expect(mockOrganizations.search.findByName).toHaveBeenCalledWith({
        term: 'acme',
        startsWith: undefined,
        ignoreCase: true,
        page: 0,
        size: 25,
      });
    });

    it('calls findByName when --starts-with is provided', async () => {
      const program = new Command();
      registerOrgCommands(program);

      await program.parseAsync(['node', 'test', 'org', 'list', '--starts-with', 'Acme']);

      expect(mockOrganizations.search.findByName).toHaveBeenCalledWith({
        term: undefined,
        startsWith: 'Acme',
        ignoreCase: undefined,
        page: 0,
        size: 25,
      });
    });

    it('calls findBySfAccountId when --sf-account-id is provided', async () => {
      const program = new Command();
      registerOrgCommands(program);

      await program.parseAsync(['node', 'test', 'org', 'list', '--sf-account-id', '001234567890ABC']);

      expect(mockOrganizations.search.findBySfAccountId).toHaveBeenCalledWith({
        sfAccountId: '001234567890ABC',
        page: 0,
        size: 25,
      });
    });

    it('passes custom page and size', async () => {
      const program = new Command();
      registerOrgCommands(program);

      await program.parseAsync(['node', 'test', 'org', 'list', '--page', '1', '--size', '50']);

      expect(mockOrganizations.list).toHaveBeenCalledWith({
        page: 1,
        size: 50,
        sort: undefined,
      });
    });

    it('passes sort parameter', async () => {
      const program = new Command();
      registerOrgCommands(program);

      await program.parseAsync(['node', 'test', 'org', 'list', '--sort', 'name:asc']);

      expect(mockOrganizations.list).toHaveBeenCalledWith({
        page: 0,
        size: 25,
        sort: { field: 'name', direction: 'asc' },
      });
    });
  });

  describe('org get', () => {
    it('calls SDK get with UUID', async () => {
      const program = new Command();
      registerOrgCommands(program);

      await program.parseAsync(['node', 'test', 'org', 'get', 'org-123']);

      expect(mockOrganizations.get).toHaveBeenCalledWith('org-123');
    });

    it('falls back to name search when get fails with NotFoundError', async () => {
      mockOrganizations.get.mockRejectedValueOnce(
        new CcamNotFoundError('Not found', {
          status: 404,
          resource: 'organizations',
          operation: 'get',
        })
      );
      mockOrganizations.search.findByName.mockResolvedValueOnce({
        content: [{ id: 'org-456', name: 'Acme Corp' }],
        page: { number: 0, size: 1, totalElements: 1, totalPages: 1 },
      });
      mockOrganizations.get.mockResolvedValueOnce({ id: 'org-456', name: 'Acme Corp' });

      const program = new Command();
      registerOrgCommands(program);

      await program.parseAsync(['node', 'test', 'org', 'get', 'Acme Corp']);

      expect(mockOrganizations.get).toHaveBeenCalledTimes(2);
      expect(mockOrganizations.search.findByName).toHaveBeenCalledWith({
        term: 'Acme Corp',
        page: 0,
        size: 1,
      });
    });
  });

  describe('org realms', () => {
    it('resolves org ID and calls realms without expand', async () => {
      const program = new Command();
      registerOrgCommands(program);

      await program.parseAsync(['node', 'test', 'org', 'realms', 'org-123']);

      expect(mockOrganizations.get).toHaveBeenCalledWith('org-123');
      expect(mockOrganizations.realms).toHaveBeenCalledWith('org-123');
    });

    it('passes expand parameter', async () => {
      const program = new Command();
      registerOrgCommands(program);

      await program.parseAsync(['node', 'test', 'org', 'realms', 'org-123', '--expand', 'instance']);

      expect(mockOrganizations.realms).toHaveBeenCalledWith('org-123', { expand: 'instance' });
    });

    it('rejects invalid --expand value with a clear error', async () => {
      const errorHandler = await import('../../error-handler.js');
      const handleErrorMock = vi
        .mocked(errorHandler.handleError)
        .mockImplementation(() => {
          throw new Error('exit');
        });

      const program = new Command();
      registerOrgCommands(program);

      await expect(
        program.parseAsync(['node', 'test', 'org', 'realms', 'org-123', '--expand', 'bogus']),
      ).rejects.toThrow();

      expect(handleErrorMock).toHaveBeenCalledWith(
        expect.objectContaining({ message: expect.stringMatching(/Invalid --expand/) }),
      );
      expect(mockOrganizations.realms).not.toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ expand: 'bogus' }),
      );
    });
  });

  describe('org instances', () => {
    it('resolves org ID and calls instances', async () => {
      const program = new Command();
      registerOrgCommands(program);

      await program.parseAsync(['node', 'test', 'org', 'instances', 'org-123']);

      expect(mockOrganizations.get).toHaveBeenCalledWith('org-123');
      expect(mockOrganizations.instances).toHaveBeenCalledWith('org-123');
    });
  });

  describe('org audit', () => {
    it('resolves org ID and calls auditLogs', async () => {
      const program = new Command();
      registerOrgCommands(program);

      await program.parseAsync(['node', 'test', 'org', 'audit', 'org-123']);

      expect(mockOrganizations.get).toHaveBeenCalledWith('org-123');
      expect(mockOrganizations.auditLogs).toHaveBeenCalledWith('org-123', undefined);
    });

    it('passes --query-size to auditLogs', async () => {
      const program = new Command();
      registerOrgCommands(program);

      await program.parseAsync(['node', 'test', 'org', 'audit', 'org-123', '--query-size', '100']);

      expect(mockOrganizations.auditLogs).toHaveBeenCalledWith('org-123', { querySize: 100 });
    });
  });
});

