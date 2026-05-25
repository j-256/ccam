import { useState, useEffect, useCallback, useRef } from 'react';
import type { ContentResponse } from 'ccam-sdk';

interface LocalCollectionState<T> {
  data: T[];
  loading: boolean;
  error: Error | null;
}

export function useLocalCollection<T>(
  fetchFn: () => Promise<ContentResponse<T>>,
) {
  const [state, setState] = useState<LocalCollectionState<T>>({
    data: [],
    loading: true,
    error: null,
  });

  const fetchRef = useRef(fetchFn);
  fetchRef.current = fetchFn;

  const fetch = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const result = await fetchRef.current();
      setState({ data: result.content, loading: false, error: null });
    } catch (err) {
      setState((s) => ({
        ...s,
        loading: false,
        error: err instanceof Error ? err : new Error(String(err)),
      }));
    }
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const retry = useCallback(() => fetch(), [fetch]);

  return { ...state, retry };
}
