import { useSearchParams } from 'react-router-dom';

interface UrlState {
  page: number;
  setPage: (page: number) => void;
}

/**
 * Hook for syncing page number with URL query parameter
 */
export function useUrlState(): UrlState {
  const [searchParams, setSearchParams] = useSearchParams();

  const page = parseInt(searchParams.get('page') || '1', 10);

  const setPage = (newPage: number) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('page', String(newPage));
    setSearchParams(newParams, { replace: true });
  };

  return { page, setPage };
}
