import { useState, useEffect, useCallback, useRef } from 'react';
import type { ContentResponse, PagedResponse } from '@ccam/sdk';
import type { SortFieldDef } from '../types.js';

export interface SortState {
  field: string;
  direction: 'asc' | 'desc';
}

function isPagedResponse<T>(r: ContentResponse<T>): r is PagedResponse<T> {
  return 'page' in r;
}

interface PaginatedState<T> {
  data: T[];
  page: number;
  totalPages: number;
  totalElements: number;
  loading: boolean;
  error: Error | null;
  paginated: boolean;
  currentSort: SortState | undefined;
}

export function usePaginatedResource<T>(
  fetchFn: (page: number, size: number, sort?: SortState) => Promise<ContentResponse<T>>,
  size = 25,
  initialSort?: SortState,
) {
  const [state, setState] = useState<PaginatedState<T>>({
    data: [],
    page: 0,
    totalPages: 0,
    totalElements: 0,
    loading: true,
    error: null,
    paginated: false,
    currentSort: initialSort,
  });

  const fetchRef = useRef(fetchFn);
  fetchRef.current = fetchFn;

  const stateRef = useRef(state);
  stateRef.current = state;

  const fetchPage = useCallback(
    async (page: number, sort?: SortState) => {
      setState((s) => ({ ...s, loading: true, error: null }));
      try {
        const result = await fetchRef.current(page, size, sort);
        if (isPagedResponse(result)) {
          setState((s) => ({
            data: result.content,
            page: result.page.number,
            totalPages: result.page.totalPages,
            totalElements: result.page.totalElements,
            loading: false,
            error: null,
            paginated: true,
            currentSort: s.currentSort,
          }));
        } else {
          setState((s) => ({
            data: result.content,
            page: 0,
            totalPages: 1,
            totalElements: result.content.length,
            loading: false,
            error: null,
            paginated: false,
            currentSort: s.currentSort,
          }));
        }
      } catch (err) {
        setState((s) => ({
          ...s,
          loading: false,
          error: err instanceof Error ? err : new Error(String(err)),
        }));
      }
    },
    [size],
  );

  useEffect(() => {
    fetchPage(0, initialSort);
  }, [fetchPage]);

  const nextPage = useCallback(() => {
    const s = stateRef.current;
    if (s.page < s.totalPages - 1) fetchPage(s.page + 1, s.currentSort);
  }, [fetchPage]);

  const prevPage = useCallback(() => {
    const s = stateRef.current;
    if (s.page > 0) fetchPage(s.page - 1, s.currentSort);
  }, [fetchPage]);

  const retry = useCallback(() => {
    const s = stateRef.current;
    fetchPage(s.page, s.currentSort);
  }, [fetchPage]);

  const setSort = useCallback(
    (sort: SortState) => {
      setState((s) => ({ ...s, currentSort: sort }));
      fetchPage(0, sort);
    },
    [fetchPage],
  );

  const cycleSort = useCallback(
    (sortFields: SortFieldDef[]) => {
      if (sortFields.length === 0) return;
      const s = stateRef.current;
      let next: SortState;
      if (!s.currentSort) {
        next = { field: sortFields[0].field, direction: 'asc' };
      } else {
        const idx = sortFields.findIndex((f) => f.field === s.currentSort!.field);
        const nextIdx = (idx + 1) % sortFields.length;
        next = { field: sortFields[nextIdx].field, direction: 'asc' };
      }
      setState((prev) => ({ ...prev, currentSort: next }));
      fetchPage(0, next);
    },
    [fetchPage],
  );

  const reverseSort = useCallback(() => {
    const s = stateRef.current;
    if (!s.currentSort) return;
    const reversed: SortState = {
      field: s.currentSort.field,
      direction: s.currentSort.direction === 'asc' ? 'desc' : 'asc',
    };
    setState((prev) => ({ ...prev, currentSort: reversed }));
    fetchPage(0, reversed);
  }, [fetchPage]);

  return {
    ...state,
    nextPage,
    prevPage,
    retry,
    setSort,
    cycleSort,
    reverseSort,
  };
}
