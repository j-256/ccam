import { describe, it, expect, vi } from 'vitest';
import http from 'node:http';
import { runLoopbackLogin } from '../../auth/browser-login.js';

describe('runLoopbackLogin', () => {
  it('captures the code from the redirect URL and returns it', async () => {
    const openSpy = vi.fn();
    const donePromise = runLoopbackLogin({
      authorizeUrl: 'https://am.example/authorize?x=1',
      expectedState: 'xyz',
      port: 0,
      open: openSpy,
    });
    const actualPort = await (donePromise as unknown as { port: Promise<number> }).port;
    await new Promise<void>((resolve, reject) => {
      const req = http.get(`http://127.0.0.1:${actualPort}/callback?code=the-code&state=xyz`, (res) => {
        res.resume();
        res.on('end', () => resolve());
      });
      req.on('error', reject);
    });
    const result = await donePromise;
    expect(result.code).toBe('the-code');
    expect(openSpy).toHaveBeenCalledWith('https://am.example/authorize?x=1');
  });

  it('rejects when state does not match', async () => {
    const donePromise = runLoopbackLogin({
      authorizeUrl: 'https://am.example/authorize',
      expectedState: 'good',
      port: 0,
      open: () => {},
    });
    const actualPort = await (donePromise as unknown as { port: Promise<number> }).port;
    const responsePromise = new Promise<void>((resolve, reject) => {
      const req = http.get(`http://127.0.0.1:${actualPort}/callback?code=c&state=bad`, (res) => {
        res.resume();
        res.on('end', () => resolve());
      });
      req.on('error', reject);
    });
    await Promise.all([
      expect(donePromise).rejects.toThrow(/state mismatch/i),
      responsePromise,
    ]);
  });

  it('rejects when AM redirects with error=access_denied', async () => {
    const donePromise = runLoopbackLogin({
      authorizeUrl: 'https://am.example/authorize',
      expectedState: 'xyz',
      port: 0,
      open: () => {},
    });
    const actualPort = await (donePromise as unknown as { port: Promise<number> }).port;
    const responsePromise = new Promise<void>((resolve, reject) => {
      const req = http.get(`http://127.0.0.1:${actualPort}/callback?error=access_denied&state=xyz`, (res) => {
        res.resume();
        res.on('end', () => resolve());
      });
      req.on('error', reject);
    });
    await Promise.all([
      expect(donePromise).rejects.toThrow(/cancel/i),
      responsePromise,
    ]);
  });
});
