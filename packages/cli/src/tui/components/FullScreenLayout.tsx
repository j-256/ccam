import { Box } from 'ink';
import { useTerminalSize } from '../context/terminal-size.js';
import { HeaderBar } from './HeaderBar.js';
import type { HeaderBarProps } from './HeaderBar.js';

export interface FullScreenLayoutProps extends HeaderBarProps {
  children: React.ReactNode;
}

export function FullScreenLayout({
  children,
  host,
}: FullScreenLayoutProps) {
  const { rows } = useTerminalSize();
  // Header: 1 line top border + 1 line breadcrumb + 1 line bottom border = 3
  const contentHeight = rows - 3;

  return (
    <Box flexDirection="column" height={rows}>
      <HeaderBar host={host} />
      <Box height={contentHeight}>{children}</Box>
    </Box>
  );
}
