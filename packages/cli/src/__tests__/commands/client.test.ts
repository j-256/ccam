import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Command } from 'commander';
import { registerClientCommands } from '../../commands/client.js';

// Mock dependencies
vi.mock('../../client-factory.js');
vi.mock('../../auth/profile-resolver.js');
vi.mock('../../error-handler.js');
vi.mock('../../output/index.js');

const mockApiClients = {
  list: vi.fn(),
  get: vi.fn(),
  auditLogs: vi.fn(),
  assignedRealms: vi.fn(),
  assignedInstances: vi.fn(),
  grantRole: vi.fn(),
  revokeRole: vi.fn(),
};

const mockClient = {
  apiClients: mockApiClients,
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
  mockApiClients.list.mockResolvedValue({
    content: [{ id: 'client-123', name: 'Test Client' }],
    page: { number: 0, size: 25, totalElements: 1, totalPages: 1 },
  });

  mockApiClients.get.mockResolvedValue({
    id: 'client-123',
    name: 'Test Client',
  });

  mockApiClients.auditLogs.mockResolvedValue({
    content: [{ action: 'CREATE', timestamp: '2024-01-01T00:00:00Z' }],
    page: { number: 0, size: 25, totalElements: 1, totalPages: 1 },
  });

  mockApiClients.assignedRealms.mockResolvedValue({
    content: [{ id: 'aabc', name: 'Test Realm' }],
  });

  mockApiClients.assignedInstances.mockResolvedValue({
    content: [{ id: 'aabc_prd', realm: 'aabc' }],
  });
});

describe('client commands', () => {
  describe('client list', () => {
    it('calls SDK list with default page and size', async () => {
      const program = new Command();
      registerClientCommands(program);

      await program.parseAsync(['node', 'test', 'client', 'list']);

      expect(mockApiClients.list).toHaveBeenCalledWith({
        page: 0,
        size: 25,
        sort: undefined,
      });
    });

    it('passes sort parameter', async () => {
      const program = new Command();
      registerClientCommands(program);

      await program.parseAsync(['node', 'test', 'client', 'list', '--sort', 'name:desc']);

      expect(mockApiClients.list).toHaveBeenCalledWith({
        page: 0,
        size: 25,
        sort: { field: 'name', direction: 'desc' },
      });
    });

    it('passes custom page and size', async () => {
      const program = new Command();
      registerClientCommands(program);

      await program.parseAsync(['node', 'test', 'client', 'list', '--page', '5', '--size', '100']);

      expect(mockApiClients.list).toHaveBeenCalledWith({
        page: 5,
        size: 100,
        sort: undefined,
      });
    });
  });

  describe('client get', () => {
    it('calls SDK get without expand', async () => {
      const program = new Command();
      registerClientCommands(program);

      await program.parseAsync(['node', 'test', 'client', 'get', 'client-123']);

      expect(mockApiClients.get).toHaveBeenCalledWith('client-123');
    });

    it('calls SDK get with expand parameter', async () => {
      const program = new Command();
      registerClientCommands(program);

      await program.parseAsync(['node', 'test', 'client', 'get', 'client-123', '--expand', 'organizations,roles']);

      expect(mockApiClients.get).toHaveBeenCalledWith('client-123', { expand: 'organizations,roles' });
    });

    it('rejects invalid --expand value with a clear error', async () => {
      const errorHandler = await import('../../error-handler.js');
      const handleErrorMock = vi
        .mocked(errorHandler.handleError)
        .mockImplementation(() => {
          throw new Error('exit');
        });

      const program = new Command();
      registerClientCommands(program);

      await expect(
        program.parseAsync(['node', 'test', 'client', 'get', 'client-123', '--expand', 'bogus']),
      ).rejects.toThrow();

      expect(handleErrorMock).toHaveBeenCalledWith(
        expect.objectContaining({ message: expect.stringMatching(/Invalid --expand/) }),
      );
      expect(mockApiClients.get).not.toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ expand: 'bogus' }),
      );
    });
  });

  describe('client audit', () => {
    it('calls SDK auditLogs with client ID', async () => {
      const program = new Command();
      registerClientCommands(program);

      await program.parseAsync(['node', 'test', 'client', 'audit', 'client-123']);

      expect(mockApiClients.auditLogs).toHaveBeenCalledWith('client-123', undefined);
    });

    it('passes --query-size to auditLogs', async () => {
      const program = new Command();
      registerClientCommands(program);

      await program.parseAsync(['node', 'test', 'client', 'audit', 'client-123', '--query-size', '200']);

      expect(mockApiClients.auditLogs).toHaveBeenCalledWith('client-123', { querySize: 200 });
    });
  });

  describe('client assigned-realms', () => {
    it('calls SDK assignedRealms with client ID', async () => {
      const program = new Command();
      registerClientCommands(program);

      await program.parseAsync(['node', 'test', 'client', 'assigned-realms', 'client-123']);

      expect(mockApiClients.assignedRealms).toHaveBeenCalledWith('client-123');
    });
  });

  describe('client assigned-instances', () => {
    it('calls SDK assignedInstances with client ID', async () => {
      const program = new Command();
      registerClientCommands(program);

      await program.parseAsync(['node', 'test', 'client', 'assigned-instances', 'client-123']);

      expect(mockApiClients.assignedInstances).toHaveBeenCalledWith('client-123');
    });
  });
});

describe('client grant-role command', () => {
  let program: Command;
  let stderr: string;
  let stderrSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    stderr = '';
    stderrSpy = vi.spyOn(process.stderr, 'write').mockImplementation((chunk: unknown) => {
      stderr += typeof chunk === 'string' ? chunk : String(chunk);
      return true;
    });
    program = new Command();
    program.exitOverride();
    registerClientCommands(program);
  });

  afterEach(() => {
    stderrSpy.mockRestore();
  });

  it('calls grantRole with id + role', async () => {
    mockApiClients.grantRole.mockResolvedValueOnce({
      apiClient: { id: 'client-1', roles: ['account-admin'] },
      changed: true,
      roleScope: 'GLOBAL',
    });

    await program.parseAsync(['node', 'ccam', 'client', 'grant-role', 'client-1', 'account-admin']);

    expect(mockApiClients.grantRole).toHaveBeenCalledWith('client-1', 'account-admin', undefined);
    expect(stderr).toMatch(/Granted role account-admin to API client client-1/);
  });

  it('splits --tenants and passes as opts', async () => {
    mockApiClients.grantRole.mockResolvedValueOnce({
      apiClient: { id: 'client-1' },
      changed: true,
      roleScope: 'INSTANCE',
    });

    await program.parseAsync([
      'node', 'ccam', 'client', 'grant-role',
      'client-1', 'ccdx-sbx-user',
      '--tenants', 'tbdx_stg',
    ]);

    expect(mockApiClients.grantRole).toHaveBeenCalledWith(
      'client-1',
      'ccdx-sbx-user',
      { tenants: ['tbdx_stg'] },
    );
  });

  it('prints no-op stderr notice when changed=false', async () => {
    mockApiClients.grantRole.mockResolvedValueOnce({
      apiClient: { id: 'client-1', roles: ['account-admin'] },
      changed: false,
      roleScope: 'GLOBAL',
    });

    await program.parseAsync(['node', 'ccam', 'client', 'grant-role', 'client-1', 'account-admin']);

    expect(stderr).toMatch(/API client client-1 already has role account-admin.*no changes/);
  });

  it('warns when a non-GLOBAL role is granted without --tenants', async () => {
    mockApiClients.grantRole.mockResolvedValueOnce({
      apiClient: { id: 'client-1', roles: ['ccdx-sbx-user'] },
      changed: true,
      roleScope: 'INSTANCE',
    });

    await program.parseAsync(['node', 'ccam', 'client', 'grant-role', 'client-1', 'ccdx-sbx-user']);

    expect(stderr).toMatch(/scope INSTANCE.*inert until tenants are set/);
  });

  it('warns when --tenants is an empty string for non-GLOBAL role', async () => {
    mockApiClients.grantRole.mockResolvedValueOnce({
      apiClient: { id: 'client-1', roles: ['ccdx-sbx-user'] },
      changed: true,
      roleScope: 'INSTANCE',
    });

    await program.parseAsync([
      'node', 'ccam', 'client', 'grant-role',
      'client-1', 'ccdx-sbx-user',
      '--tenants', '',
    ]);

    expect(stderr).toMatch(/scope INSTANCE.*inert until tenants are set/);
  });
});

describe('client revoke-role command', () => {
  let program: Command;
  let stderr: string;
  let stderrSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    stderr = '';
    stderrSpy = vi.spyOn(process.stderr, 'write').mockImplementation((chunk: unknown) => {
      stderr += typeof chunk === 'string' ? chunk : String(chunk);
      return true;
    });
    program = new Command();
    program.exitOverride();
    registerClientCommands(program);
  });

  afterEach(() => {
    stderrSpy.mockRestore();
  });

  it('calls revokeRole and prints success', async () => {
    mockApiClients.revokeRole.mockResolvedValueOnce({
      apiClient: { id: 'client-1' },
      changed: true,
    });

    await program.parseAsync(['node', 'ccam', 'client', 'revoke-role', 'client-1', 'account-admin']);

    expect(mockApiClients.revokeRole).toHaveBeenCalledWith('client-1', 'account-admin');
    expect(stderr).toMatch(/Revoked role account-admin from API client client-1/);
  });

  it('prints no-op stderr notice when changed=false', async () => {
    mockApiClients.revokeRole.mockResolvedValueOnce({
      apiClient: { id: 'client-1' },
      changed: false,
    });

    await program.parseAsync(['node', 'ccam', 'client', 'revoke-role', 'client-1', 'account-admin']);

    expect(stderr).toMatch(/API client client-1 does not have role account-admin.*no changes/);
  });
});
