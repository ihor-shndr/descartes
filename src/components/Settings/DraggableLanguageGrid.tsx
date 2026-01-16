import { DndContext, closestCenter, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, useSortable, rectSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useAppStore } from '../../store/app-store';
import { AVAILABLE_LANGUAGES, LanguageCode } from '../../constants/languages';
import { getLanguageLabel } from '../../utils/language-utils';
import { GripVertical } from 'lucide-react';

function SortableItem({ id, code }: { id: string; code: string }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
    const lang = AVAILABLE_LANGUAGES.find(l => l.code === code);

    return (
        <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }}
            {...attributes} {...listeners}
            className={`aspect-square flex flex-col items-center justify-center p-4 rounded-xl border transition-all cursor-grab active:cursor-grabbing relative group
        ${isDragging ? 'z-50 shadow-xl scale-105' : 'hover:shadow-md'} ${lang?.color || 'bg-gray-50'}`}>
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-50"><GripVertical size={14} /></div>
            <span className="text-xl font-serif font-medium">{code.split('-')[0].toUpperCase()}</span>
            <span className="text-[10px] opacity-70">{getLanguageLabel(code)}</span>
        </div>
    );
}

export default function DraggableLanguageGrid() {
    const { languageLayout, updateLanguageLayout } = useAppStore();

    const handleDragEnd = ({ active, over }: DragEndEvent) => {
        if (active.id !== over?.id) {
            const oldIdx = languageLayout.indexOf(active.id as LanguageCode);
            const newIdx = languageLayout.indexOf(over?.id as LanguageCode);
            const newLayout = arrayMove(languageLayout, oldIdx, newIdx);
            updateLanguageLayout(newLayout);
        }
    };

    return (
        <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase text-stone-500">Layout Order</h3>
            <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={languageLayout} strategy={rectSortingStrategy}>
                    <div className="grid grid-cols-2 gap-2">
                        {languageLayout.map((id) => <SortableItem key={id} id={id} code={id} />)}
                    </div>
                </SortableContext>
            </DndContext>
        </div>
    );
}
