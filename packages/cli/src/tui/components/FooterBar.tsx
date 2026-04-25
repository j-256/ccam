import { Box, Text } from 'ink';
import Spinner from 'ink-spinner';

export interface FooterBarProps {
  hints?: string;
  pageInfo?: string;
  loading?: boolean;
  sortLabel?: string;
  statsLabel?: string;
}

/**
 * Format hint strings in bracket notation.
 * Input format: "[j/k:nav] [Enter:open] [Esc:back]"
 * Each segment: "[key:description]"
 */
export function HintText({ hints }: { hints: string }) {
  const segments = hints.match(/\[[^\]]+\]/g) || [];
  return (
    <Text>
      {segments.map((seg, i) => {
        // Strip brackets, split on first colon
        const inner = seg.slice(1, -1);
        const colonIdx = inner.indexOf(':');
        const key = colonIdx > 0 ? inner.slice(0, colonIdx) : inner;
        const desc = colonIdx > 0 ? inner.slice(colonIdx) : '';
        return (
          <Text key={i}>
            {i > 0 && <Text> </Text>}
            <Text dimColor>[</Text>
            <Text bold color="cyan">{key}</Text>
            <Text dimColor>{desc}]</Text>
          </Text>
        );
      })}
    </Text>
  );
}

export function FooterBar({ hints, pageInfo, loading, sortLabel, statsLabel }: FooterBarProps) {
  return (
    <Box flexDirection="column" borderStyle="single" borderColor="gray">
      {/* Line 1: sort info + stats (only render if there's content) */}
      {(loading || sortLabel || statsLabel) && (
        <Box justifyContent="space-between">
          <Box>
            {loading && (
              <Text color="cyan">
                <Spinner type="dots" />{' '}
              </Text>
            )}
            {sortLabel && <Text dimColor>{sortLabel}</Text>}
          </Box>
          {statsLabel && <Text dimColor>{statsLabel}</Text>}
        </Box>
      )}
      {/* Line 2: hints + page info */}
      <Box justifyContent="space-between">
        {hints && <HintText hints={hints} />}
        {pageInfo && <Text dimColor>{pageInfo}</Text>}
      </Box>
    </Box>
  );
}
