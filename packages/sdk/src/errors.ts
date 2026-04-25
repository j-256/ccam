export interface FieldError {
  field: string;
  message: string;
}

export interface CcamErrorOptions {
  status: number;
  code?: string | null;
  resource: string;
  operation: string;
  fieldErrors?: FieldError[] | null;
}

export class CcamError extends Error {
  readonly status: number;
  readonly code: string | null;
  readonly resource: string;
  readonly operation: string;
  readonly fieldErrors: FieldError[] | null;

  constructor(message: string, options: CcamErrorOptions) {
    super(message);
    this.name = 'CcamError';
    this.status = options.status;
    this.code = options.code ?? null;
    this.resource = options.resource;
    this.operation = options.operation;
    this.fieldErrors = options.fieldErrors ?? null;
  }

  toJSON(): {
    name: string;
    message: string;
    status: number;
    code: string | null;
    resource: string;
    operation: string;
    fieldErrors: FieldError[] | null;
  } {
    return {
      name: this.name,
      message: this.message,
      status: this.status,
      code: this.code,
      resource: this.resource,
      operation: this.operation,
      fieldErrors: this.fieldErrors,
    };
  }
}

export class CcamAuthError extends CcamError {
  constructor(message: string, options: CcamErrorOptions) {
    super(message, options);
    this.name = 'CcamAuthError';
  }
}

export class CcamNotFoundError extends CcamError {
  constructor(message: string, options: CcamErrorOptions) {
    super(message, options);
    this.name = 'CcamNotFoundError';
  }
}

export interface CcamOAuthErrorContext {
  status: number;
  resource: string;
  operation: string;
  rawBody: string;
}

export class CcamOAuthError extends CcamAuthError {
  readonly oauthCode: string | null;
  readonly oauthDescription: string | null;
  readonly rawBody!: string;

  constructor(prefix: string, context: CcamOAuthErrorContext) {
    const parsed = parseOAuthErrorBody(context.rawBody);
    super(formatOAuthMessage(prefix, context.status, parsed), {
      status: context.status, resource: context.resource, operation: context.operation,
    });
    this.name = 'CcamOAuthError';
    Object.defineProperty(this, 'rawBody', {
      value: context.rawBody,
      enumerable: false,
      writable: false,
      configurable: false,
    });
    this.oauthCode = parsed.code;
    this.oauthDescription = parsed.description;
  }
}

export class CcamRefreshFailedError extends CcamOAuthError {
  readonly profile: string | undefined;

  constructor(prefix: string, context: { profile?: string; status?: number; rawBody?: string } = {}) {
    super(prefix, {
      status: context.status ?? 401,
      resource: 'auth',
      operation: 'refresh',
      rawBody: context.rawBody ?? '',
    });
    this.name = 'CcamRefreshFailedError';
    this.profile = context.profile;
  }
}

function formatOAuthMessage(prefix: string, status: number, parsed: { code: string | null; description: string | null }): string {
  const parts = [`${prefix}: HTTP ${status}`];
  if (parsed.code) {
    parts.push(parsed.code);
    parts.push(parsed.description ? `(${parsed.description})` : '(no description provided)');
  }
  return parts.join(' ');
}

function parseOAuthErrorBody(body: string): { code: string | null; description: string | null } {
  try {
    const data = JSON.parse(body) as { error?: unknown; error_description?: unknown };
    const code = typeof data.error === 'string' ? data.error : null;
    const description = typeof data.error_description === 'string' ? data.error_description : null;
    return { code, description };
  } catch {
    return { code: null, description: null };
  }
}
