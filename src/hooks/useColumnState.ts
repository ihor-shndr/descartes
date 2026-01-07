import { useLocalStorage } from './useLocalStorage';
import { ColumnLanguage } from '../types/app-state';

interface ColumnState {
  columns: ColumnLanguage[];
  setColumnLang: (index: number, lang: ColumnLanguage) => void;
  addColumn: () => void;
  removeColumn: (index: number) => void;
}

/**
 * Hook for managing column language state
 */
export function useColumnState(): ColumnState {
  const [columns, setColumns] = useLocalStorage<ColumnLanguage[]>(
    'descartes:columns',
    ['uk', 'la']  // Default: 2 columns (Ukrainian, Latin)
  );

  const setColumnLang = (index: number, lang: ColumnLanguage) => {
    const newColumns = [...columns];
    newColumns[index] = lang;
    setColumns(newColumns);
  };

  const addColumn = () => {
    if (columns.length < 4) {
      setColumns([...columns, null]);
    }
  };

  const removeColumn = (index: number) => {
    if (columns.length > 1) {
      const newColumns = columns.filter((_, i) => i !== index);
      setColumns(newColumns);
    }
  };

  return { columns, setColumnLang, addColumn, removeColumn };
}
