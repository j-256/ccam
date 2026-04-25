import http from 'node:http';
import type { Socket } from 'node:net';

export interface LoopbackLoginOptions {
  authorizeUrl: string;
  expectedState: string;
  port: number;
  open: (url: string) => void | Promise<void>;
}

export interface LoopbackLoginResult {
  code: string;
}

export type LoopbackPromise = Promise<LoopbackLoginResult> & { port: Promise<number> };

export function runLoopbackLogin(options: LoopbackLoginOptions): LoopbackPromise {
  let portResolve: (p: number) => void;
  let portReject: (err: Error) => void;
  const portPromise = new Promise<number>((resolve, reject) => {
    portResolve = resolve;
    portReject = reject;
  });

  const done = new Promise<LoopbackLoginResult>((resolve, reject) => {
    const sockets = new Set<Socket>();
    const shutdown = () => {
      for (const sock of sockets) sock.destroy();
      server.close();
    };
    const server = http.createServer((req, res) => {
      res.setHeader('Connection', 'close');
      const url = new URL(req.url ?? '/', 'http://127.0.0.1');
      if (url.pathname !== '/callback') {
        res.statusCode = 404;
        res.end();
        return;
      }
      const err = url.searchParams.get('error');
      const state = url.searchParams.get('state');
      const code = url.searchParams.get('code');
      if (err === 'access_denied') {
        res.statusCode = 200;
        res.end('Login was cancelled. You can close this tab.');
        shutdown();
        reject(new Error('Login was cancelled.'));
        return;
      }
      if (state !== options.expectedState) {
        res.statusCode = 400;
        res.end('State mismatch. You can close this tab.');
        shutdown();
        reject(new Error('Login failed: state mismatch.'));
        return;
      }
      if (!code) {
        res.statusCode = 400;
        res.end('Missing authorization code.');
        shutdown();
        reject(new Error('Login failed: no code in redirect.'));
        return;
      }
      res.statusCode = 200;
      res.end('Authorization received. Return to the terminal to finish login. You can close this tab.');
      shutdown();
      resolve({ code });
    });

    server.on('connection', (sock) => {
      sockets.add(sock);
      sock.once('close', () => sockets.delete(sock));
    });

    server.on('error', (err) => {
      portReject(err);
      reject(err);
    });

    server.listen(options.port, '127.0.0.1', () => {
      const addr = server.address();
      if (addr && typeof addr === 'object') {
        portResolve(addr.port);
        Promise.resolve(options.open(options.authorizeUrl)).catch(reject);
      }
    });
  });

  Object.assign(done, { port: portPromise });
  return done as LoopbackPromise;
}
