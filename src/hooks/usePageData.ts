import { useState, useEffect } from 'react';
import { PageData } from '../types/page';
import { fetchPage } from '../services/page-service';

interface PageDataState {
  data: PageData | null;
  loading: boolean;
  error: Error | null;
}

/**
 * Hook for fetching page data
 */
export function usePageData(page: number): PageDataState {
  const [data, setData] = useState<PageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const loadPage = async () => {
      setLoading(true);
      setError(null);

      try {
        const pageData = await fetchPage(page);
        setData(pageData);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    loadPage();
  }, [page]);

  return { data, loading, error };
}
