import { CcamError, CcamAuthError, CcamNotFoundError } from './errors.js';

export interface ErrorContext {
  resource: string;
  operation: string;
}

export interface HttpClientOptions {
  baseUrl: string;
  getToken: () => Promise<string>;
  fetch?: typeof fetch;
}

/**
 * @internal
 * Low-level HTTP client used by resource classes. Exposed for advanced
 * use cases (e.g. calls to endpoints not yet surfaced as typed methods).
 * Customer integrations should use the typed resource methods on `CcamClient`
 * instead.
 */
export class HttpClient {
  private readonly baseUrl: string;
  private readonly getToken: () => Promise<string>;
  private readonly fetch: typeof fetch;

  constructor(options: HttpClientOptions) {
    this.baseUrl = options.baseUrl;
    this.getToken = options.getToken;
    this.fetch = options.fetch ?? globalThis.fetch;
  }

  async get<T>(
    path: string,
    params: Record<string, unknown> | undefined,
    context: ErrorContext
  ): Promise<T> {
    const url = this.buildUrl(path, params);
    const token = await this.getToken();

    const response = await this.fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      await this.handleErrorResponse(response, context);
    }

    return response.json() as Promise<T>;
  }

  /**
   * Empty response body is coerced to `undefined as T`. Only use `T = void`
   * for endpoints known to return no body; a `Promise<SomeObject>` return
   * on an empty body yields `undefined`, not a runtime error.
   */
  async post<T>(
    path: string,
    body: unknown,
    params: Record<string, unknown> | undefined,
    context: ErrorContext
  ): Promise<T> {
    const url = this.buildUrl(path, params);
    const token = await this.getToken();

    const response = await this.fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      await this.handleErrorResponse(response, context);
    }

    const text = await response.text();
    if (!text) return undefined as T;
    return JSON.parse(text) as T;
  }

  /**
   * Empty response body is coerced to `undefined as T`. Only use `T = void`
   * for endpoints known to return no body; a `Promise<SomeObject>` return
   * on an empty body yields `undefined`, not a runtime error.
   */
  async put<T>(
    path: string,
    body: unknown,
    params: Record<string, unknown> | undefined,
    context: ErrorContext
  ): Promise<T> {
    const url = this.buildUrl(path, params);
    const token = await this.getToken();

    const response = await this.fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      await this.handleErrorResponse(response, context);
    }

    const text = await response.text();
    if (!text) return undefined as T;
    return JSON.parse(text) as T;
  }

  async delete(
    path: string,
    params: Record<string, unknown> | undefined,
    context: ErrorContext
  ): Promise<void> {
    const url = this.buildUrl(path, params);
    const token = await this.getToken();

    const response = await this.fetch(url, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      await this.handleErrorResponse(response, context);
    }
  }

  private buildUrl(path: string, params?: Record<string, unknown>): string {
    const base = this.baseUrl.endsWith('/') ? this.baseUrl : `${this.baseUrl}/`;
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
    const url = new URL(cleanPath, base);

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    return url.toString();
  }

  private async handleErrorResponse(response: Response, context: ErrorContext): Promise<never> {
    const status = response.status;

    if (status === 404) {
      throw new CcamNotFoundError('Resource not found', {
        status,
        resource: context.resource,
        operation: context.operation,
      });
    }

    const text = await response.text();
    let errorBody: unknown;

    try {
      errorBody = JSON.parse(text);
    } catch {
      const ErrorClass = status === 401 ? CcamAuthError : CcamError;
      throw new ErrorClass(text || `HTTP ${status}`, {
        status,
        resource: context.resource,
        operation: context.operation,
      });
    }

    if (this.isErrorsResponse(errorBody)) {
      const firstError = errorBody.errors[0];
      const ErrorClass = status === 401 ? CcamAuthError : CcamError;

      throw new ErrorClass(firstError.message, {
        status,
        code: firstError.code ?? null,
        resource: context.resource,
        operation: context.operation,
        fieldErrors: firstError.fieldErrors ?? null,
      });
    }

    if (this.isFaultResponse(errorBody)) {
      throw new CcamError(errorBody.fault.message, {
        status,
        code: errorBody.fault.type ?? null,
        resource: context.resource,
        operation: context.operation,
      });
    }

    throw new CcamError(`HTTP ${status}`, {
      status,
      resource: context.resource,
      operation: context.operation,
    });
  }

  private isErrorsResponse(body: unknown): body is {
    errors: Array<{
      code?: string;
      message: string;
      fieldErrors?: Array<{ field: string; message: string }>;
    }>;
  } {
    return (
      typeof body === 'object' &&
      body !== null &&
      'errors' in body &&
      Array.isArray((body as { errors: unknown }).errors)
    );
  }

  private isFaultResponse(body: unknown): body is {
    fault: { type?: string; message: string };
  } {
    return (
      typeof body === 'object' &&
      body !== null &&
      'fault' in body &&
      typeof (body as { fault: unknown }).fault === 'object' &&
      (body as { fault: unknown }).fault !== null
    );
  }
}
