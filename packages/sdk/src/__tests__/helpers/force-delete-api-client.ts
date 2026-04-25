import type { CcamClient } from '../../index.js';

/**
 * Force-delete an API client using the deleteImmediately query parameter.
 * Test-only; not part of the public SDK surface. Requires a permission that
 * no customer role holds, so this is only useful in environments where the
 * integration test client has been granted it explicitly.
 */
export async function forceDeleteApiClient(client: CcamClient, id: string): Promise<void> {
  await client.http.delete(
    `/dw/rest/v1/apiclients/${id}`,
    { deleteImmediately: true },
    { resource: 'apiClients', operation: 'forceDelete' },
  );
}
