import { Command } from 'commander';
import { addGlobalOptions, parseExpand, resolveGlobalOptions, writePageInfoIfTable, type GlobalOptions } from '../shared.js';
import { resolveProfile } from '../auth/profile-resolver.js';
import { createClientFromResolved } from '../client-factory.js';
import { handleError } from '../error-handler.js';
import { renderOutput, resolveFormat } from '../output/index.js';
import { DEFAULT_COLUMNS } from '../output/default-columns.js';

const USER_GET_EXPAND = ['organizations', 'roles', 'organizations,roles'] as const;
const USER_GET_BY_LOGIN_EXPAND = ['organizations'] as const;

interface UserFilters {
  login?: string;
  org?: string;
  role?: string;
  orgRealmAccess?: string;
  modifiedAfter?: string;
  all?: boolean;
}

type UserFinder =
  | 'list'
  | 'findByLogin'
  | 'findByOrg'
  | 'findAllByOrg'
  | 'findByRole'
  | 'findByOrgAndRole'
  | 'findByOrgRealmAccess';

export function selectUserFinder(filters: UserFilters): UserFinder {
  // Check for specific combinations
  if (filters.org && filters.role) {
    return 'findByOrgAndRole';
  }

  if (filters.orgRealmAccess) {
    return 'findByOrgRealmAccess';
  }

  if (filters.role) {
    return 'findByRole';
  }

  if (filters.org) {
    return filters.all ? 'findAllByOrg' : 'findByOrg';
  }

  if (filters.login) {
    return 'findByLogin';
  }

  return 'list';
}

interface UserListOptions extends GlobalOptions {
  login?: string;
  org?: string;
  role?: string;
  orgRealmAccess?: string;
  modifiedAfter?: string;
  all?: boolean;
}

interface UserGetOptions extends GlobalOptions {
  id?: boolean;
  expand?: string;
}

interface UserCurrentOptions extends GlobalOptions {
  expand?: string;
}

async function listUsers(options: UserListOptions): Promise<void> {
  try {
    const resolved = resolveGlobalOptions(options);

    // Validate modifiedAfter requires role
    if (options.modifiedAfter && !options.role) {
      process.stderr.write('Error: --modified-after requires --role\n');
      process.exit(1);
    }

    // Validate --all requires --org
    if (options.all && !options.org) {
      process.stderr.write('Error: --all requires --org\n');
      process.exit(1);
    }

    const profileResolved = await resolveProfile({
      flags: { profile: options.profile, host: resolved.host },
    });
    const client = await createClientFromResolved(profileResolved);

    const filters: UserFilters = {
      login: options.login,
      org: options.org,
      role: options.role,
      orgRealmAccess: options.orgRealmAccess,
      modifiedAfter: options.modifiedAfter,
      all: options.all,
    };

    const finder = selectUserFinder(filters);

    let result;
    switch (finder) {
      case 'list':
        result = await client.users.list({
          page: resolved.page,
          size: resolved.size,
          sort: resolved.sort,
        });
        break;

      case 'findByLogin':
        result = await client.users.getByLogin(filters.login!);
        break;

      case 'findByOrg':
        result = await client.users.search.findByOrg({
          organization: filters.org!,
          page: resolved.page,
          size: resolved.size,
        });
        break;

      case 'findAllByOrg':
        result = await client.users.search.findAllByOrg({
          organization: filters.org!,
          page: resolved.page,
          size: resolved.size,
        });
        break;

      case 'findByRole':
        result = await client.users.search.findByRole({
          role: filters.role!,
          modifiedAfter: filters.modifiedAfter,
          page: resolved.page,
          size: resolved.size,
        });
        break;

      case 'findByOrgAndRole':
        result = await client.users.search.findByOrgAndRole({
          organization: filters.org!,
          role: filters.role!,
          page: resolved.page,
          size: resolved.size,
        });
        break;

      case 'findByOrgRealmAccess':
        result = await client.users.search.findByOrgRealmAccess({
          organization: filters.orgRealmAccess!,
          page: resolved.page,
          size: resolved.size,
        });
        break;
    }

    const format = resolveFormat(resolved.format, process.stdout.isTTY);
    const data = result && typeof result === 'object' && 'content' in result ? result.content : result;
    renderOutput(data, { format, fields: resolved.fields, defaultFields: DEFAULT_COLUMNS.user });

    writePageInfoIfTable(format, result);
  } catch (err) {
    handleError(err);
  }
}

async function getUser(loginOrId: string, options: UserGetOptions): Promise<void> {
  try {
    const resolved = resolveGlobalOptions(options);

    const profileResolved = await resolveProfile({
      flags: { profile: options.profile, host: resolved.host },
    });
    const client = await createClientFromResolved(profileResolved);

    let result;
    if (options.id) {
      const expand = parseExpand(options.expand, USER_GET_EXPAND);
      // Branch on the literal expand value so TypeScript can pick the right overload.
      if (expand === 'organizations') {
        result = await client.users.get(loginOrId, { expand });
      } else if (expand === 'roles') {
        result = await client.users.get(loginOrId, { expand });
      } else if (expand === 'organizations,roles') {
        result = await client.users.get(loginOrId, { expand });
      } else {
        result = await client.users.get(loginOrId);
      }
    } else {
      const expand = parseExpand(options.expand, USER_GET_BY_LOGIN_EXPAND);
      result = expand ? await client.users.getByLogin(loginOrId, { expand }) : await client.users.getByLogin(loginOrId);
    }

    const format = resolveFormat(resolved.format, process.stdout.isTTY);
    renderOutput(result, { format, fields: resolved.fields, defaultFields: DEFAULT_COLUMNS.userDetail });
  } catch (err) {
    handleError(err);
  }
}

async function currentUser(options: UserCurrentOptions): Promise<void> {
  try {
    const resolved = resolveGlobalOptions(options);

    const profileResolved = await resolveProfile({
      flags: { profile: options.profile, host: resolved.host },
    });
    const client = await createClientFromResolved(profileResolved);

    const expand = parseExpand(options.expand, USER_GET_EXPAND);
    // Branch on the literal expand value so TypeScript can pick the right overload.
    let result;
    if (expand === 'organizations') {
      result = await client.users.current({ expand });
    } else if (expand === 'roles') {
      result = await client.users.current({ expand });
    } else if (expand === 'organizations,roles') {
      result = await client.users.current({ expand });
    } else {
      result = await client.users.current();
    }

    const format = resolveFormat(resolved.format, process.stdout.isTTY);
    renderOutput(result, { format, fields: resolved.fields, defaultFields: DEFAULT_COLUMNS.userDetail });
  } catch (err) {
    handleError(err);
  }
}

interface UserAuditOptions extends GlobalOptions {
  querySize?: string;
}

async function auditUser(login: string, options: UserAuditOptions): Promise<void> {
  try {
    const resolved = resolveGlobalOptions(options);

    const profileResolved = await resolveProfile({
      flags: { profile: options.profile, host: resolved.host },
    });
    const client = await createClientFromResolved(profileResolved);

    // Resolve login to ID first
    const user = await client.users.getByLogin(login);
    const querySize = options.querySize !== undefined ? parseInt(options.querySize, 10) : undefined;
    const result = await client.users.auditLogs(user.id, querySize !== undefined ? { querySize } : undefined);

    const format = resolveFormat(resolved.format, process.stdout.isTTY);
    renderOutput(result.content, { format, fields: resolved.fields, defaultFields: DEFAULT_COLUMNS.auditLog });
  } catch (err) {
    handleError(err);
  }
}

async function userRoles(login: string, options: GlobalOptions): Promise<void> {
  try {
    const resolved = resolveGlobalOptions(options);

    const profileResolved = await resolveProfile({
      flags: { profile: options.profile, host: resolved.host },
    });
    const client = await createClientFromResolved(profileResolved);

    const user = await client.users.getByLogin(login);
    const result = await client.users.roles(user.id);

    const format = resolveFormat(resolved.format, process.stdout.isTTY);
    renderOutput(result.content, { format, fields: resolved.fields, defaultFields: DEFAULT_COLUMNS.role });
  } catch (err) {
    handleError(err);
  }
}

async function userInstances(login: string, options: GlobalOptions): Promise<void> {
  try {
    const resolved = resolveGlobalOptions(options);

    const profileResolved = await resolveProfile({
      flags: { profile: options.profile, host: resolved.host },
    });
    const client = await createClientFromResolved(profileResolved);

    const user = await client.users.getByLogin(login);
    const result = await client.users.instances(user.id);

    const format = resolveFormat(resolved.format, process.stdout.isTTY);
    renderOutput(result.content, { format, fields: resolved.fields, defaultFields: DEFAULT_COLUMNS.instance });
  } catch (err) {
    handleError(err);
  }
}

async function userAssignedRealms(login: string, options: GlobalOptions): Promise<void> {
  try {
    const resolved = resolveGlobalOptions(options);

    const profileResolved = await resolveProfile({
      flags: { profile: options.profile, host: resolved.host },
    });
    const client = await createClientFromResolved(profileResolved);

    const user = await client.users.getByLogin(login);
    const result = await client.users.assignedRealms(user.id);

    const format = resolveFormat(resolved.format, process.stdout.isTTY);
    renderOutput(result.content, { format, fields: resolved.fields, defaultFields: DEFAULT_COLUMNS.realm });
  } catch (err) {
    handleError(err);
  }
}

async function userAssignedInstances(login: string, options: GlobalOptions): Promise<void> {
  try {
    const resolved = resolveGlobalOptions(options);

    const profileResolved = await resolveProfile({
      flags: { profile: options.profile, host: resolved.host },
    });
    const client = await createClientFromResolved(profileResolved);

    const user = await client.users.getByLogin(login);
    const result = await client.users.assignedInstances(user.id);

    const format = resolveFormat(resolved.format, process.stdout.isTTY);
    renderOutput(result.content, { format, fields: resolved.fields, defaultFields: DEFAULT_COLUMNS.instance });
  } catch (err) {
    handleError(err);
  }
}

async function createUser(
  options: GlobalOptions & {
    mail: string;
    firstName: string;
    lastName: string;
    primaryOrg: string;
    displayName?: string;
    roles?: string;
    organizations?: string;
  },
): Promise<void> {
  try {
    const resolved = resolveGlobalOptions(options);
    const profileResolved = await resolveProfile({
      flags: { profile: options.profile, host: resolved.host },
    });
    const client = await createClientFromResolved(profileResolved);

    const data: Record<string, unknown> = {
      mail: options.mail,
      firstName: options.firstName,
      lastName: options.lastName,
      primaryOrganization: options.primaryOrg,
    };
    if (options.displayName !== undefined) data.displayName = options.displayName;
    if (options.roles) data.roles = options.roles.split(',');
    if (options.organizations) data.organizations = options.organizations.split(',');

    const result = await client.users.create(
      data as unknown as Parameters<typeof client.users.create>[0],
    );

    const format = resolveFormat(resolved.format, process.stdout.isTTY);
    renderOutput(result, {
      format,
      fields: resolved.fields,
      defaultFields: DEFAULT_COLUMNS.userDetail,
    });
  } catch (err) {
    handleError(err);
  }
}

interface UserUpdateOptions extends GlobalOptions {
  id?: boolean;
  mail?: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  primaryOrg?: string;
  roles?: string;
  organizations?: string;
}

async function updateUser(loginOrId: string, options: UserUpdateOptions): Promise<void> {
  try {
    const resolved = resolveGlobalOptions(options);
    const profileResolved = await resolveProfile({
      flags: { profile: options.profile, host: resolved.host },
    });
    const client = await createClientFromResolved(profileResolved);

    const userId = options.id ? loginOrId : (await client.users.getByLogin(loginOrId)).id;

    const data: Record<string, unknown> = {};
    if (options.mail !== undefined) data.mail = options.mail;
    if (options.firstName !== undefined) data.firstName = options.firstName;
    if (options.lastName !== undefined) data.lastName = options.lastName;
    if (options.displayName !== undefined) data.displayName = options.displayName;
    if (options.primaryOrg !== undefined) data.primaryOrganization = options.primaryOrg;
    if (options.roles) data.roles = options.roles.split(',');
    if (options.organizations) data.organizations = options.organizations.split(',');

    const result = await client.users.update(userId, data);

    const format = resolveFormat(resolved.format, process.stdout.isTTY);
    renderOutput(result, {
      format,
      fields: resolved.fields,
      defaultFields: DEFAULT_COLUMNS.userDetail,
    });
  } catch (err) {
    handleError(err);
  }
}

interface UserDeleteOptions extends GlobalOptions {
  id?: boolean;
}

async function deleteUser(loginOrId: string, options: UserDeleteOptions): Promise<void> {
  try {
    const resolved = resolveGlobalOptions(options);
    const profileResolved = await resolveProfile({
      flags: { profile: options.profile, host: resolved.host },
    });
    const client = await createClientFromResolved(profileResolved);

    const userId = options.id ? loginOrId : (await client.users.getByLogin(loginOrId)).id;
    await client.users.delete(userId);
    process.stderr.write(`Deleted user ${userId}\n`);
  } catch (err) {
    handleError(err);
  }
}

async function resetUser(
  login: string,
  options: GlobalOptions & { supportTicket?: string },
): Promise<void> {
  try {
    const resolved = resolveGlobalOptions(options);
    const profileResolved = await resolveProfile({
      flags: { profile: options.profile, host: resolved.host },
    });
    const client = await createClientFromResolved(profileResolved);

    const user = await client.users.getByLogin(login);
    const opts = options.supportTicket ? { supportTicketId: options.supportTicket } : undefined;
    await client.users.reset(user.id, opts);
    process.stderr.write(`Reset password for user ${login}\n`);
  } catch (err) {
    handleError(err);
  }
}

async function disableUser(
  login: string,
  options: GlobalOptions & { supportTicket?: string },
): Promise<void> {
  try {
    const resolved = resolveGlobalOptions(options);
    const profileResolved = await resolveProfile({
      flags: { profile: options.profile, host: resolved.host },
    });
    const client = await createClientFromResolved(profileResolved);

    const user = await client.users.getByLogin(login);
    const opts = options.supportTicket ? { supportTicketId: options.supportTicket } : undefined;
    await client.users.disable(user.id, opts);
    process.stderr.write(`Disabled user ${login}\n`);
  } catch (err) {
    handleError(err);
  }
}

async function revokeUserVerifier(
  login: string,
  verifierId: string,
  options: GlobalOptions,
): Promise<void> {
  try {
    const resolved = resolveGlobalOptions(options);
    const profileResolved = await resolveProfile({
      flags: { profile: options.profile, host: resolved.host },
    });
    const client = await createClientFromResolved(profileResolved);

    const user = await client.users.getByLogin(login);
    await client.users.revokeVerifier(user.id, verifierId);
    process.stderr.write(`Revoked verifier ${verifierId} for user ${login}\n`);
  } catch (err) {
    handleError(err);
  }
}

async function grantUserRole(
  loginOrId: string,
  roleId: string,
  options: GlobalOptions & { id?: boolean; tenants?: string },
): Promise<void> {
  try {
    const resolved = resolveGlobalOptions(options);
    const profileResolved = await resolveProfile({
      flags: { profile: options.profile, host: resolved.host },
    });
    const client = await createClientFromResolved(profileResolved);

    const userId = options.id ? loginOrId : (await client.users.getByLogin(loginOrId)).id;
    const tenants = options.tenants
      ? options.tenants.split(',').map((t) => t.trim()).filter((t) => t.length > 0)
      : undefined;
    const opts = tenants !== undefined ? { tenants } : undefined;

    const result = await client.users.grantRole(userId, roleId, opts);
    const subject = loginOrId;

    if (result.changed) {
      process.stderr.write(`Granted role ${roleId} to user ${subject}\n`);
    } else {
      process.stderr.write(`User ${subject} already has role ${roleId} (no changes)\n`);
    }

    if (result.roleScope !== 'GLOBAL' && tenants === undefined) {
      process.stderr.write(
        `Warning: role ${roleId} has scope ${result.roleScope}; it will be inert until tenants are set\n`
      );
    }
  } catch (err) {
    handleError(err);
  }
}

async function revokeUserRole(
  loginOrId: string,
  roleId: string,
  options: GlobalOptions & { id?: boolean },
): Promise<void> {
  try {
    const resolved = resolveGlobalOptions(options);
    const profileResolved = await resolveProfile({
      flags: { profile: options.profile, host: resolved.host },
    });
    const client = await createClientFromResolved(profileResolved);

    const userId = options.id ? loginOrId : (await client.users.getByLogin(loginOrId)).id;
    const result = await client.users.revokeRole(userId, roleId);
    const subject = loginOrId;

    if (result.changed) {
      process.stderr.write(`Revoked role ${roleId} from user ${subject}\n`);
    } else {
      process.stderr.write(`User ${subject} does not have role ${roleId} (no changes)\n`);
    }
  } catch (err) {
    handleError(err);
  }
}

export function registerUserCommands(program: Command): void {
  const user = program
    .command('user')
    .description('Manage users');

  // user list
  const list = user
    .command('list')
    .description('List users with optional filters');

  addGlobalOptions(list)
    .option('--login <email>', 'Find user by login (email address)')
    .option('--org <id>', 'Filter users by organization ID')
    .option('--role <id>', 'Filter users by role ID')
    .option('--org-realm-access <id>', 'Find users with realm access in organization')
    .option('--modified-after <date>', 'Filter by modification date (requires --role)')
    .option('--all', 'Include deleted users (requires --org)')
    .action(listUsers);

  // user get
  const get = user
    .command('get')
    .argument('<login>', 'User login (email) or ID')
    .description('Get a specific user');

  addGlobalOptions(get)
    .option('--id', 'Treat argument as user ID instead of login')
    .option('--expand <fields>', 'Expand related resources (organizations, roles, organizations,roles)')
    .action(getUser);

  // user current
  const current = user
    .command('current')
    .description('Get the current authenticated user (requires user-context token)');

  addGlobalOptions(current)
    .option('--expand <fields>', 'Expand related resources (organizations, roles, organizations,roles)')
    .action(currentUser);

  // user audit
  const audit = user
    .command('audit')
    .argument('<login>', 'User login (email)')
    .description('Get audit log for a user');

  addGlobalOptions(audit)
    .option('--query-size <n>', 'Limit audit log query window size')
    .action(auditUser);

  // user roles
  const roles = user
    .command('roles')
    .argument('<login>', 'User login (email)')
    .description('List roles assigned to a user');

  addGlobalOptions(roles).action(userRoles);

  // user instances
  const instances = user
    .command('instances')
    .argument('<login>', 'User login (email)')
    .description('List instances accessible to a user');

  addGlobalOptions(instances).action(userInstances);

  // user assigned-realms
  const assignedRealms = user
    .command('assigned-realms')
    .argument('<login>', 'User login (email)')
    .description('List realms assigned to a user via role-tenant filter');

  addGlobalOptions(assignedRealms).action(userAssignedRealms);

  // user assigned-instances
  const assignedInstances = user
    .command('assigned-instances')
    .argument('<login>', 'User login (email)')
    .description('List instances assigned to a user via role-tenant filter');

  addGlobalOptions(assignedInstances).action(userAssignedInstances);

  // user create
  const create = user.command('create').description('Create a new user');

  addGlobalOptions(create)
    .requiredOption('--mail <email>', 'Email address')
    .requiredOption('--first-name <name>', 'First name')
    .requiredOption('--last-name <name>', 'Last name')
    .requiredOption('--primary-org <id>', 'Primary organization ID')
    .option('--display-name <name>', 'Display name')
    .option('--roles <roles>', 'Comma-separated role IDs')
    .option('--organizations <orgs>', 'Comma-separated organization IDs')
    .action(createUser);

  // user update
  const update = user
    .command('update')
    .argument('<login-or-id>', 'User login (email) or ID')
    .description('Update a user');

  addGlobalOptions(update)
    .option('--id', 'Treat argument as user ID instead of login')
    .option('--mail <email>', 'Email address')
    .option('--first-name <name>', 'First name')
    .option('--last-name <name>', 'Last name')
    .option('--display-name <name>', 'Display name')
    .option('--primary-org <id>', 'Primary organization ID')
    .option('--roles <roles>', 'Comma-separated role IDs')
    .option('--organizations <orgs>', 'Comma-separated organization IDs')
    .action(updateUser);

  // user delete
  const del = user
    .command('delete')
    .argument('<login-or-id>', 'User login (email) or ID')
    .description('Delete a user');

  addGlobalOptions(del)
    .option('--id', 'Treat argument as user ID instead of login')
    .action(deleteUser);

  // user reset
  const reset = user
    .command('reset')
    .argument('<login>', 'User login (email)')
    .description('Reset a user password');

  addGlobalOptions(reset).option('--support-ticket <id>', 'Support ticket ID').action(resetUser);

  // user disable
  const disable = user
    .command('disable')
    .argument('<login>', 'User login (email)')
    .description('Disable (deactivate) a user');

  addGlobalOptions(disable).option('--support-ticket <id>', 'Support ticket ID').action(disableUser);

  // user revoke-verifier
  const revokeVerifier = user
    .command('revoke-verifier')
    .argument('<login>', 'User login (email)')
    .argument('<verifier-id>', 'Verifier ID to revoke')
    .description('Revoke an MFA verifier for a user');

  addGlobalOptions(revokeVerifier).action(revokeUserVerifier);

  // user grant-role
  const grantRole = user
    .command('grant-role')
    .argument('<login-or-id>', 'User login (email) or ID')
    .argument('<role-id>', 'Role ID to grant (e.g. "ccdx-sbx-user")')
    .description('Grant a role to a user (idempotent; read-modify-write on the user resource)');

  addGlobalOptions(grantRole)
    .option('--id', 'Treat first argument as user ID instead of login')
    .option('--tenants <csv>', 'Comma-separated tenants for scoped roles; union-merged into roleTenantFilter')
    .action(grantUserRole);

  // user revoke-role
  const revokeRole = user
    .command('revoke-role')
    .argument('<login-or-id>', 'User login (email) or ID')
    .argument('<role-id>', 'Role ID to revoke')
    .description('Revoke a role from a user (idempotent; server auto-strips any tenant-filter entry)');

  addGlobalOptions(revokeRole)
    .option('--id', 'Treat first argument as user ID instead of login')
    .action(revokeUserRole);
}
