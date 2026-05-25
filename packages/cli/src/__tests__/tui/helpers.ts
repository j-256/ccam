import { vi } from 'vitest';
import type { CcamClient, PagedResponse } from 'ccam-sdk';

export function createMockClient(): CcamClient {
  return {
    users: {
      list: vi.fn(),
      get: vi.fn(),
      getByLogin: vi.fn(),
      search: {
        findByOrg: vi.fn(),
        findAllByOrg: vi.fn(),
        findByRole: vi.fn(),
        findByOrgAndRole: vi.fn(),
        findByOrgRealmAccess: vi.fn(),
      },
      roles: vi.fn(),
      instances: vi.fn(),
      assignedRealms: vi.fn(),
      assignedInstances: vi.fn(),
      auditLogs: vi.fn(),
      current: vi.fn(),
    },
    organizations: {
      list: vi.fn(),
      get: vi.fn(),
      search: {
        findByName: vi.fn(),
        findBySfAccountId: vi.fn(),
      },
      realms: vi.fn(),
      instances: vi.fn(),
      auditLogs: vi.fn(),
    },
    apiClients: {
      list: vi.fn(),
      get: vi.fn(),
      assignedRealms: vi.fn(),
      assignedInstances: vi.fn(),
      auditLogs: vi.fn(),
    },
    roles: {
      list: vi.fn(),
      get: vi.fn(),
    },
    realms: {
      list: vi.fn(),
      get: vi.fn(),
    },
    instances: {
      list: vi.fn(),
      get: vi.fn(),
    },
    permissions: {
      list: vi.fn(),
      get: vi.fn(),
    },
    serviceTypes: {
      list: vi.fn(),
      get: vi.fn(),
    },
    organizationConfiguration: {
      get: vi.fn(),
    },
  } as unknown as CcamClient;
}

export function mockPagedResponse<T>(
  content: T[],
  page = 0,
  totalPages = 1,
  totalElements?: number,
): PagedResponse<T> {
  return {
    content,
    page: {
      number: page,
      size: 25,
      totalElements: totalElements ?? content.length,
      totalPages,
    },
    links: [],
  };
}

export function delay(ms = 50): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
