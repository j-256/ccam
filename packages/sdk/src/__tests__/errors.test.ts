import { describe, it, expect } from 'vitest';
import { CcamError, CcamAuthError, CcamNotFoundError, CcamOAuthError, CcamRefreshFailedError } from '../errors.js';

describe('CcamError', () => {
  it('constructs with all fields', () => {
    const err = new CcamError('Something failed', {
      status: 400,
      code: 'MissingServletRequestParameterException',
      resource: 'users',
      operation: 'search.findByRole',
      fieldErrors: [{ field: 'role', message: 'required' }],
    });
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(CcamError);
    expect(err.message).toBe('Something failed');
    expect(err.status).toBe(400);
    expect(err.code).toBe('MissingServletRequestParameterException');
    expect(err.resource).toBe('users');
    expect(err.operation).toBe('search.findByRole');
    expect(err.fieldErrors).toEqual([{ field: 'role', message: 'required' }]);
    expect(err.name).toBe('CcamError');
  });

  it('defaults optional fields to null', () => {
    const err = new CcamError('fail', { status: 500, resource: 'users', operation: 'list' });
    expect(err.code).toBeNull();
    expect(err.fieldErrors).toBeNull();
  });
});

describe('CcamAuthError', () => {
  it('is a CcamError with name CcamAuthError', () => {
    const err = new CcamAuthError('Token expired', {
      status: 401, code: 'InvalidBearerTokenException', resource: 'users', operation: 'list',
    });
    expect(err).toBeInstanceOf(CcamError);
    expect(err).toBeInstanceOf(CcamAuthError);
    expect(err.name).toBe('CcamAuthError');
  });
});

describe('CcamNotFoundError', () => {
  it('is a CcamError with name CcamNotFoundError', () => {
    const err = new CcamNotFoundError('User not found', {
      status: 404, resource: 'users', operation: 'get',
    });
    expect(err).toBeInstanceOf(CcamError);
    expect(err.name).toBe('CcamNotFoundError');
  });
});

describe('CcamRefreshFailedError', () => {
  it('is an instance of CcamAuthError', () => {
    const err = new CcamRefreshFailedError('expired', { profile: 'default' });
    expect(err).toBeInstanceOf(CcamAuthError);
  });

  it('exposes the profile name on the error', () => {
    const err = new CcamRefreshFailedError('expired', { profile: 'staging' });
    expect(err.profile).toBe('staging');
  });

  it('sets name to CcamRefreshFailedError', () => {
    const err = new CcamRefreshFailedError('expired', { profile: 'default' });
    expect(err.name).toBe('CcamRefreshFailedError');
  });
});

describe('CcamError.toJSON', () => {
  it('JSON.stringify produces the rich structured object for CcamError', () => {
    const err = new CcamError('Something failed', {
      status: 400,
      code: 'MissingServletRequestParameterException',
      resource: 'users',
      operation: 'search.findByRole',
      fieldErrors: [{ field: 'role', message: 'required' }],
    });
    const json = JSON.parse(JSON.stringify(err)) as Record<string, unknown>;
    expect(json).toEqual({
      name: 'CcamError',
      message: 'Something failed',
      status: 400,
      code: 'MissingServletRequestParameterException',
      resource: 'users',
      operation: 'search.findByRole',
      fieldErrors: [{ field: 'role', message: 'required' }],
    });
  });

  it('JSON.stringify produces the rich structured object for CcamAuthError', () => {
    const err = new CcamAuthError('Token expired', {
      status: 401, code: 'InvalidBearerTokenException', resource: 'users', operation: 'list',
    });
    const json = JSON.parse(JSON.stringify(err)) as Record<string, unknown>;
    expect(json).toEqual({
      name: 'CcamAuthError',
      message: 'Token expired',
      status: 401,
      code: 'InvalidBearerTokenException',
      resource: 'users',
      operation: 'list',
      fieldErrors: null,
    });
  });

  it('JSON.stringify produces the rich structured object for CcamNotFoundError', () => {
    const err = new CcamNotFoundError('User not found', {
      status: 404, resource: 'users', operation: 'get',
    });
    const json = JSON.parse(JSON.stringify(err)) as Record<string, unknown>;
    expect(json).toEqual({
      name: 'CcamNotFoundError',
      message: 'User not found',
      status: 404,
      code: null,
      resource: 'users',
      operation: 'get',
      fieldErrors: null,
    });
  });
});

describe('CcamOAuthError formatting', () => {
  it('formats message with both code and description', () => {
    const err = new CcamOAuthError('Token refresh failed', {
      status: 400,
      resource: 'auth',
      operation: 'refresh_token',
      rawBody: '{"error":"invalid_grant","error_description":"Refresh token expired"}',
    });
    expect(err.message).toBe('Token refresh failed: HTTP 400 invalid_grant (Refresh token expired)');
  });

  it('formats message with code only (no description) as "no description provided"', () => {
    const err = new CcamOAuthError('Token refresh failed', {
      status: 400,
      resource: 'auth',
      operation: 'refresh_token',
      rawBody: '{"error":"invalid_grant"}',
    });
    expect(err.message).toBe('Token refresh failed: HTTP 400 invalid_grant (no description provided)');
  });

  it('formats message with neither code nor description', () => {
    const err = new CcamOAuthError('Token refresh failed', {
      status: 500,
      resource: 'auth',
      operation: 'refresh_token',
      rawBody: 'internal server error',
    });
    expect(err.message).toBe('Token refresh failed: HTTP 500');
  });
});

describe('CcamOAuthError.rawBody non-enumerability', () => {
  it('rawBody is accessible via property access but not serialized by JSON.stringify', () => {
    const rawBody = '{"error":"invalid_grant","refresh_token":"LEAK_ME"}';
    const err = new CcamOAuthError('Token refresh failed', {
      status: 400,
      resource: 'auth',
      operation: 'refresh_token',
      rawBody,
    });

    expect(err.rawBody).toBe(rawBody);

    const json = JSON.parse(JSON.stringify(err)) as Record<string, unknown>;
    expect(json).not.toHaveProperty('rawBody');
  });
});
