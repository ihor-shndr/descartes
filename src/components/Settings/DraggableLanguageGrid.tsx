import { useState } from 'react';
import { createPortal } from 'react-dom';
import { DndContext, closestCenter, DragOverlay, DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, useSortable, rectSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useAppStore } from '../../store/app-store';
import { AVAILABLE_LANGUAGES, LanguageCode } from '../../constants/languages';
import { getLanguageLabel } from '../../utils/language-utils';
import { GripVertical } from 'lucide-react';

function LanguageCard({ code, dragging = false }: { code: string; dragging?: boolean }) {
    const lang = AVAILABLE_LANGUAGES.find(l => l.code === code);
    const [name, source] = getLanguageLabel(code).split(' (');

    return (
        <div className={`aspect-square flex flex-col items-center justify-center p-4 rounded-xl border transition-shadow cursor-grab active:cursor-grabbing relative group
        ${dragging ? 'shadow-xl cursor-grabbing' : 'hover:shadow-md'} ${lang?.color || 'bg-gray-50'}`}>
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-50"><GripVertical size={14} /></div>
            {code.endsWith('-ua') ? (
                <span aria-hidden="true" className="mb-2 flex h-7 w-11 flex-col overflow-hidden rounded-sm shadow-sm">
                    <span className="h-1/2 bg-[#0057b7]" />
                    <span className="h-1/2 bg-[#ffd700]" />
                </span>
            ) : code === 'fr' ? (
                <span aria-hidden="true" className="mb-2 flex h-7 w-11 overflow-hidden rounded-sm shadow-sm">
                    <span className="w-1/3 bg-[#002395]" />
                    <span className="w-1/3 bg-white" />
                    <span className="w-1/3 bg-[#ed2939]" />
                </span>
            ) : (
                <img src="/descartes/rome-emblem.png" alt="" className="mb-2 h-7 w-11 rounded-sm bg-[#a00007] object-contain shadow-sm" />
            )}
            <span className="h-8 text-center text-[10px] leading-4 opacity-70">
                <span className="block">{name}</span>
                {source && <span className="block">({source}</span>}
            </span>
        </div>
    );
}

function SortableItem({ id }: { id: LanguageCode }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

    return (
        <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.3 : 1, touchAction: 'none' }}
            {...attributes} {...listeners}>
            <LanguageCard code={id} />
        </div>
    );
}

export default function DraggableLanguageGrid() {
    const { languageLayout, updateLanguageLayout } = useAppStore();
    const [activeLanguage, setActiveLanguage] = useState<LanguageCode | null>(null);

    const handleDragStart = ({ active }: DragStartEvent) => {
        setActiveLanguage(languageLayout.find(code => code === active.id) ?? null);
    };

    const handleDragEnd = ({ active, over }: DragEndEvent) => {
        setActiveLanguage(null);
        if (over && active.id !== over.id) {
            const oldIdx = languageLayout.findIndex(code => code === active.id);
            const newIdx = languageLayout.findIndex(code => code === over.id);
            if (oldIdx >= 0 && newIdx >= 0) updateLanguageLayout(arrayMove(languageLayout, oldIdx, newIdx));
        }
    };

    return (
        <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase text-stone-500">Порядок мов</h3>
            <DndContext collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd} onDragCancel={() => setActiveLanguage(null)}>
                <SortableContext items={languageLayout} strategy={rectSortingStrategy}>
                    <div className="grid grid-cols-2 gap-2">
                        {languageLayout.map((id) => <SortableItem key={id} id={id} />)}
                    </div>
                </SortableContext>
                {createPortal(
                    <DragOverlay dropAnimation={null}>
                        {activeLanguage ? <LanguageCard code={activeLanguage} dragging /> : null}
                    </DragOverlay>,
                    document.body
                )}
            </DndContext>
        </div>
    );
}
