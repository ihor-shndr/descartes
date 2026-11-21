import { BookOpen } from 'lucide-react';
import { useAppStore } from '../../store/app-store';
import { IndexFilterLanguage } from '../../types/termIndex';

export function IndexLineButton({ lineNumber, termIds }: { lineNumber: number; termIds: string[] }) {
    const setIndexFilter = useAppStore(state => state.setIndexFilter);
    const toggleIndexModal = useAppStore(state => state.toggleIndexModal);

    return <button
        type="button"
        className="absolute -left-16 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 text-blue-700 shadow-sm transition-colors hover:bg-blue-200"
        onClick={(event) => {
            event.stopPropagation();
            setIndexFilter({ language: IndexFilterLanguage.Latin, termIds, sourceLine: lineNumber });
            toggleIndexModal(true);
        }}
        aria-label="Показати терміни з цього рядка"
        title="Показати терміни з цього рядка"
    >
        <BookOpen size={14} />
    </button>;
}
