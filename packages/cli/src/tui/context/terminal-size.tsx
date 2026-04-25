import { createContext, useContext, useState, useEffect } from 'react';

export interface TerminalSize {
  cols: number;
  rows: number;
}

const DEFAULT_SIZE: TerminalSize = { cols: 80, rows: 24 };

function getSize(): TerminalSize {
  const cols = process.stdout.columns;
  const rows = process.stdout.rows;
  if (cols && rows) return { cols, rows };
  return DEFAULT_SIZE;
}

const TerminalSizeContext = createContext<TerminalSize>(DEFAULT_SIZE);

export function TerminalSizeProvider({ children }: { children: React.ReactNode }) {
  const [size, setSize] = useState<TerminalSize>(getSize);

  useEffect(() => {
    const onResize = () => setSize(getSize());
    process.stdout.on('resize', onResize);
    return () => {
      process.stdout.off('resize', onResize);
    };
  }, []);

  return <TerminalSizeContext.Provider value={size}>{children}</TerminalSizeContext.Provider>;
}

export function useTerminalSize(): TerminalSize {
  return useContext(TerminalSizeContext);
}
