import readline from 'node:readline';
import type { Readable, Writable } from 'node:stream';

export interface PromptOptions {
  message: string;
  defaultValue?: string;
  input?: NodeJS.ReadableStream;
  output?: NodeJS.WritableStream;
}

export async function promptText(opts: PromptOptions): Promise<string> {
  const input = (opts.input ?? process.stdin) as Readable;
  const output = (opts.output ?? process.stdout) as Writable;
  const rl = readline.createInterface({ input, output });
  const suffix = opts.defaultValue ? ` [${opts.defaultValue}]` : '';
  try {
    const answer = await new Promise<string>((resolve) => {
      rl.question(`${opts.message}${suffix} `, (input) => resolve(input));
    });
    return answer.trim() || opts.defaultValue || '';
  } finally {
    rl.close();
  }
}

export async function promptPassword(opts: PromptOptions): Promise<string> {
  const input = (opts.input ?? process.stdin) as Readable;
  const output = (opts.output ?? process.stdout) as Writable;
  output.write(`${opts.message} `);

  const tty = input as Readable & {
    isTTY?: boolean;
    isRaw?: boolean;
    setRawMode?: (mode: boolean) => void;
  };
  const isTTY = tty.isTTY === true;
  const wasRaw = tty.isRaw === true;

  return new Promise<string>((resolve, reject) => {
    let buf = '';
    const cleanup = () => {
      input.removeListener('data', onData);
      input.removeListener('error', onError);
      if (isTTY && tty.setRawMode) {
        tty.setRawMode(wasRaw);
      }
      input.pause();
    };
    const onData = (chunk: Buffer | string) => {
      const text = chunk.toString('utf8');
      for (let i = 0; i < text.length; i++) {
        const ch = text[i];
        if (ch === '\n' || ch === '\r') {
          const rest = text.slice(i + 1);
          cleanup();
          output.write('\n');
          if (rest.length > 0 && typeof (input as { unshift?: (c: Buffer) => void }).unshift === 'function') {
            (input as unknown as { unshift: (c: Buffer) => void }).unshift(Buffer.from(rest, 'utf8'));
          }
          resolve(buf);
          return;
        }
        if (ch === '\u0003') {
          cleanup();
          output.write('\n');
          reject(new Error('Cancelled'));
          return;
        }
        if (ch === '\u007f' || ch === '\b') {
          buf = buf.slice(0, -1);
          continue;
        }
        buf += ch;
      }
    };
    const onError = (err: Error) => { cleanup(); reject(err); };

    input.on('data', onData);
    input.on('error', onError);

    if (isTTY && tty.setRawMode) {
      tty.setRawMode(true);
    }
    input.resume();
  });
}
