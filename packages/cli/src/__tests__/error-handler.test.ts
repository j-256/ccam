import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { handleError } from '../error-handler.js';
import { CcamError, CcamAuthError, CcamNotFoundError } from 'ccam-sdk';

describe('handleError', () => {
  let stderrSpy: ReturnType<typeof vi.spyOn>;
  let exitSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    stderrSpy = vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
    exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
  });

  afterEach(() => {
    vi.clearAllMocks();
    stderrSpy.mockRestore();
    exitSpy.mockRestore();
  });

  it('handles CcamAuthError with suggestion', () => {
    const error = new CcamAuthError('Authentication failed', {
      status: 401,
      resource: 'users',
      operation: 'list',
    });

    handleError(error);

    expect(stderrSpy).toHaveBeenCalled();
    const allOutput = stderrSpy.mock.calls.map((call: [string]) => call[0]).join('');
    expect(allOutput).toContain('Error: Authentication failed');
    expect(allOutput).toContain('Run `ccam auth login` to re-authenticate.');
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('handles CcamNotFoundError', () => {
    const error = new CcamNotFoundError('Resource not found', {
      status: 404,
      resource: 'users',
      operation: 'get',
    });

    handleError(error);

    expect(stderrSpy).toHaveBeenCalled();
    const allOutput = stderrSpy.mock.calls.map((call: [string]) => call[0]).join('');
    expect(allOutput).toContain('Error: Resource not found');
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('handles CcamError with code', () => {
    const error = new CcamError('Validation failed', {
      status: 400,
      code: 'INVALID_INPUT',
      resource: 'users',
      operation: 'create',
    });

    handleError(error);

    expect(stderrSpy).toHaveBeenCalled();
    const allOutput = stderrSpy.mock.calls.map((call: [string]) => call[0]).join('');
    expect(allOutput).toContain('Error: Validation failed');
    expect(allOutput).toContain('INVALID_INPUT');
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('handles CcamError without code', () => {
    const error = new CcamError('Something went wrong', {
      status: 500,
      resource: 'users',
      operation: 'list',
    });

    handleError(error);

    expect(stderrSpy).toHaveBeenCalled();
    const allOutput = stderrSpy.mock.calls.map((call: [string]) => call[0]).join('');
    expect(allOutput).toContain('Error: Something went wrong');
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('handles generic Error', () => {
    const error = new Error('Generic error message');

    handleError(error);

    expect(stderrSpy).toHaveBeenCalled();
    const allOutput = stderrSpy.mock.calls.map((call: [string]) => call[0]).join('');
    expect(allOutput).toContain('Error: Generic error message');
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('handles non-Error objects', () => {
    handleError('String error');

    expect(stderrSpy).toHaveBeenCalled();
    const allOutput = stderrSpy.mock.calls.map((call: [string]) => call[0]).join('');
    expect(allOutput).toContain('Error: String error');
    expect(exitSpy).toHaveBeenCalledWith(1);
  });
});
