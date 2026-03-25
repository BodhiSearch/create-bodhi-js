import { useState, useEffect, useCallback, useRef } from 'react';
import { useBodhi } from '@bodhiapp/bodhi-js-react';
import type { Mcp } from '@/lib/mcp-tools';

export function useMcpList() {
  const { client, isAuthenticated, isReady } = useBodhi();
  const [mcps, setMcps] = useState<Mcp[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isLoadingRef = useRef(false);

  const fetchMcps = useCallback(async () => {
    if (isLoadingRef.current) return;
    isLoadingRef.current = true;
    setIsLoading(true);
    setError(null);

    try {
      const response = await client.mcps.list();
      setMcps(response.mcps ?? []);
    } catch (err) {
      console.error('Failed to fetch MCPs:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch MCPs');
    } finally {
      setIsLoading(false);
      isLoadingRef.current = false;
    }
  }, [client]);

  useEffect(() => {
    if (isReady && isAuthenticated) {
      fetchMcps();
    } else {
      setMcps([]);
      setError(null);
    }
  }, [isReady, isAuthenticated, fetchMcps]);

  return { mcps, isLoading, error, refresh: fetchMcps };
}
