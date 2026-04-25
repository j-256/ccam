import { useState, useEffect, useCallback, useRef } from 'react';

interface DetailState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

export function useResourceDetail<T>(fetchFn: () => Promise<T>) {
  const [state, setState] = useState<DetailState<T>>({
    data: null,
    loading: true,
    error: null,
  });

  const fetchRef = useRef(fetchFn);
  fetchRef.current = fetchFn;

  const fetch = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const data = await fetchRef.current();
      setState({ data, loading: false, error: null });
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
