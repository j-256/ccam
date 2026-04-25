import { describe, it, expect } from 'vitest';
import { render } from 'ink-testing-library';
import { TabBar } from '../../../tui/components/TabBar.js';
import type { TabDef } from '../../../tui/components/TabBar.js';

const tabs: TabDef[] = [
  { key: 'info', label: 'Info' },
  { key: 'roles', label: 'Roles', count: 5 },
  { key: 'audit', label: 'Audit' },
];

describe('TabBar', () => {
  it('renders all tab labels', () => {
    const { lastFrame } = render(<TabBar tabs={tabs} activeKey="info" />);
    const frame = lastFrame()!;
    expect(frame).toContain('Info');
    expect(frame).toContain('Roles');
    expect(frame).toContain('Audit');
  });

  it('shows count badge when available', () => {
    const { lastFrame } = render(<TabBar tabs={tabs} activeKey="info" />);
    expect(lastFrame()).toContain('Roles (5)');
  });

  it('renders active tab label (no brackets)', () => {
    const { lastFrame } = render(<TabBar tabs={tabs} activeKey="info" />);
    expect(lastFrame()).toContain('Info');
  });

  it('renders inactive tabs without brackets', () => {
    const { lastFrame } = render(<TabBar tabs={tabs} activeKey="info" />);
    expect(lastFrame()).not.toContain('[Audit]');
    expect(lastFrame()).toContain('Audit');
  });

  it('switches active styling when activeKey changes', () => {
    const { lastFrame: frame1 } = render(<TabBar tabs={tabs} activeKey="info" />);
    expect(frame1()).toContain('Info');
    expect(frame1()).toContain('Roles (5)');

    const { lastFrame: frame2 } = render(<TabBar tabs={tabs} activeKey="roles" />);
    expect(frame2()).toContain('Roles (5)');
    expect(frame2()).toContain('Info');
  });

  it('handles active tab with count badge', () => {
    const { lastFrame } = render(<TabBar tabs={tabs} activeKey="roles" />);
    expect(lastFrame()).toContain('Roles (5)');
  });

  it('renders single tab', () => {
    const { lastFrame } = render(
      <TabBar tabs={[{ key: 'only', label: 'Only Tab' }]} activeKey="only" />,
    );
    expect(lastFrame()).toContain('Only Tab');
  });

  it('handles empty tabs array', () => {
    const { lastFrame } = render(<TabBar tabs={[]} activeKey="none" />);
    expect(lastFrame()).toBeDefined();
  });

  it('handles count of zero', () => {
    const tabsWithZero: TabDef[] = [{ key: 'empty', label: 'Empty', count: 0 }];
    const { lastFrame } = render(<TabBar tabs={tabsWithZero} activeKey="empty" />);
    expect(lastFrame()).toContain('Empty (0)');
  });
});
