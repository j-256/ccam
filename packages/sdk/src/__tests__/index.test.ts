import { describe, it, expect } from 'vitest';
import {
  VERSION,
  createPkcePair,
  exchangeAuthorizationCode,
  buildAuthorizeUrl,
  generateState,
  CcamRefreshFailedError,
  TokenManager,
} from '../index.js';

describe('SDK entry point', () => {
  it('exports a version string', () => {
    expect(VERSION).toBe('0.1.0');
  });
});

describe('SDK public exports', () => {
  it('exposes the new auth helpers', () => {
    expect(createPkcePair).toBeDefined();
    expect(exchangeAuthorizationCode).toBeDefined();
    expect(buildAuthorizeUrl).toBeDefined();
    expect(generateState).toBeDefined();
    expect(CcamRefreshFailedError).toBeDefined();
    expect(TokenManager).toBeDefined();
  });
});
