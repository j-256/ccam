import { useApp, useInput } from 'ink';
import type { CcamClient } from 'ccam-sdk';
import { ClientProvider } from './context/client.js';
import { TerminalSizeProvider } from './context/terminal-size.js';
import { NavigationProvider, useNav } from './context/navigation.js';
import { FullScreenLayout } from './components/FullScreenLayout.js';
import { ViewRouter } from './views/ViewRouter.js';

export interface AppProps {
  client: CcamClient;
  host?: string;
}

function AppInner({ host }: { host?: string }) {
  const nav = useNav();
  const { exit } = useApp();

  useInput((input, key) => {
    if (input === 'q' && nav.current.view === 'resource-picker') {
      exit();
      return;
    }
    if (key.escape || input === 'q') {
      if (nav.canGoBack) {
        nav.pop();
      } else {
        exit();
      }
    }
  });

  return (
    <FullScreenLayout host={host}>
      <ViewRouter />
    </FullScreenLayout>
  );
}

export function App({ client, host }: AppProps) {
  return (
    <ClientProvider client={client}>
      <TerminalSizeProvider>
        <NavigationProvider initial={{ view: 'resource-picker', label: 'Home' }}>
          <AppInner host={host} />
        </NavigationProvider>
      </TerminalSizeProvider>
    </ClientProvider>
  );
}
