import { describe, it, expect } from 'vitest';
import { render } from 'ink-testing-library';
import { Text } from 'ink';
import { InfoTab } from '../../../tui/components/InfoTab.js';
import { NavigationProvider, useNav } from '../../../tui/context/navigation.js';
import type { FieldDef, CrossLinkDef, ViewEntry } from '../../../tui/types.js';
import { delay } from '../helpers.js';

const home: ViewEntry = { view: 'resource-picker', label: 'Home' };

function NavState() {
  const { current } = useNav();
  return (
    <Text>
      nav:{current.view}:{current.label}
      {current.params ? `:${JSON.stringify(current.params)}` : ''}
    </Text>
  );
}

function renderInfoTab(
  fields: FieldDef[],
  data: Record<string, unknown>,
  crossLinks: CrossLinkDef[] = [],
) {
  return render(
    <NavigationProvider initial={home}>
      <InfoTab fields={fields} data={data} crossLinks={crossLinks} />
      <NavState />
    </NavigationProvider>,
  );
}

describe('InfoTab', () => {
  const basicFields: FieldDef[] = [
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'status', label: 'Status' },
  ];

  const basicData = {
    name: 'Alice',
    email: 'alice@example.com',
    status: 'ENABLED',
  };

  describe('field rendering', () => {
    it('renders all field labels', () => {
      const { lastFrame } = renderInfoTab(basicFields, basicData);
      const frame = lastFrame()!;
      expect(frame).toContain('Name');
      expect(frame).toContain('Email');
      expect(frame).toContain('Status');
    });

    it('renders all field values', () => {
      const { lastFrame } = renderInfoTab(basicFields, basicData);
      const frame = lastFrame()!;
      expect(frame).toContain('Alice');
      expect(frame).toContain('alice@example.com');
      expect(frame).toContain('ENABLED');
    });

    it('renders dash for null/undefined values', () => {
      const data = { name: null, email: undefined, status: 'OK' };
      const { lastFrame } = renderInfoTab(basicFields, data as Record<string, unknown>);
      expect(lastFrame()).toContain('-');
    });

    it('applies custom format function', () => {
      const fields: FieldDef[] = [
        { key: 'active', label: 'Active', format: (v) => (v === true ? 'Yes' : 'No') },
      ];
      const { lastFrame } = renderInfoTab(fields, { active: true });
      expect(lastFrame()).toContain('Yes');
    });

    it('truncates long values to 80 characters', () => {
      const longValue = 'A'.repeat(120);
      const fields: FieldDef[] = [{ key: 'key', label: 'Key' }];
      const { lastFrame } = renderInfoTab(fields, { key: longValue });
      const frame = lastFrame()!;
      // Should not contain the full 120-char string
      expect(frame).not.toContain(longValue);
      // Truncated to 77 chars + "..." = 80 total
      // Ink may wrap/pad, so strip whitespace and check the content
      const stripped = frame.replace(/\s+/g, '');
      expect(stripped).toContain('A'.repeat(77) + '...');
    });
  });

  describe('field grouping', () => {
    it('inserts blank line between groups', () => {
      const fields: FieldDef[] = [
        { key: 'name', label: 'Name', group: 'identity' },
        { key: 'id', label: 'ID', group: 'identity' },
        { key: 'active', label: 'Active', group: 'status' },
      ];
      const data = { name: 'Test', id: '123', active: 'yes' };
      const { lastFrame } = renderInfoTab(fields, data);
      const frame = lastFrame()!;
      const lines = frame.split('\n');
      // Find the line with "ID" and the line with "Active"
      const idLineIdx = lines.findIndex((l) => l.includes('ID') && l.includes('123'));
      const activeLineIdx = lines.findIndex((l) => l.includes('Active'));
      // There should be a blank separator line between them
      expect(activeLineIdx).toBeGreaterThan(idLineIdx + 1);
    });

    it('does not insert blank line before the first field', () => {
      const fields: FieldDef[] = [
        { key: 'name', label: 'Name', group: 'identity' },
        { key: 'id', label: 'ID', group: 'identity' },
      ];
      const data = { name: 'Test', id: '123' };
      const { lastFrame } = renderInfoTab(fields, data);
      const frame = lastFrame()!;
      const lines = frame.split('\n');
      // First line should contain the Name field, not be blank
      expect(lines[0]).toContain('Name');
    });

    it('works with fields that have no group', () => {
      const fields: FieldDef[] = [
        { key: 'name', label: 'Name' },
        { key: 'id', label: 'ID' },
        { key: 'active', label: 'Active' },
      ];
      const data = { name: 'Test', id: '123', active: 'yes' };
      const { lastFrame } = renderInfoTab(fields, data);
      const frame = lastFrame()!;
      // All three fields rendered without extra blank lines
      expect(frame).toContain('Name');
      expect(frame).toContain('ID');
      expect(frame).toContain('Active');
    });
  });

  describe('cross-link navigation', () => {
    const fieldsWithCrossLink: FieldDef[] = [
      { key: 'name', label: 'Name' },
      {
        key: 'orgName',
        label: 'Organization',
        crossLink: { field: 'orgName', targetView: 'org-detail' },
      },
      { key: 'email', label: 'Email' },
    ];

    const dataWithCrossLink = {
      name: 'Alice',
      orgName: 'Acme Corp',
      email: 'alice@example.com',
      id: 'user-999',
    };

    it('highlights first cross-linked field by default', () => {
      const { lastFrame } = renderInfoTab(fieldsWithCrossLink, dataWithCrossLink);
      // The cross-linked field should show cursor marker on the same line
      const frame = lastFrame()!;
      const lines = frame.split('\n');
      const acmeLine = lines.find((l) => l.includes('Acme Corp'));
      expect(acmeLine).toBeDefined();
      expect(acmeLine).toContain('\u25b8');
    });

    it('navigates to target on Enter using field value, not resource id', async () => {
      const { lastFrame, stdin } = renderInfoTab(fieldsWithCrossLink, dataWithCrossLink);

      stdin.write('\r');
      await delay();

      const frame = lastFrame()!;
      expect(frame).toContain('nav:org-detail:Acme Corp');
      expect(frame).toContain('"id":"Acme Corp"');
      expect(frame).not.toContain('user-999');
    });

    it('supports cross-links defined via crossLinks prop', () => {
      const fields: FieldDef[] = [
        { key: 'name', label: 'Name' },
        { key: 'primaryOrg', label: 'Primary Org' },
      ];
      const crossLinks: CrossLinkDef[] = [
        { field: 'primaryOrg', targetView: 'org-detail' },
      ];
      const data = { name: 'Bob', primaryOrg: 'Widgets Inc', id: '456' };
      const { lastFrame } = renderInfoTab(fields, data, crossLinks);
      const frame = lastFrame()!;
      const widgetsLine = frame.split('\n').find((l) => l.includes('Widgets Inc'));
      expect(widgetsLine).toBeDefined();
      expect(widgetsLine).toContain('\u25b8');
    });

    it('moves highlight between cross-linked fields with j/k', async () => {
      const fields: FieldDef[] = [
        { key: 'name', label: 'Name' },
        {
          key: 'org',
          label: 'Organization',
          crossLink: { field: 'org', targetView: 'org-detail' },
        },
        { key: 'email', label: 'Email' },
        {
          key: 'role',
          label: 'Role',
          crossLink: { field: 'role', targetView: 'role-detail' },
        },
      ];
      const data = { name: 'Alice', org: 'Acme', email: 'a@b', role: 'Admin', id: '1' };

      const { lastFrame, stdin } = renderInfoTab(fields, data);

      // Initially highlights first cross-link (org)
      const getMarkedLine = (frame: string, value: string) =>
        frame.split('\n').find((l) => l.includes(value));

      let frame = lastFrame()!;
      expect(getMarkedLine(frame, 'Acme')).toContain('\u25b8');
      expect(getMarkedLine(frame, 'Admin')).not.toContain('\u25b8');

      // Move to next cross-link
      stdin.write('j');
      await delay();

      frame = lastFrame()!;
      expect(getMarkedLine(frame, 'Admin')).toContain('\u25b8');
      expect(getMarkedLine(frame, 'Acme')).not.toContain('\u25b8');

      // Move back
      stdin.write('k');
      await delay();

      frame = lastFrame()!;
      expect(getMarkedLine(frame, 'Acme')).toContain('\u25b8');
      expect(getMarkedLine(frame, 'Admin')).not.toContain('\u25b8');
    });

    it('clamps highlight at boundaries', async () => {
      const { lastFrame, stdin } = renderInfoTab(fieldsWithCrossLink, dataWithCrossLink);

      // Try moving up past the beginning
      stdin.write('k');
      await delay();
      stdin.write('k');
      await delay();

      // Should still show the only cross-link highlighted
      const frame = lastFrame()!;
      const acmeLine = frame.split('\n').find((l) => l.includes('Acme Corp'));
      expect(acmeLine).toBeDefined();
      expect(acmeLine).toContain('\u25b8');
    });

    it('does not show cross-link highlight when no cross-links exist', () => {
      const { lastFrame } = renderInfoTab(basicFields, basicData);
      expect(lastFrame()).not.toContain('\u25b8');
    });
  });
});
