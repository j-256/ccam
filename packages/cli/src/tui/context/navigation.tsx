import { createContext, useContext, useState, useCallback } from 'react';
import { createNavStack, pushNav, popNav } from '../navigation.js';
import type { ViewEntry } from '../types.js';

export interface NavContext {
  current: ViewEntry;
  breadcrumbs: string[];
  canGoBack: boolean;
  push: (entry: ViewEntry) => void;
  pop: () => void;
}

const NavigationContext = createContext<NavContext | null>(null);

export function NavigationProvider({
  initial,
  children,
}: {
  initial: ViewEntry;
  children: React.ReactNode;
}) {
  const [state, setState] = useState(() => createNavStack(initial));

  const push = useCallback(
    (entry: ViewEntry) => setState((s) => pushNav(s, entry)),
    [],
  );
  const pop = useCallback(() => setState((s) => popNav(s)), []);

  const value: NavContext = {
    current: state.current,
    breadcrumbs: state.breadcrumbs,
    canGoBack: state.canGoBack,
    push,
    pop,
  };

  return <NavigationContext.Provider value={value}>{children}</NavigationContext.Provider>;
}

export function useNav(): NavContext {
  const ctx = useContext(NavigationContext);
  if (!ctx) {
    throw new Error('useNav must be used within a NavigationProvider');
  }
  return ctx;
}
