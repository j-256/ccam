import { useState, useEffect, useCallback, useRef } from 'react';
import type { ContentResponse, AuditLogRecord } from 'ccam-sdk';

const QUERY_SIZE_STEPS = [25, 50, 100] as const;

interface AuditLogState {
  data: AuditLogRecord[];
  loading: boolean;
  error: Error | null;
  canLoadMore: boolean;
  needsConfirmation: boolean;
}

export function useAuditLog(
  fetchFn: (querySize?: number) => Promise<ContentResponse<AuditLogRecord>>,
) {
  const [state, setState] = useState<AuditLogState>({
    data: [],
    loading: true,
    error: null,
    canLoadMore: true,
    needsConfirmation: false,
  });

  const fetchRef = useRef(fetchFn);
  fetchRef.current = fetchFn;

  // Track which step index we're on (0=25, 1=50, 2=100)
  const stepRef = useRef(0);
  // Track whether all records have been loaded
  const loadedAllRef = useRef(false);

  const doFetch = useCallback(async (querySize?: number) => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const result = await fetchRef.current(querySize);
      const loadedAll = querySize === undefined;
      loadedAllRef.current = loadedAll;
      setState({
        data: result.content,
        loading: false,
        error: null,
        canLoadMore: !loadedAll,
        needsConfirmation: !loadedAll && stepRef.current >= QUERY_SIZE_STEPS.length - 1,
      });
    } catch (err) {
      setState((s) => ({
        ...s,
        loading: false,
        error: err instanceof Error ? err : new Error(String(err)),
      }));
    }
  }, []);

  useEffect(() => {
    stepRef.current = 0;
    loadedAllRef.current = false;
    doFetch(QUERY_SIZE_STEPS[0]);
  }, [doFetch]);

  const loadMore = useCallback(() => {
    if (loadedAllRef.current) return;
    const nextStep = stepRef.current + 1;
    if (nextStep < QUERY_SIZE_STEPS.length) {
      stepRef.current = nextStep;
      doFetch(QUERY_SIZE_STEPS[nextStep]);
    }
    // If already past the last step, loadMore is a no-op;
    // caller should check needsConfirmation and call confirmLoadAll
  }, [doFetch]);

  const confirmLoadAll = useCallback(() => {
    stepRef.current = QUERY_SIZE_STEPS.length; // past last step
    doFetch(undefined);
  }, [doFetch]);

  const retry = useCallback(() => {
    stepRef.current = 0;
    loadedAllRef.current = false;
    doFetch(QUERY_SIZE_STEPS[0]);
  }, [doFetch]);

  return {
    ...state,
    loadMore,
    confirmLoadAll,
    retry,
  };
}
