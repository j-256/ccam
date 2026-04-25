export function extractCodeFromInput(input: string, expectedState: string): string {
  const trimmed = input.trim();
  if (!trimmed) throw new Error('Pasted value was empty.');

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return trimmed;
  }

  const err = url.searchParams.get('error');
  if (err === 'access_denied') throw new Error('Login was cancelled.');
  if (err) throw new Error(`AM returned an error: ${err}`);

  const state = url.searchParams.get('state');
  if (state !== expectedState) throw new Error('Login failed: state mismatch.');

  const code = url.searchParams.get('code');
  if (!code) throw new Error('No `code` parameter in the pasted URL.');
  return code;
}
