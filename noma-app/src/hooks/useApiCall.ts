import { useState, useCallback, useEffect } from "react";

interface UseApiCallOptions {
  /** Run the fetch immediately on mount (default: true) */
  immediate?: boolean;
}

interface UseApiCallReturn<T> {
  data: T | null;
  loading: boolean;      // true only on first load
  refreshing: boolean;    // true on pull-to-refresh
  error: any | null;
  retry: () => void;       // re-run the same call, clearing error state
  refresh: () => void;     // pull-to-refresh trigger
  setData: React.Dispatch<React.SetStateAction<T | null>>;
}

/**
 * Wraps an async fetch function with standardized loading/error/retry state.
 * Designed to pair with <ErrorState onRetry={retry} /> for consistent UX
 * across every screen that calls the API.
 *
 * Usage:
 *   const { data, loading, error, retry, refresh, refreshing } = useApiCall(
 *     () => adminListExperts({ status: 'pending_review' }),
 *     [activeTab] // dependency array — re-fetches when these change
 *   );
 *
 *   if (loading) return <ActivityIndicator />;
 *   if (error)   return <ErrorState error={error} onRetry={retry} />;
 *   return <ExpertList experts={data.experts} />;
 */
export function useApiCall<T = any>(
  apiFn: () => Promise<{ data: T }>,
  deps: React.DependencyList = [],
  options: UseApiCallOptions = {}
): UseApiCallReturn<T> {
  const { immediate = true } = options;

  const [data, setData]             = useState<T | null>(null);
  const [loading, setLoading]       = useState(immediate);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError]           = useState<any>(null);

  const execute = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const res = await apiFn();
      setData(res.data);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, deps);

  useEffect(() => {
    if (immediate) execute(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  const retry   = useCallback(() => execute(false), [execute]);
  const refresh = useCallback(() => execute(true), [execute]);

  return { data, loading, refreshing, error, retry, refresh, setData };
}