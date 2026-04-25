import { Box, Text } from 'ink';

export interface TabDef {
  key: string;
  label: string;
  count?: number;
}

export interface TabBarProps {
  tabs: TabDef[];
  activeKey: string;
}

export function TabBar({ tabs, activeKey }: TabBarProps) {
  return (
    <Box gap={1}>
      {tabs.map((tab) => {
        const isActive = tab.key === activeKey;
        const label = tab.count != null ? `${tab.label} (${tab.count})` : tab.label;
        if (isActive) {
          return (
            <Text key={tab.key} bold underline color="cyan">
              {label}
            </Text>
          );
        }
        return (
          <Text key={tab.key}>
            {label}
          </Text>
        );
      })}
    </Box>
  );
}
