import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HttpClient } from '../client.js';
import { CcamError, CcamAuthError, CcamNotFoundError } from '../errors.js';

function createMockFetch(status: number, body?: unknown) {
  const text = body !== undefined ? JSON.stringify(body) : '';
  return vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    text: async () => text,
    json: async () => body,
  });
}

describe('HttpClient', () => {
  const baseUrl = 'https://account.demandware.com/dw/rest/v1';
  const mockToken = async () => 'test-token';
  let mockGetToken: () => Promise<string>;

  beforeEach(() => {
    mockGetToken = vi.fn().mockResolvedValue('test-token');
  });

  it('sends GET request with auth header', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ id: '123', name: 'Test' }),
    });

    const client = new HttpClient({ baseUrl, getToken: mockToken, fetch: mockFetch });
    const result = await client.get<{ id: string; name: string }>('/users/123', undefined, {
      resource: 'users',
      operation: 'get',
    });

    expect(result).toEqual({ id: '123', name: 'Test' });
    expect(mockFetch).toHaveBeenCalledWith(
      'https://account.demandware.com/dw/rest/v1/users/123',
      {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer test-token',
          'Content-Type': 'application/json',
        },
      }
    );
  });

  it('builds query string from params, omitting undefined and null', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ content: [] }),
    });

    const client = new HttpClient({ baseUrl, getToken: mockToken, fetch: mockFetch });
    await client.get('/users', { role: 'admin', page: 0, empty: undefined, nullVal: null }, {
      resource: 'users',
      operation: 'list',
    });

    const calledUrl = mockFetch.mock.calls[0][0];
    expect(calledUrl).toBe('https://account.demandware.com/dw/rest/v1/users?role=admin&page=0');
  });

  it('throws CcamAuthError on 401', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      text: async () => JSON.stringify({
        errors: [{
          code: 'InvalidBearerTokenException',
          message: 'The Bearer Token is invalid',
        }],
      }),
    });

    const client = new HttpClient({ baseUrl, getToken: mockToken, fetch: mockFetch });
    await expect(client.get('/users', undefined, { resource: 'users', operation: 'list' }))
      .rejects.toThrow(CcamAuthError);

    try {
      await client.get('/users', undefined, { resource: 'users', operation: 'list' });
    } catch (err) {
      expect(err).toBeInstanceOf(CcamAuthError);
      if (err instanceof CcamAuthError) {
        expect(err.status).toBe(401);
        expect(err.code).toBe('InvalidBearerTokenException');
        expect(err.message).toContain('Bearer Token is invalid');
      }
    }
  });

  it('throws CcamNotFoundError on 404', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      text: async () => '',
    });

    const client = new HttpClient({ baseUrl, getToken: mockToken, fetch: mockFetch });
    await expect(client.get('/users/nonexistent', undefined, { resource: 'users', operation: 'get' }))
      .rejects.toThrow(CcamNotFoundError);

    try {
      await client.get('/users/nonexistent', undefined, { resource: 'users', operation: 'get' });
    } catch (err) {
      expect(err).toBeInstanceOf(CcamNotFoundError);
      if (err instanceof CcamNotFoundError) {
        expect(err.status).toBe(404);
        expect(err.resource).toBe('users');
        expect(err.operation).toBe('get');
      }
    }
  });

  it('throws CcamError on 400 with errors array', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      text: async () => JSON.stringify({
        errors: [{
          code: 'MissingServletRequestParameterException',
          message: 'Required request parameter missing',
          fieldErrors: [{ field: 'role', message: 'required' }],
        }],
      }),
    });

    const client = new HttpClient({ baseUrl, getToken: mockToken, fetch: mockFetch });
    try {
      await client.get('/users', undefined, { resource: 'users', operation: 'list' });
    } catch (err) {
      expect(err).toBeInstanceOf(CcamError);
      if (err instanceof CcamError) {
        expect(err.status).toBe(400);
        expect(err.code).toBe('MissingServletRequestParameterException');
        expect(err.fieldErrors).toEqual([{ field: 'role', message: 'required' }]);
      }
    }
  });

  it('throws CcamError on 403 with fault object', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 403,
      text: async () => JSON.stringify({
        fault: {
          type: 'AccessForbiddenException',
          message: 'Access denied',
        },
      }),
    });

    const client = new HttpClient({ baseUrl, getToken: mockToken, fetch: mockFetch });
    try {
      await client.get('/users', undefined, { resource: 'users', operation: 'list' });
    } catch (err) {
      expect(err).toBeInstanceOf(CcamError);
      if (err instanceof CcamError) {
        expect(err.status).toBe(403);
        expect(err.code).toBe('AccessForbiddenException');
        expect(err.message).toContain('Access denied');
      }
    }
  });

  it('handles plain text error body (504)', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 504,
      text: async () => 'upstream request timeout',
    });

    const client = new HttpClient({ baseUrl, getToken: mockToken, fetch: mockFetch });
    try {
      await client.get('/users', undefined, { resource: 'users', operation: 'list' });
    } catch (err) {
      expect(err).toBeInstanceOf(CcamError);
      if (err instanceof CcamError) {
        expect(err.status).toBe(504);
        expect(err.message).toContain('upstream request timeout');
      }
    }
  });

  describe('post', () => {
    it('should send POST with JSON body and return parsed response', async () => {
      const responseBody = { id: '123', name: 'created' };
      const mockFetch = createMockFetch(201, responseBody);
      const client = new HttpClient({
        baseUrl: 'https://example.com',
        getToken: mockGetToken,
        fetch: mockFetch as unknown as typeof fetch,
      });

      const result = await client.post<typeof responseBody>(
        '/dw/rest/v1/things',
        { name: 'created' },
        undefined,
        { resource: 'things', operation: 'create' }
      );

      expect(mockFetch).toHaveBeenCalledWith(
        'https://example.com/dw/rest/v1/things',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Authorization': 'Bearer test-token',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ name: 'created' }),
        })
      );
      expect(result).toEqual(responseBody);
    });

    it('should handle empty response body (204-like)', async () => {
      const mockFetch = createMockFetch(200);
      const client = new HttpClient({
        baseUrl: 'https://example.com',
        getToken: mockGetToken,
        fetch: mockFetch as unknown as typeof fetch,
      });

      const result = await client.post<void>(
        '/dw/rest/v1/things/123/action',
        {},
        undefined,
        { resource: 'things', operation: 'action' }
      );

      expect(result).toBeUndefined();
    });

    it('should send POST without body when body is undefined', async () => {
      const mockFetch = createMockFetch(200);
      const client = new HttpClient({
        baseUrl: 'https://example.com',
        getToken: mockGetToken,
        fetch: mockFetch as unknown as typeof fetch,
      });

      await client.post<void>(
        '/dw/rest/v1/things/123/action',
        undefined,
        undefined,
        { resource: 'things', operation: 'action' }
      );

      const callArgs = mockFetch.mock.calls[0][1] as Record<string, unknown>;
      expect(callArgs.body).toBeUndefined();
    });

    it('should include query params when provided', async () => {
      const mockFetch = createMockFetch(201, { id: '123' });
      const client = new HttpClient({
        baseUrl: 'https://example.com',
        getToken: mockGetToken,
        fetch: mockFetch as unknown as typeof fetch,
      });

      await client.post<unknown>(
        '/dw/rest/v1/things',
        { name: 'test' },
        { expand: 'details' },
        { resource: 'things', operation: 'create' }
      );

      expect(mockFetch).toHaveBeenCalledWith(
        'https://example.com/dw/rest/v1/things?expand=details',
        expect.anything()
      );
    });

    it('should throw CcamError on error response', async () => {
      const mockFetch = createMockFetch(400, {
        errors: [{ message: 'Validation failed', code: 'INVALID' }],
      });
      const client = new HttpClient({
        baseUrl: 'https://example.com',
        getToken: mockGetToken,
        fetch: mockFetch as unknown as typeof fetch,
      });

      await expect(
        client.post('/dw/rest/v1/things', { name: '' }, undefined, {
          resource: 'things',
          operation: 'create',
        })
      ).rejects.toThrow(CcamError);
    });
  });

  describe('put', () => {
    it('should send PUT with JSON body and return parsed response', async () => {
      const responseBody = { id: '123', name: 'updated' };
      const mockFetch = createMockFetch(200, responseBody);
      const client = new HttpClient({
        baseUrl: 'https://example.com',
        getToken: mockGetToken,
        fetch: mockFetch as unknown as typeof fetch,
      });

      const result = await client.put<typeof responseBody>(
        '/dw/rest/v1/things/123',
        { name: 'updated' },
        undefined,
        { resource: 'things', operation: 'update' }
      );

      expect(mockFetch).toHaveBeenCalledWith(
        'https://example.com/dw/rest/v1/things/123',
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify({ name: 'updated' }),
        })
      );
      expect(result).toEqual(responseBody);
    });

    it('should throw CcamNotFoundError on 404', async () => {
      const mockFetch = createMockFetch(404);
      const client = new HttpClient({
        baseUrl: 'https://example.com',
        getToken: mockGetToken,
        fetch: mockFetch as unknown as typeof fetch,
      });

      await expect(
        client.put('/dw/rest/v1/things/999', { name: 'x' }, undefined, {
          resource: 'things',
          operation: 'update',
        })
      ).rejects.toThrow(CcamNotFoundError);
    });
  });

  describe('delete', () => {
    it('should send DELETE and return void', async () => {
      const mockFetch = createMockFetch(204);
      const client = new HttpClient({
        baseUrl: 'https://example.com',
        getToken: mockGetToken,
        fetch: mockFetch as unknown as typeof fetch,
      });

      await client.delete(
        '/dw/rest/v1/things/123',
        undefined,
        { resource: 'things', operation: 'delete' }
      );

      expect(mockFetch).toHaveBeenCalledWith(
        'https://example.com/dw/rest/v1/things/123',
        expect.objectContaining({ method: 'DELETE' })
      );
    });

    it('should include query params (e.g. deleteImmediately)', async () => {
      const mockFetch = createMockFetch(204);
      const client = new HttpClient({
        baseUrl: 'https://example.com',
        getToken: mockGetToken,
        fetch: mockFetch as unknown as typeof fetch,
      });

      await client.delete(
        '/dw/rest/v1/apiclients/abc',
        { deleteImmediately: true },
        { resource: 'apiClients', operation: 'delete' }
      );

      expect(mockFetch).toHaveBeenCalledWith(
        'https://example.com/dw/rest/v1/apiclients/abc?deleteImmediately=true',
        expect.anything()
      );
    });

    it('should throw CcamError on error response', async () => {
      const mockFetch = createMockFetch(412, {
        errors: [{ message: 'Resource still in use' }],
      });
      const client = new HttpClient({
        baseUrl: 'https://example.com',
        getToken: mockGetToken,
        fetch: mockFetch as unknown as typeof fetch,
      });

      await expect(
        client.delete('/dw/rest/v1/things/123', undefined, {
          resource: 'things',
          operation: 'delete',
        })
      ).rejects.toThrow(CcamError);
    });
  });
});
