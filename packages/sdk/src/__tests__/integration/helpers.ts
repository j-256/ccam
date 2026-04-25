import { describe, it, expect } from 'vitest';
import { CcamClient, CcamNotFoundError } from '../../index.js';
import type { ContentResponse, PagedResponse } from '../../types/index.js';
import type { IntegrationConfig } from './env.js';

// -- Client factory --

export function createClient(cfg: IntegrationConfig): CcamClient {
  return new CcamClient({
    clientId: cfg.clientId,
    clientSecret: cfg.clientSecret,
    host: cfg.host,
  });
}

// -- Throwaway-resource naming --
// All throwaway resources created by write-op tests share the `ccam-test-`
// infix so that any orphans left by a failed run are easy to spot and delete.

export function testResourceName(prefix: string): string {
  return `${prefix}-ccam-test-${Date.now()}`;
}

// Tolerate 404 during teardown (the test may have already deleted the resource).
export async function safeDelete(fn: () => Promise<void>): Promise<void> {
  try {
    await fn();
  } catch (err) {
    if (!(err instanceof CcamNotFoundError)) throw err;
  }
}

// -- Schema validation --

export type FieldSpec = Record<string, 'string' | 'number' | 'boolean' | 'object' | 'array' | 'string|null' | 'number|null' | 'object|null' | 'array|null'>;

export function validateSchema(obj: Record<string, unknown>, spec: FieldSpec, label: string): void {
  // Check every field in the spec exists with the expected type
  for (const [field, expectedType] of Object.entries(spec)) {
    const value = obj[field];

    if (expectedType.endsWith('|null')) {
      const baseType = expectedType.slice(0, -5); // strip '|null'
      // Treat absent (undefined) the same as null -- JSON omits and null are
      // equivalent for nullable fields
      if (value === null || value === undefined) continue;
      const actualType = Array.isArray(value) ? 'array' : typeof value;
      if (actualType !== baseType) {
        throw new Error(`${label}: field "${field}" is ${actualType}, expected ${expectedType}`);
      }
    } else {
      if (value === undefined || value === null) {
        throw new Error(`${label}: missing field "${field}" (expected ${expectedType})`);
      }
      const actualType = Array.isArray(value) ? 'array' : typeof value;
      if (actualType !== expectedType) {
        throw new Error(`${label}: field "${field}" is ${actualType}, expected ${expectedType}`);
      }
    }
  }

  // Warn on unexpected fields (non-fatal)
  for (const key of Object.keys(obj)) {
    if (!(key in spec)) {
      console.warn(`[schema] ${label}: unexpected field "${key}" in response (not in type definition)`);
    }
  }
}

// -- Paged response assertions --

export function assertPagedResponse<T>(result: PagedResponse<T>, label: string): void {
  expect(result.content, `${label}: content should be an array`).toBeInstanceOf(Array);
  expect(result.page, `${label}: page should exist`).toBeDefined();
  expect(typeof result.page.number, `${label}: page.number`).toBe('number');
  expect(typeof result.page.size, `${label}: page.size`).toBe('number');
  expect(typeof result.page.totalElements, `${label}: page.totalElements`).toBe('number');
  expect(typeof result.page.totalPages, `${label}: page.totalPages`).toBe('number');
  expect(result.links, `${label}: links should be an array`).toBeInstanceOf(Array);
}

// -- Content-only response assertions (no page metadata) --
// Many endpoints (search finders, subresources, audit logs, permissions)
// return { content, links } without page metadata

export function assertContentResponse<T>(result: ContentResponse<T>, label: string): void {
  expect(result.content, `${label}: content should be an array`).toBeInstanceOf(Array);
  expect(result.links, `${label}: links should be an array`).toBeInstanceOf(Array);
}

// -- Sort enum sweep --

export function describeSortEnums(
  label: string,
  enumObj: Record<string, string>,
  listFn: (sort: { field: string; direction: 'asc' | 'desc' }) => Promise<PagedResponse<unknown>>,
): void {
  describe(`${label} sort enums`, () => {
    const fields = Object.values(enumObj);
    for (const field of fields) {
      for (const direction of ['asc', 'desc'] as const) {
        it(`accepts sort=${field},${direction}`, async () => {
          const result = await listFn({ field, direction });
          assertPagedResponse(result, `sort=${field},${direction}`);
        });
      }
    }
  });
}

// -- 404 error shape --

export function describe404(
  label: string,
  getFn: (id: string) => Promise<unknown>,
): void {
  describe(`${label} error shapes`, () => {
    it('get() with bogus ID throws CcamNotFoundError', async () => {
      try {
        await getFn('nonexistent-id-00000000-0000-0000-0000-000000000000');
        expect.fail('Expected CcamNotFoundError');
      } catch (err) {
        expect(err).toBeInstanceOf(CcamNotFoundError);
        const e = err as CcamNotFoundError;
        expect(e.status).toBe(404);
        expect(e.resource).toBeTruthy();
        expect(e.operation).toBeTruthy();
      }
    });
  });
}
