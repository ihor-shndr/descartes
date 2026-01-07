import { useEffect } from 'react';
import { prefetchPage } from '../services/page-service';

/**
 * Hook for prefetching the next page in the background
 */
export function usePrefetch(page: number): void {
  useEffect(() => {
    // Prefetch after a short delay to avoid blocking current page
    const timer = setTimeout(() => {
      prefetchPage(page);
    }, 500);

    return () => clearTimeout(timer);
  }, [page]);
}
