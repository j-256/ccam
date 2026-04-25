import { describe, it, expect } from 'vitest';
import { extractCodeFromInput } from '../../auth/manual-login.js';

describe('extractCodeFromInput', () => {
  it('accepts a bare code', () => {
    expect(extractCodeFromInput('abc-123', 'xyz')).toBe('abc-123');
  });

  it('accepts a full redirect URL with matching state', () => {
    const url = 'http://127.0.0.1:65535/callback?code=c1&state=xyz';
    expect(extractCodeFromInput(url, 'xyz')).toBe('c1');
  });

  it('throws when the URL state does not match', () => {
    const url = 'http://127.0.0.1:65535/callback?code=c1&state=bad';
    expect(() => extractCodeFromInput(url, 'xyz')).toThrow(/state mismatch/i);
  });

  it('throws when the URL carries error=access_denied', () => {
    const url = 'http://127.0.0.1:65535/callback?error=access_denied&state=xyz';
    expect(() => extractCodeFromInput(url, 'xyz')).toThrow(/cancel/i);
  });

  it('throws on empty input', () => {
    expect(() => extractCodeFromInput('', 'xyz')).toThrow(/empty/i);
  });
});
