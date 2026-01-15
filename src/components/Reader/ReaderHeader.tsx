import Pagination from '../Controls/Pagination';
import SettingsToggle from '../Controls/SettingsToggle';
import { BookOpen } from 'lucide-react';
import { useAppStore } from '../../store/app-store';

interface ReaderHeaderProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function ReaderHeader({ page, totalPages, onPageChange }: ReaderHeaderProps) {
  const toggleIndexModal = useAppStore(state => state.toggleIndexModal);

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
            <button
              onClick={() => toggleIndexModal(true)}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title="Term Index"
            >
              <BookOpen size={20} />
            </button>
            <SettingsToggle />
          </div>
        </div>
      </div>
    </header>
  );
}
