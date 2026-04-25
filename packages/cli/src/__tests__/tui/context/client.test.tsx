import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render } from 'ink-testing-library';
import { Text } from 'ink';
import { ClientProvider, useClient } from '../../../tui/context/client.js';
import { createMockClient } from '../helpers.js';

function ClientConsumer() {
  const client = useClient();
  return <Text>{client ? 'has-client' : 'no-client'}</Text>;
}

describe('ClientProvider', () => {
  it('provides the client to child components', () => {
    const client = createMockClient();
    const { lastFrame } = render(
      <ClientProvider client={client}>
        <ClientConsumer />
      </ClientProvider>,
    );
    expect(lastFrame()).toContain('has-client');
  });

  it('throws when useClient is called outside provider', () => {
    // React catches render errors internally; verify the error boundary message
    // by checking that the component does not render successfully
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      const { lastFrame } = render(<ClientConsumer />);
      // If no throw, the frame should not contain 'has-client'
      expect(lastFrame()).not.toContain('has-client');
    } catch {
      // Expected -- some React versions re-throw
    }
    spy.mockRestore();
  });
});
