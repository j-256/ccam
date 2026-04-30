import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Command } from 'commander';
import { selectUserFinder, registerUserCommands } from '../../commands/user.js';

// Mock dependencies
vi.mock('../../client-factory.js');
vi.mock('../../auth/profile-resolver.js');
vi.mock('../../error-handler.js');
vi.mock('../../output/index.js');

const mockUsers = {
  list: vi.fn(),
  get: vi.fn(),
  getByLogin: vi.fn(),
  current: vi.fn(),
  auditLogs: vi.fn(),
  roles: vi.fn(),
  instances: vi.fn(),
  assignedRealms: vi.fn(),
  assignedInstances: vi.fn(),
  grantRole: vi.fn(),
  revokeRole: vi.fn(),
  search: {
    findByOrg: vi.fn(),
    findAllByOrg: vi.fn(),
    findByRole: vi.fn(),
    findByOrgAndRole: vi.fn(),
    findByOrgRealmAccess: vi.fn(),
  },
};

const mockClient = {
  users: mockUsers,
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
  const mockUser = { id: 'user-123', login: 'user@example.com', email: 'user@example.com' };
  const mockPagedResult = {
    content: [mockUser],
    page: { number: 0, size: 25, totalElements: 1, totalPages: 1 },
  };

  mockUsers.list.mockResolvedValue(mockPagedResult);
  mockUsers.get.mockResolvedValue(mockUser);
  mockUsers.getByLogin.mockResolvedValue(mockUser);
  mockUsers.current.mockResolvedValue(mockUser);
  mockUsers.auditLogs.mockResolvedValue(mockPagedResult);
  mockUsers.roles.mockResolvedValue({ content: [{ id: 'role-123', name: 'Admin' }] });
  mockUsers.instances.mockResolvedValue({ content: [{ id: 'aabc_prd' }] });
  mockUsers.assignedRealms.mockResolvedValue({ content: [{ id: 'aabc' }] });
  mockUsers.assignedInstances.mockResolvedValue({ content: [{ id: 'aabc_prd' }] });

  mockUsers.search.findByOrg.mockResolvedValue(mockPagedResult);
  mockUsers.search.findAllByOrg.mockResolvedValue(mockPagedResult);
  mockUsers.search.findByRole.mockResolvedValue(mockPagedResult);
  mockUsers.search.findByOrgAndRole.mockResolvedValue(mockPagedResult);
  mockUsers.search.findByOrgRealmAccess.mockResolvedValue(mockPagedResult);
});

describe('selectUserFinder', () => {
  it('returns "list" when no filters are provided', () => {
    expect(selectUserFinder({})).toBe('list');
  });

  it('returns "findByLogin" when login filter is provided', () => {
    expect(selectUserFinder({ login: 'user@example.com' })).toBe('findByLogin');
  });

  it('returns "findByOrg" when org filter is provided', () => {
    expect(selectUserFinder({ org: 'org-123' })).toBe('findByOrg');
  });

  it('returns "findAllByOrg" when org and all filters are provided', () => {
    expect(selectUserFinder({ org: 'org-123', all: true })).toBe('findAllByOrg');
  });

  it('returns "findByRole" when role filter is provided', () => {
    expect(selectUserFinder({ role: 'ADMIN' })).toBe('findByRole');
  });

  it('returns "findByOrgAndRole" when both org and role filters are provided', () => {
    expect(selectUserFinder({ org: 'org-123', role: 'ADMIN' })).toBe('findByOrgAndRole');
  });

  it('returns "findByOrgRealmAccess" when orgRealmAccess filter is provided', () => {
    expect(selectUserFinder({ orgRealmAccess: 'org-123' })).toBe('findByOrgRealmAccess');
  });

  it('returns "findByRole" when role and modifiedAfter are provided', () => {
    expect(selectUserFinder({ role: 'ADMIN', modifiedAfter: '2024-01-01' })).toBe('findByRole');
  });

  it('prioritizes org+role combination over individual filters', () => {
    expect(selectUserFinder({ org: 'org-123', role: 'ADMIN', login: 'user@example.com' }))
      .toBe('findByOrgAndRole');
  });

  it('prioritizes orgRealmAccess over org filter alone', () => {
    expect(selectUserFinder({ orgRealmAccess: 'org-123', org: 'org-456' }))
      .toBe('findByOrgRealmAccess');
  });
});

describe('user commands', () => {
  describe('user list', () => {
    it('calls SDK list with no filters', async () => {
      const program = new Command();
      registerUserCommands(program);

      await program.parseAsync(['node', 'test', 'user', 'list']);

      expect(mockUsers.list).toHaveBeenCalledWith({
        page: 0,
        size: 25,
        sort: undefined,
      });
    });

    it('calls getByLogin when --login is provided', async () => {
      const program = new Command();
      registerUserCommands(program);

      await program.parseAsync(['node', 'test', 'user', 'list', '--login', 'user@example.com']);

      expect(mockUsers.getByLogin).toHaveBeenCalledWith('user@example.com');
    });

    it('calls findByOrg when --org is provided', async () => {
      const program = new Command();
      registerUserCommands(program);

      await program.parseAsync(['node', 'test', 'user', 'list', '--org', 'org-123']);

      expect(mockUsers.search.findByOrg).toHaveBeenCalledWith({
        organization: 'org-123',
        page: 0,
        size: 25,
      });
    });

    it('calls findAllByOrg when --org and --all are provided', async () => {
      const program = new Command();
      registerUserCommands(program);

      await program.parseAsync(['node', 'test', 'user', 'list', '--org', 'org-123', '--all']);

      expect(mockUsers.search.findAllByOrg).toHaveBeenCalledWith({
        organization: 'org-123',
        page: 0,
        size: 25,
      });
    });

    it('calls findByRole when --role is provided', async () => {
      const program = new Command();
      registerUserCommands(program);

      await program.parseAsync(['node', 'test', 'user', 'list', '--role', 'role-123']);

      expect(mockUsers.search.findByRole).toHaveBeenCalledWith({
        role: 'role-123',
        modifiedAfter: undefined,
        page: 0,
        size: 25,
      });
    });

    it('calls findByRole with modifiedAfter when both --role and --modified-after are provided', async () => {
      const program = new Command();
      registerUserCommands(program);

      await program.parseAsync(['node', 'test', 'user', 'list', '--role', 'role-123', '--modified-after', '2024-01-01']);

      expect(mockUsers.search.findByRole).toHaveBeenCalledWith({
        role: 'role-123',
        modifiedAfter: '2024-01-01',
        page: 0,
        size: 25,
      });
    });

    it('calls findByOrgAndRole when both --org and --role are provided', async () => {
      const program = new Command();
      registerUserCommands(program);

      await program.parseAsync(['node', 'test', 'user', 'list', '--org', 'org-123', '--role', 'role-123']);

      expect(mockUsers.search.findByOrgAndRole).toHaveBeenCalledWith({
        organization: 'org-123',
        role: 'role-123',
        page: 0,
        size: 25,
      });
    });

    it('calls findByOrgRealmAccess when --org-realm-access is provided', async () => {
      const program = new Command();
      registerUserCommands(program);

      await program.parseAsync(['node', 'test', 'user', 'list', '--org-realm-access', 'org-123']);

      expect(mockUsers.search.findByOrgRealmAccess).toHaveBeenCalledWith({
        organization: 'org-123',
        page: 0,
        size: 25,
      });
    });

    it('passes custom page and size', async () => {
      const program = new Command();
      registerUserCommands(program);

      await program.parseAsync(['node', 'test', 'user', 'list', '--page', '2', '--size', '50']);

      expect(mockUsers.list).toHaveBeenCalledWith({
        page: 2,
        size: 50,
        sort: undefined,
      });
    });

    it('passes sort parameter', async () => {
      const program = new Command();
      registerUserCommands(program);

      await program.parseAsync(['node', 'test', 'user', 'list', '--sort', 'email:desc']);

      expect(mockUsers.list).toHaveBeenCalledWith({
        page: 0,
        size: 25,
        sort: { field: 'email', direction: 'desc' },
      });
    });

    it('--all without --org writes error to stderr and exits', async () => {
      const stderrSpy = vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
      const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

      const program = new Command();
      registerUserCommands(program);

      await program.parseAsync(['node', 'test', 'user', 'list', '--all']);

      expect(stderrSpy).toHaveBeenCalledWith(expect.stringMatching(/--all requires --org/));
      expect(exitSpy).toHaveBeenCalledWith(1);
      expect(mockUsers.search.findAllByOrg).not.toHaveBeenCalled();

      stderrSpy.mockRestore();
      exitSpy.mockRestore();
    });
  });

  describe('user get', () => {
    it('calls getByLogin with login by default', async () => {
      const program = new Command();
      registerUserCommands(program);

      await program.parseAsync(['node', 'test', 'user', 'get', 'user@example.com']);

      expect(mockUsers.getByLogin).toHaveBeenCalledWith('user@example.com');
    });

    it('calls get with ID when --id flag is provided', async () => {
      const program = new Command();
      registerUserCommands(program);

      await program.parseAsync(['node', 'test', 'user', 'get', 'user-123', '--id']);

      expect(mockUsers.get).toHaveBeenCalledWith('user-123');
    });

    it('passes expand parameter to getByLogin', async () => {
      const program = new Command();
      registerUserCommands(program);

      await program.parseAsync(['node', 'test', 'user', 'get', 'user@example.com', '--expand', 'organizations']);

      expect(mockUsers.getByLogin).toHaveBeenCalledWith('user@example.com', { expand: 'organizations' });
    });

    it('rejects --expand values not supported by getByLogin (organizations,roles is only for --id)', async () => {
      const errorHandler = await import('../../error-handler.js');
      const handleErrorMock = vi
        .mocked(errorHandler.handleError)
        .mockImplementation(() => {
          throw new Error('exit');
        });

      const program = new Command();
      registerUserCommands(program);

      await expect(
        program.parseAsync(['node', 'test', 'user', 'get', 'user@example.com', '--expand', 'organizations,roles']),
      ).rejects.toThrow();

      expect(handleErrorMock).toHaveBeenCalledWith(
        expect.objectContaining({ message: expect.stringMatching(/Invalid --expand/) }),
      );
    });

    it('passes expand parameter to get when --id is used', async () => {
      const program = new Command();
      registerUserCommands(program);

      await program.parseAsync(['node', 'test', 'user', 'get', 'user-123', '--id', '--expand', 'organizations']);

      expect(mockUsers.get).toHaveBeenCalledWith('user-123', { expand: 'organizations' });
    });

    it('rejects invalid --expand value with a clear error', async () => {
      const errorHandler = await import('../../error-handler.js');
      const handleErrorMock = vi
        .mocked(errorHandler.handleError)
        .mockImplementation(() => {
          throw new Error('exit');
        });

      const program = new Command();
      registerUserCommands(program);

      await expect(
        program.parseAsync(['node', 'test', 'user', 'get', 'alice@example.com', '--expand', 'bogus']),
      ).rejects.toThrow();

      expect(handleErrorMock).toHaveBeenCalledWith(
        expect.objectContaining({ message: expect.stringMatching(/Invalid --expand/) }),
      );
      expect(mockUsers.getByLogin).not.toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ expand: 'bogus' }),
      );
    });
  });

  describe('user current', () => {
    it('calls SDK current without expand', async () => {
      const program = new Command();
      registerUserCommands(program);

      await program.parseAsync(['node', 'test', 'user', 'current']);

      expect(mockUsers.current).toHaveBeenCalledWith();
    });

    it('passes expand parameter', async () => {
      const program = new Command();
      registerUserCommands(program);

      await program.parseAsync(['node', 'test', 'user', 'current', '--expand', 'roles']);

      expect(mockUsers.current).toHaveBeenCalledWith({ expand: 'roles' });
    });
  });

  describe('user audit', () => {
    it('resolves login to ID and calls auditLogs', async () => {
      const program = new Command();
      registerUserCommands(program);

      await program.parseAsync(['node', 'test', 'user', 'audit', 'user@example.com']);

      expect(mockUsers.getByLogin).toHaveBeenCalledWith('user@example.com');
      expect(mockUsers.auditLogs).toHaveBeenCalledWith('user-123', undefined);
    });

    it('passes --query-size to auditLogs', async () => {
      const program = new Command();
      registerUserCommands(program);

      await program.parseAsync(['node', 'test', 'user', 'audit', 'user@example.com', '--query-size', '50']);

      expect(mockUsers.getByLogin).toHaveBeenCalledWith('user@example.com');
      expect(mockUsers.auditLogs).toHaveBeenCalledWith('user-123', { querySize: 50 });
    });
  });

  describe('user roles', () => {
    it('resolves login to ID and calls roles', async () => {
      const program = new Command();
      registerUserCommands(program);

      await program.parseAsync(['node', 'test', 'user', 'roles', 'user@example.com']);

      expect(mockUsers.getByLogin).toHaveBeenCalledWith('user@example.com');
      expect(mockUsers.roles).toHaveBeenCalledWith('user-123');
    });
  });

  describe('user instances', () => {
    it('resolves login to ID and calls instances', async () => {
      const program = new Command();
      registerUserCommands(program);

      await program.parseAsync(['node', 'test', 'user', 'instances', 'user@example.com']);

      expect(mockUsers.getByLogin).toHaveBeenCalledWith('user@example.com');
      expect(mockUsers.instances).toHaveBeenCalledWith('user-123');
    });
  });

  describe('user assigned-realms', () => {
    it('resolves login to ID and calls assignedRealms', async () => {
      const program = new Command();
      registerUserCommands(program);

      await program.parseAsync(['node', 'test', 'user', 'assigned-realms', 'user@example.com']);

      expect(mockUsers.getByLogin).toHaveBeenCalledWith('user@example.com');
      expect(mockUsers.assignedRealms).toHaveBeenCalledWith('user-123');
    });
  });

  describe('user assigned-instances', () => {
    it('resolves login to ID and calls assignedInstances', async () => {
      const program = new Command();
      registerUserCommands(program);

      await program.parseAsync(['node', 'test', 'user', 'assigned-instances', 'user@example.com']);

      expect(mockUsers.getByLogin).toHaveBeenCalledWith('user@example.com');
      expect(mockUsers.assignedInstances).toHaveBeenCalledWith('user-123');
    });
  });
});

describe('user grant-role command', () => {
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
    registerUserCommands(program);
  });

  afterEach(() => {
    stderrSpy.mockRestore();
  });

  it('resolves login to id, then calls grantRole', async () => {
    mockUsers.getByLogin.mockResolvedValueOnce({ id: 'user-123', mail: 'alice@example.com' });
    mockUsers.grantRole.mockResolvedValueOnce({
      user: { id: 'user-123', roles: ['account-admin'] },
      changed: true,
      roleScope: 'GLOBAL',
    });

    await program.parseAsync(['node', 'ccam', 'user', 'grant-role', 'alice@example.com', 'account-admin']);

    expect(mockUsers.getByLogin).toHaveBeenCalledWith('alice@example.com');
    expect(mockUsers.grantRole).toHaveBeenCalledWith('user-123', 'account-admin', undefined);
    expect(stderr).toMatch(/Granted role account-admin to user alice@example.com/);
  });

  it('bypasses login lookup with --id', async () => {
    mockUsers.grantRole.mockResolvedValueOnce({
      user: { id: 'user-123', roles: ['account-admin'] },
      changed: true,
      roleScope: 'GLOBAL',
    });

    await program.parseAsync(['node', 'ccam', 'user', 'grant-role', '--id', 'user-123', 'account-admin']);

    expect(mockUsers.getByLogin).not.toHaveBeenCalled();
    expect(mockUsers.grantRole).toHaveBeenCalledWith('user-123', 'account-admin', undefined);
  });

  it('splits --tenants and passes as opts', async () => {
    mockUsers.getByLogin.mockResolvedValueOnce({ id: 'user-123' });
    mockUsers.grantRole.mockResolvedValueOnce({
      user: { id: 'user-123' },
      changed: true,
      roleScope: 'INSTANCE',
    });

    await program.parseAsync([
      'node', 'ccam', 'user', 'grant-role',
      'alice@example.com', 'ccdx-sbx-user',
      '--tenants', 'tbdx_dev,tbdx_stg',
    ]);

    expect(mockUsers.grantRole).toHaveBeenCalledWith(
      'user-123',
      'ccdx-sbx-user',
      { tenants: ['tbdx_dev', 'tbdx_stg'] },
    );
  });

  it('prints no-op stderr notice when changed=false', async () => {
    mockUsers.getByLogin.mockResolvedValueOnce({ id: 'user-123' });
    mockUsers.grantRole.mockResolvedValueOnce({
      user: { id: 'user-123', roles: ['account-admin'] },
      changed: false,
      roleScope: 'GLOBAL',
    });

    await program.parseAsync(['node', 'ccam', 'user', 'grant-role', 'alice@example.com', 'account-admin']);

    expect(stderr).toMatch(/already has role account-admin.*no changes/);
  });

  it('warns when a non-GLOBAL role is granted without --tenants', async () => {
    mockUsers.getByLogin.mockResolvedValueOnce({ id: 'user-123' });
    mockUsers.grantRole.mockResolvedValueOnce({
      user: { id: 'user-123', roles: ['ccdx-sbx-user'] },
      changed: true,
      roleScope: 'INSTANCE',
    });

    await program.parseAsync(['node', 'ccam', 'user', 'grant-role', 'alice@example.com', 'ccdx-sbx-user']);

    expect(stderr).toMatch(/Granted role ccdx-sbx-user/);
    expect(stderr).toMatch(/scope INSTANCE.*inert until tenants are set/);
  });

  it('does not warn when tenants are supplied', async () => {
    mockUsers.getByLogin.mockResolvedValueOnce({ id: 'user-123' });
    mockUsers.grantRole.mockResolvedValueOnce({
      user: { id: 'user-123', roles: ['ccdx-sbx-user'] },
      changed: true,
      roleScope: 'INSTANCE',
    });

    await program.parseAsync([
      'node', 'ccam', 'user', 'grant-role',
      'alice@example.com', 'ccdx-sbx-user',
      '--tenants', 'tbdx_stg',
    ]);

    expect(stderr).not.toMatch(/inert until tenants are set/);
  });

  it('warns when --tenants is an empty string for non-GLOBAL role', async () => {
    mockUsers.getByLogin.mockResolvedValueOnce({ id: 'user-123' });
    mockUsers.grantRole.mockResolvedValueOnce({
      user: { id: 'user-123', roles: ['ccdx-sbx-user'] },
      changed: true,
      roleScope: 'INSTANCE',
    });

    await program.parseAsync([
      'node', 'ccam', 'user', 'grant-role',
      'alice@example.com', 'ccdx-sbx-user',
      '--tenants', '',
    ]);

    expect(stderr).toMatch(/scope INSTANCE.*inert until tenants are set/);
  });
});

describe('user revoke-role command', () => {
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
    registerUserCommands(program);
  });

  afterEach(() => {
    stderrSpy.mockRestore();
  });

  it('resolves login and calls revokeRole', async () => {
    mockUsers.getByLogin.mockResolvedValueOnce({ id: 'user-123' });
    mockUsers.revokeRole.mockResolvedValueOnce({
      user: { id: 'user-123' },
      changed: true,
    });

    await program.parseAsync(['node', 'ccam', 'user', 'revoke-role', 'alice@example.com', 'account-admin']);

    expect(mockUsers.revokeRole).toHaveBeenCalledWith('user-123', 'account-admin');
    expect(stderr).toMatch(/Revoked role account-admin from user alice@example.com/);
  });

  it('prints no-op stderr notice when changed=false', async () => {
    mockUsers.getByLogin.mockResolvedValueOnce({ id: 'user-123' });
    mockUsers.revokeRole.mockResolvedValueOnce({
      user: { id: 'user-123' },
      changed: false,
    });

    await program.parseAsync(['node', 'ccam', 'user', 'revoke-role', 'alice@example.com', 'account-admin']);

    expect(stderr).toMatch(/does not have role account-admin.*no changes/);
  });
});
