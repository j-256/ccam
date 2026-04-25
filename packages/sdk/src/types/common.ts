export interface Link {
  rel: string;
  href: string;
}

export interface PageInfo {
  number: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface ContentResponse<T> {
  content: T[];
  links: Link[];
}

export interface PagedResponse<T> extends ContentResponse<T> {
  page: PageInfo;
}

export type SortDirection = 'asc' | 'desc';

export interface SortOption<F extends string> {
  field: F;
  direction: SortDirection;
}

export interface PaginationOptions {
  page?: number;
  size?: number;
}

export interface AuditLogOptions {
  /**
   * Controls how many audit log records the API returns. The mapping is
   * approximate -- the API appears to use querySize as an internal query
   * window size (e.g. partition or time-bucket count), so the actual number
   * of records returned may be higher or lower than the value provided.
   *
   * Omit to return all records. Avoid very large values (e.g. 10000+) as
   * these cause the API to return 0 records instead of all records.
   */
  querySize?: number;
}
