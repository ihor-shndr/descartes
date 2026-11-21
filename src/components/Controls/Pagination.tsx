import { ChevronsUpDown } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  availablePages: number[];
  onPageChange: (page: number) => void;
}

export default function Pagination({ currentPage, availablePages, onPageChange }: PaginationProps) {
  const index = availablePages.indexOf(currentPage);
  const previousPage = availablePages[index - 1];
  const nextPage = availablePages[index + 1];

  return (
    <div className="flex items-center gap-4">
      <button
        onClick={() => previousPage !== undefined && onPageChange(previousPage)}
        disabled={previousPage === undefined}
        className="h-10 px-4 rounded bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        ← Попередня
      </button>

      <div className="relative">
        <select
          aria-label="Вибрати сторінку"
          value={currentPage}
          onChange={(e) => onPageChange(Number(e.target.value))}
          className="h-10 appearance-none pl-3 pr-9 rounded bg-gray-100 hover:bg-gray-200 text-sm font-sans text-gray-700 cursor-pointer border-none outline-none focus:ring-2 focus:ring-blue-300"
        >
          {availablePages.map((page) => (
            <option key={page} value={page}>
              Сторінка {page}
            </option>
          ))}
        </select>
        <ChevronsUpDown aria-hidden="true" size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-700" />
      </div>

      <button
        onClick={() => nextPage !== undefined && onPageChange(nextPage)}
        disabled={nextPage === undefined}
        className="h-10 px-4 rounded bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        Наступна →
      </button>
    </div>
  );
}
