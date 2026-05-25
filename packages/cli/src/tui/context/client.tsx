import { createContext, useContext } from 'react';
import type { CcamClient } from 'ccam-sdk';

const ClientContext = createContext<CcamClient | null>(null);

export function ClientProvider({
  client,
  children,
}: {
  client: CcamClient;
  children: React.ReactNode;
}) {
  return <ClientContext.Provider value={client}>{children}</ClientContext.Provider>;
}

export function useClient(): CcamClient {
  const client = useContext(ClientContext);
  if (!client) {
    throw new Error('useClient must be used within a ClientProvider');
  }
  return client;
}
