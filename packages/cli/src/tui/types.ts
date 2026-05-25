import type { CcamClient, ContentResponse, PagedResponse } from 'ccam-sdk';

// ---------------------------------------------------------------------------
// ViewType -- every navigable screen in the TUI
// ---------------------------------------------------------------------------

export type ViewType =
  // Home
  | 'resource-picker'
  // List views (one per browsable resource)
  | 'user-list'
  | 'org-list'
  | 'client-list'
  | 'role-list'
  | 'realm-list'
  | 'instance-list'
  | 'permission-list'
  | 'service-type-list'
  // Detail views (one per resource, plus org-config which is singleton)
  | 'user-detail'
  | 'org-detail'
  | 'client-detail'
  | 'role-detail'
  | 'realm-detail'
  | 'instance-detail'
  | 'permission-detail'
  | 'service-type-detail'
  | 'org-config-detail'
  // Special
  | 'audit-log';

// ---------------------------------------------------------------------------
// Navigation
// ---------------------------------------------------------------------------

export interface ViewEntry {
  view: ViewType;
  label: string;
  params?: Record<string, string>;
}

// ---------------------------------------------------------------------------
// Column, field, and sort definitions
// ---------------------------------------------------------------------------

export interface ColumnDef {
  key: string; // field name on the data object
  label: string; // column header text
  width: number; // proportional width (relative to other columns)
  minWidth?: number; // minimum chars before column is hidden
  priority?: number; // lower = hidden first when terminal is narrow
  format?: (value: unknown) => string; // custom formatter (e.g. date, status color)
  color?: 'red' | 'green' | 'yellow' | 'blue' | 'cyan' | 'magenta' | 'white' | 'gray';
  align?: 'left' | 'right'; // default 'left'
  sort?: ColumnSortDef;
}

export interface FieldDef {
  key: string; // field name on the data object
  label: string; // display label
  format?: (value: unknown) => string;
  crossLink?: CrossLinkDef; // makes this field navigable
  group?: string; // visual grouping -- blank line inserted when group changes
}

export interface ColumnSortDef {
  mode: 'remote' | 'local';
  field?: string; // API field for remote sort, record field for local sort
  label?: string; // display label for sort indicator
}

export interface SortFieldDef {
  key: string; // column key
  field: string; // active sort field (API field or record field)
  label: string; // display label for sort indicator
}

export interface CrossLinkDef {
  field: string; // field name on the resource (value is used as the target ID)
  targetView: ViewType; // view to navigate to
}

// ---------------------------------------------------------------------------
// Tab configuration for detail views
// ---------------------------------------------------------------------------

interface TabConfigBase {
  key: string;
  label: string;
  columns: ColumnDef[];
  crossLinkTo?: ViewType; // makes rows navigable
}

/**
 * Tab that fetches a single batch of records from the server and sorts/filters
 * client-side. fetchFn takes only the parent id.
 */
export interface LocalTabConfig extends TabConfigBase {
  type: 'local';
  fetchFn: (
    client: CcamClient,
    id: string,
  ) => Promise<ContentResponse<Record<string, unknown>>>;
}

/**
 * Tab that pages through results server-side. fetchFn takes the parent id plus
 * page/size. Return type is a PagedResponse when the backing endpoint paginates
 * and a ContentResponse otherwise -- both shapes are handled by the consumer
 * hook.
 */
export interface PaginatedTabConfig extends TabConfigBase {
  type: 'paginated';
  fetchFn: (
    client: CcamClient,
    id: string,
    page?: number,
    size?: number,
  ) => Promise<PagedResponse<Record<string, unknown>> | ContentResponse<Record<string, unknown>>>;
}

/**
 * Tab that fetches an audit log. fetchFn takes the parent id plus an optional
 * querySize (initial window; the consumer can expand via `load more`).
 */
export interface AuditTabConfig extends TabConfigBase {
  type: 'audit';
  fetchFn: (
    client: CcamClient,
    id: string,
    querySize?: number,
  ) => Promise<ContentResponse<Record<string, unknown>>>;
}

export type TabConfig = LocalTabConfig | PaginatedTabConfig | AuditTabConfig;

// ---------------------------------------------------------------------------
// Resource configuration -- drives both list and detail views
// ---------------------------------------------------------------------------

export interface ResourceConfig {
  name: string; // 'user', 'org', etc.
  displayName: string; // 'Users', 'Organizations'
  idField: string; // 'id' for most, 'name' for permissions

  // List view
  columns: ColumnDef[];
  listFn: (
    client: CcamClient,
    opts: { page?: number; size?: number; sort?: { field: string; direction: 'asc' | 'desc' } },
  ) => Promise<ContentResponse<Record<string, unknown>> | PagedResponse<Record<string, unknown>>>;
  labelFn: (item: Record<string, unknown>) => string; // breadcrumb label

  // Detail view
  detailFn: (
    client: CcamClient,
    id: string,
  ) => Promise<Record<string, unknown>>;
  fields: FieldDef[];
  tabs: TabConfig[];
  crossLinks: CrossLinkDef[];
}

// ---------------------------------------------------------------------------
// Footer hints (context-aware status bar content)
// ---------------------------------------------------------------------------

export interface FooterHints {
  hints: string; // keyboard hints (left side)
  pageInfo?: string; // page/count info (right side)
  count?: string; // total count or result summary
}

export function getSortableColumns(
  columns: ColumnDef[],
  mode: 'remote' | 'local',
): SortFieldDef[] {
  return columns.flatMap((column) => {
    if (mode === 'local') {
      if (column.sort?.mode === 'remote') {
        return [];
      }

      return [{
        key: column.key,
        field: column.sort?.field ?? column.key,
        label: column.sort?.label ?? column.label,
      }];
    }

    if (column.sort?.mode !== 'remote') {
      return [];
    }

    return [{
      key: column.key,
      field: column.sort.field ?? column.key,
      label: column.sort.label ?? column.label,
    }];
  });
}
