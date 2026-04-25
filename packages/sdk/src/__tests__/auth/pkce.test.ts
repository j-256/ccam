import { describe, it, expect } from 'vitest';
import { createPkcePair } from '../../auth/pkce.js';
import { createHash } from 'node:crypto';

describe('createPkcePair', () => {
  it('returns a verifier with only RFC 7636 unreserved characters', () => {
    const { verifier } = createPkcePair();
    expect(verifier).toMatch(/^[A-Za-z0-9\-._~]+$/);
  });

  it('returns a verifier between 43 and 128 characters', () => {
    const { verifier } = createPkcePair();
    expect(verifier.length).toBeGreaterThanOrEqual(43);
    expect(verifier.length).toBeLessThanOrEqual(128);
  });

  it('challenge equals base64url(sha256(verifier))', () => {
    const { verifier, challenge } = createPkcePair();
    const expected = createHash('sha256').update(verifier).digest('base64url');
    expect(challenge).toBe(expected);
  });

  it('produces unique pairs on successive calls', () => {
    const a = createPkcePair();
    const b = createPkcePair();
    expect(a.verifier).not.toBe(b.verifier);
  });
});
