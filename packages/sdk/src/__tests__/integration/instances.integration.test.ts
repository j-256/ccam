import { describe, it, expect, beforeAll } from 'vitest';
import { ENV } from './env.js';
import { createClient } from './helpers.js';
import { CcamError, type CcamClient } from '../../index.js';

describe.skipIf(!ENV)('instances (integration)', () => {
  let client: CcamClient;

  beforeAll(() => {
    client = createClient(ENV!);
  });

  describe('validateFilter', () => {
    it('accepts a known-good tenant filter', async () => {
      // A wildcard-realm sandbox filter is the least-privileged valid shape
      await expect(
        client.instances.validateFilter(`${ENV!.realmId}_sbx`),
      ).resolves.toBeUndefined();
    });

    it('rejects an obviously invalid filter with a 400', async () => {
      try {
        await client.instances.validateFilter('this is not a valid filter');
        expect.fail('Expected CcamError');
      } catch (err) {
        expect(err).toBeInstanceOf(CcamError);
        expect((err as CcamError).status).toBe(400);
      }
    });
  });
});
