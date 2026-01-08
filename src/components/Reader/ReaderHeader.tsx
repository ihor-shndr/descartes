import Pagination from '../Controls/Pagination';
import SettingsToggle from '../Controls/SettingsToggle';

interface ReaderHeaderProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function ReaderHeader({ page, totalPages, onPageChange }: ReaderHeaderProps) {
  return (
    <header className="border-b border-gray-200 bg-white sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              Meditations on First Philosophy
            </h1>
            <p className="text-sm text-gray-600 mt-1">René Descartes</p>
          </div>

          <div className="flex items-center gap-4">
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={onPageChange}
            />
            <SettingsToggle />
          </div>
        </div>
      </div>
    </header>
  );
}
