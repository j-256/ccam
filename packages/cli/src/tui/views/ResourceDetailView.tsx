import { useState, useCallback, useMemo } from 'react';
import { Box, Text, useInput } from 'ink';
import Spinner from 'ink-spinner';
import { useClient } from '../context/client.js';
import { useNav } from '../context/navigation.js';
import { useResourceDetail } from '../hooks/use-resource-detail.js';
import { TabBar } from '../components/TabBar.js';
import { InfoTab } from '../components/InfoTab.js';
import { SubResourceTab } from '../components/SubResourceTab.js';
import { AuditTab } from '../components/AuditTab.js';
import { FooterBar } from '../components/FooterBar.js';
import type { AuditTabConfig, ResourceConfig, TabConfig } from '../types.js';
import type { AuditLogRecord, ContentResponse } from '@ccam/sdk';

export interface ResourceDetailViewProps {
  config: ResourceConfig;
  id: string;
}

const INFO_TAB_KEY = '__info__';

export function ResourceDetailView({ config, id }: ResourceDetailViewProps) {
  const client = useClient();
  const nav = useNav();

  // Fetch the resource detail
  const fetchFn = useCallback(
    () => config.detailFn(client, id),
    [client, config, id],
  );
  const { data, loading, error, retry } = useResourceDetail(fetchFn);

  // Tab state
  const allTabs = useMemo(() => {
    const tabs = [{ key: INFO_TAB_KEY, label: 'Info' }];
    for (const tab of config.tabs) {
      tabs.push({ key: tab.key, label: tab.label });
    }
    return tabs;
  }, [config.tabs]);

  const [activeTabKey, setActiveTabKey] = useState(INFO_TAB_KEY);
  const [activatedTabs, setActivatedTabs] = useState<Set<string>>(
    () => new Set([INFO_TAB_KEY]),
  );

  const activeTabIndex = allTabs.findIndex((t) => t.key === activeTabKey);

  const switchToTab = useCallback(
    (index: number) => {
      if (index < 0 || index >= allTabs.length) return;
      const tab = allTabs[index];
      setActiveTabKey(tab.key);
      setActivatedTabs((prev) => {
        if (prev.has(tab.key)) return prev;
        const next = new Set(prev);
        next.add(tab.key);
        return next;
      });
    },
    [allTabs],
  );

  useInput((input, key) => {
    if (loading) return;

    // Error state: only retry and back
    if (error) {
      if (input === 'r') retry();
      if (key.escape) nav.pop();
      return;
    }

    // Back
    if (key.escape || input === 'q') {
      nav.pop();
      return;
    }

    // Tab switching: Tab / Shift-Tab
    if (key.tab) {
      if (key.shift) {
        // Shift-Tab: previous tab
        const prevIndex = activeTabIndex <= 0 ? allTabs.length - 1 : activeTabIndex - 1;
        switchToTab(prevIndex);
      } else {
        // Tab: next tab
        const nextIndex = (activeTabIndex + 1) % allTabs.length;
        switchToTab(nextIndex);
      }
      return;
    }

    // Number keys 1-9: jump to tab
    const num = parseInt(input, 10);
    if (num >= 1 && num <= 9 && num <= allTabs.length) {
      switchToTab(num - 1);
      return;
    }
  });

  // -- Error state --
  if (error) {
    return (
      <Box flexDirection="column">
        <Text color="red">Error: {error.message}</Text>
        <Text dimColor>r:retry Esc:back</Text>
      </Box>
    );
  }

  // -- Loading state --
  if (loading && !data) {
    return (
      <Box>
        <Text color="cyan">
          <Spinner type="dots" />
        </Text>
        <Text> Loading {config.displayName}...</Text>
      </Box>
    );
  }

  if (!data) return null;

  // Find the active tab config (for non-info tabs)
  const activeTab = config.tabs.find((t) => t.key === activeTabKey);

  // Footer hints per active tab type
  const footerHints = buildFooterHints(activeTabKey, activeTab);

  return (
    <Box flexDirection="column">
      {/* Tab bar */}
      <TabBar tabs={allTabs} activeKey={activeTabKey} />

      {/* Tab content */}
      <Box flexDirection="column" borderStyle="single" borderColor="gray">
        {activeTabKey === INFO_TAB_KEY && (
          <InfoTab fields={config.fields} data={data} crossLinks={config.crossLinks} />
        )}
        {activeTab && activeTab.type !== 'audit' && activatedTabs.has(activeTab.key) && (
          <SubResourceTab tab={activeTab} parentId={id} />
        )}
        {activeTab && activeTab.type === 'audit' && activatedTabs.has(activeTab.key) && (
          <AuditTabWrapper tab={activeTab} id={id} />
        )}
      </Box>

      {/* Footer */}
      <FooterBar hints={footerHints} />
    </Box>
  );
}

// Wrapper to adapt TabConfig.fetchFn to AuditTab's expected fetchFn signature.
// The element-type cast (Record<string, unknown> -> AuditLogRecord) is needed
// because the tab-level fetchFn is typed against the generic record shape that
// all tab tables use.
function AuditTabWrapper({ tab, id }: { tab: AuditTabConfig; id: string }) {
  const client = useClient();
  const fetchFn = useCallback(
    (querySize?: number) =>
      tab.fetchFn(client, id, querySize) as unknown as Promise<ContentResponse<AuditLogRecord>>,
    [client, id, tab],
  );
  return <AuditTab fetchFn={fetchFn} columns={tab.columns} />;
}

function buildFooterHints(activeTabKey: string, activeTab?: TabConfig): string {
  const parts: string[] = ['[Tab:next]'];

  if (activeTabKey === INFO_TAB_KEY) {
    parts.push('[j/k:nav]', '[Enter:link]', '[Esc:back]');
  } else if (activeTab?.type === 'audit') {
    parts.push('[j/k:scroll]', '[m:more]', '[Esc:back]');
  } else {
    // sub-resource tab
    parts.push('[j/k:nav]');
    if (activeTab?.crossLinkTo) parts.push('[Enter:open]');
    parts.push('[Esc:back]');
  }

  return parts.join(' ');
}
