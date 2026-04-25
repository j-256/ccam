import chalk from 'chalk';
import { CcamError, CcamAuthError, CcamNotFoundError } from '@ccam/sdk';

export function handleError(err: unknown): never {
  if (err instanceof CcamAuthError) {
    process.stderr.write(chalk.red(`Error: ${err.message}`) + '\n');
    process.stderr.write(chalk.yellow('Run `ccam auth login` to re-authenticate.') + '\n');
    process.exit(1);
  }

  if (err instanceof CcamNotFoundError) {
    process.stderr.write(chalk.red(`Error: ${err.message}`) + '\n');
    process.exit(1);
  }

  if (err instanceof CcamError) {
    let message = chalk.red(`Error: ${err.message}`);
    if (err.code) {
      message += chalk.dim(` (${err.code})`);
    }
    process.stderr.write(message + '\n');
    process.exit(1);
  }

  if (err instanceof Error) {
    process.stderr.write(chalk.red(`Error: ${err.message}`) + '\n');
    process.exit(1);
  }

  process.stderr.write(chalk.red(`Error: ${String(err)}`) + '\n');
  process.exit(1);
}
