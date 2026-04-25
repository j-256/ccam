import { describe, it, expect } from 'vitest';
import { CcamError, CcamAuthError, CcamNotFoundError, CcamRefreshFailedError } from '../errors.js';

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
