import { Box, Text } from 'ink';
import { useNav } from '../context/navigation.js';

export interface HeaderBarProps {
  host?: string;
}

export function HeaderBar({ host }: HeaderBarProps) {
  const { breadcrumbs } = useNav();

  return (
    <Box borderStyle="single" borderColor="gray" justifyContent="space-between">
      <Text>
        <Text color="cyan" bold>ccam</Text>
        {breadcrumbs.map((crumb, i) => (
          <Text key={i}>
            <Text dimColor> {'>'} </Text>
            {i === breadcrumbs.length - 1
              ? <Text bold color="white">{crumb}</Text>
              : <Text>{crumb}</Text>}
          </Text>
        ))}
      </Text>
      {host && <Text dimColor>{host}</Text>}
    </Box>
  );
}
