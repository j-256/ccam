import { useState, useMemo, type ReactNode } from 'react';
import { Box, Text, useInput } from 'ink';
import { useNav } from '../context/navigation.js';
import type { FieldDef, CrossLinkDef } from '../types.js';
import { formatCell } from './Table.js';

export interface InfoTabProps {
  fields: FieldDef[];
  data: Record<string, unknown>;
  crossLinks: CrossLinkDef[];
}

const LABEL_WIDTH = 24;

export function InfoTab({ fields, data, crossLinks }: InfoTabProps) {
  const nav = useNav();

  // Build list of navigable cross-link indices
  const crossLinkIndices = useMemo(() => {
    const indices: number[] = [];
    for (let i = 0; i < fields.length; i++) {
      const field = fields[i];
      if (field.crossLink || crossLinks.some((cl) => cl.field === field.key)) {
        indices.push(i);
      }
    }
    return indices;
  }, [fields, crossLinks]);

  const [highlightPos, setHighlightPos] = useState(0);

  const highlightIndex = crossLinkIndices.length > 0
    ? crossLinkIndices[highlightPos]
    : -1;

  useInput((input, key) => {
    if (crossLinkIndices.length === 0) return;

    if (input === 'j' || key.downArrow) {
      setHighlightPos((i) => Math.min(i + 1, crossLinkIndices.length - 1));
    }
    if (input === 'k' || key.upArrow) {
      setHighlightPos((i) => Math.max(i - 1, 0));
    }

    if (key.return) {
      const fieldIdx = crossLinkIndices[highlightPos];
      if (fieldIdx == null) return;
      const field = fields[fieldIdx];
      const cl = field.crossLink || crossLinks.find((c) => c.field === field.key);
      if (!cl) return;
      const targetId = String(data[cl.field] ?? '');
      if (targetId) {
        nav.push({
          view: cl.targetView,
          label: String(data[cl.field] ?? targetId),
          params: { id: targetId },
        });
      }
    }
  });

  const hasCrossLinks = crossLinkIndices.length > 0;

  const MAX_VALUE_WIDTH = 80;

  const rows: ReactNode[] = [];
  let prevGroup: string | undefined;

  for (let i = 0; i < fields.length; i++) {
    const field = fields[i];

    // Insert blank line when group changes (skip before the very first field)
    if (field.group && field.group !== prevGroup && i > 0) {
      rows.push(<Box key={`sep-${i}`} height={1} />);
    }
    prevGroup = field.group;

    const value = data[field.key];
    const raw = field.format ? field.format(value) : undefined;
    const formatted = raw ?? formatCell(value, MAX_VALUE_WIDTH);
    const isCrossLinked = i === highlightIndex && hasCrossLinks;

    rows.push(
      <Box key={field.key}>
        {hasCrossLinks && (
          <Box width={2}>
            <Text color="yellow" bold>{isCrossLinked ? '\u25b8 ' : '  '}</Text>
          </Box>
        )}
        <Box width={LABEL_WIDTH}>
          <Text dimColor>{field.label}</Text>
        </Box>
        <Text bold={isCrossLinked} color={isCrossLinked ? 'cyan' : undefined}>
          {formatted}
        </Text>
      </Box>,
    );
  }

  return (
    <Box flexDirection="column">
      {rows}
    </Box>
  );
}
