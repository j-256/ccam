import { describe, it, expect } from 'vitest';
import type { Role } from '../types/role.js';
import type { Realm } from '../types/realm.js';
import type { Permission } from '../types/permission.js';
import type { ServiceType } from '../types/service-type.js';
import type { AuditLogRecord } from '../types/audit-log.js';
import { RoleScope, RoleTargetType } from '../types/enums.js';

describe('Role type', () => {
  it('should accept a complete Role object', () => {
    const role: Role = {
      id: 'ECOM_ADMIN',
      description: 'E-Commerce Administrator role with full access',
      roleEnumName: 'ECOM_ADMIN',
      internalRole: false,
      serviceType: 'ECOM',
      permissions: ['READ_USER', 'WRITE_USER', 'DELETE_USER'],
      scope: RoleScope.INSTANCE,
      targetType: RoleTargetType.USER,
      twoFAEnabled: true,
      privileged: true,
      links: [{ rel: 'self', href: '/roles/ECOM_ADMIN' }],
    };

    expect(role.id).toBe('ECOM_ADMIN');
    expect(role.scope).toBe(RoleScope.INSTANCE);
    expect(role.targetType).toBe(RoleTargetType.USER);
    expect(role.twoFAEnabled).toBe(true);
  });

  it('should accept a Role with null targetType', () => {
    const role: Role = {
      id: 'SYSTEM_ROLE',
      description: 'Internal system role',
      roleEnumName: 'SYSTEM_ROLE',
      internalRole: true,
      serviceType: 'SYSTEM',
      permissions: [],
      scope: RoleScope.GLOBAL,
      targetType: null,
      twoFAEnabled: false,
      privileged: false,
      links: [],
    };

    expect(role.targetType).toBeNull();
    expect(role.internalRole).toBe(true);
  });
});

describe('Realm type', () => {
  it('should accept a complete Realm object', () => {
    const realm: Realm = {
      id: 'zzrf',
      description: 'Production environment for Acme Corp',
      customerName: 'Acme Corporation',
      organizationId: 'ACME',
      sfAccountId: 'SF001234567890',
      links: [{ rel: 'self', href: '/realms/zzrf' }],
    };

    expect(realm.id).toBe('zzrf');
    expect(realm.description).toBe('Production environment for Acme Corp');
    expect(realm.organizationId).toBe('ACME');
  });
});

describe('Permission type', () => {
  it('should accept a complete Permission object', () => {
    const permission: Permission = {
      name: 'READ_USER',
      adminPermission: false,
      links: [{ rel: 'self', href: '/permissions/READ_USER' }],
    };

    expect(permission.name).toBe('READ_USER');
    expect(permission.adminPermission).toBe(false);
  });

  it('should accept an admin permission', () => {
    const permission: Permission = {
      name: 'DELETE_ORG',
      adminPermission: true,
      links: [],
    };

    expect(permission.adminPermission).toBe(true);
  });
});

describe('ServiceType type', () => {
  it('should accept a complete ServiceType object', () => {
    const serviceType: ServiceType = {
      id: 'ECOM',
      description: 'E-Commerce Cloud Service',
      links: [{ rel: 'self', href: '/service-types/ECOM' }],
    };

    expect(serviceType.id).toBe('ECOM');
    expect(serviceType.description).toBe('E-Commerce Cloud Service');
  });
});

describe('AuditLogRecord type', () => {
  it('should accept a complete AuditLogRecord with user author', () => {
    const record: AuditLogRecord = {
      authorId: 'user-uuid-123',
      authorDisplayName: 'John Doe',
      authorEmail: 'john.doe@example.com',
      eventType: 'USER_CREATED',
      eventMessage: 'Created user jane.smith@example.com',
      supportTicketId: '',
      timestamp: '2026-04-10T12:34:56.789Z',
      arguments: ['jane.smith@example.com', 'ACME'],
      links: [{ rel: 'self', href: '/audit-logs/record-123' }],
    };

    expect(record.authorId).toBe('user-uuid-123');
    expect(record.eventType).toBe('USER_CREATED');
    expect(record.arguments).toHaveLength(2);
  });

  it('should accept a system-generated AuditLogRecord', () => {
    const record: AuditLogRecord = {
      authorId: null,
      authorDisplayName: 'System',
      authorEmail: null,
      eventType: 'PASSWORD_EXPIRED',
      eventMessage: 'Password expired for user john.doe@example.com',
      supportTicketId: '',
      timestamp: '2026-04-10T00:00:00.000Z',
      arguments: null,
      links: [],
    };

    expect(record.authorId).toBeNull();
    expect(record.authorEmail).toBeNull();
    expect(record.arguments).toBeNull();
    expect(record.authorDisplayName).toBe('System');
  });
});
