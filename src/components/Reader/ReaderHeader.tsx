import Pagination from '../Controls/Pagination';
import SettingsToggle from '../Controls/SettingsToggle';
import { BookOpen } from 'lucide-react';
import { useAppStore } from '../../store/app-store';

interface ReaderHeaderProps {
  page: number;
  availablePages: number[];
  onPageChange: (page: number) => void;
}

export default function ReaderHeader({ page, availablePages, onPageChange }: ReaderHeaderProps) {
  const toggleIndexModal = useAppStore(state => state.toggleIndexModal);

  return (
    <header className="border-b border-gray-200 bg-white sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              Медитації про першу філософію
            </h1>
            <p className="text-sm text-gray-600 mt-1">Рене Декарт</p>
          </div>

          <div className="flex items-center gap-4">
            <Pagination
              currentPage={page}
              availablePages={availablePages}
              onPageChange={onPageChange}
            />
            <button
              onClick={() => toggleIndexModal(true)}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title="Покажчик термінів"
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
