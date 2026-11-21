import React, { useEffect, useState } from 'react';
import { useAppStore } from '../../store/app-store';
import { BookIntroduction, TermDetail } from './TermDetail';
import { X } from 'lucide-react';

export const IndexModal: React.FC = () => {
    const {
        indexModalOpen,
        toggleIndexModal,
        indexData,
        indexLoading,
        indexError,
        loadIndexData,
        indexFilter,
        setIndexFilter
    } = useAppStore();
    const [activeTab, setActiveTab] = useState<'latin' | 'french'>('latin');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        if (indexModalOpen) {
            if (!indexData && !indexLoading) {
                loadIndexData();
            }
            if (indexFilter) {
                setActiveTab(indexFilter.language);
            }
            setSearchQuery('');
        }
    }, [indexModalOpen, indexData, indexLoading, loadIndexData, indexFilter]);

    if (!indexModalOpen) return null;

    const closeModal = () => {
        toggleIndexModal(false);
        setIndexFilter(null);
    };

    const currentList = indexData ? indexData[activeTab] : [];
    const filteredByContext = indexFilter
        ? currentList.filter(entry => indexFilter.termIds.includes(entry.id))
        : currentList;

    const filteredList = filteredByContext.filter(entry =>
        entry.term.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
            onMouseDown={(e) => {
                if (e.target === e.currentTarget) closeModal();
            }}
        >
            <div className="bg-white w-full max-w-2xl h-[85vh] rounded-lg shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">

                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b bg-gray-50">
                    <h2 className="text-xl font-serif font-bold text-gray-800">Покажчик термінів</h2>
                    <button
                        onClick={closeModal}
                        aria-label="Закрити покажчик"
                        className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-full transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Controls */}
                <div className="p-4 border-b space-y-3">
                    {/* Tabs */}
                    <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
                        <button
                            onClick={() => { setActiveTab('latin'); if (indexFilter?.language === 'french') setIndexFilter(null); }}
                            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${activeTab === 'latin' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
                        >
                            Латинські терміни
                        </button>
                        <button
                            onClick={() => { setActiveTab('french'); if (indexFilter?.language === 'latin') setIndexFilter(null); }}
                            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${activeTab === 'french' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
                        >
                            Французькі терміни
                        </button>
                    </div>

                    {/* Search */}
                    <input
                        type="text"
                        placeholder={activeTab === 'latin' ? 'Пошук латинських термінів...' : 'Пошук французьких термінів...'}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />

                    {indexFilter && (
                        <div className="flex items-center justify-between rounded-md border border-blue-100 bg-blue-50 px-3 py-2 text-sm text-blue-800">
                            <div>
                                {indexFilter.language === 'latin' ? `Терміни латинського рядка ${indexFilter.sourceLine}` : `Терміни французького фрагмента ${indexFilter.segment}`}
                            </div>
                            <button
                                className="text-blue-700 hover:text-blue-900 font-semibold"
                                onClick={() => setIndexFilter(null)}
                            >
                                Показати весь покажчик
                            </button>
                        </div>
                    )}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 bg-white">
                    {currentList[0]?.bookIntroduction && (
                        <details key={activeTab} className="mb-6 rounded-lg border border-stone-200 bg-stone-50 text-stone-700">
                            <summary className="cursor-pointer px-4 py-3 font-medium">Позначення та пояснення з книжки</summary>
                            <div className="border-t border-stone-200 px-4 pb-5 pt-3">
                                <BookIntroduction lines={currentList[0].bookIntroduction} />
                            </div>
                        </details>
                    )}
                    {indexLoading ? (
                        <div className="flex items-center justify-center h-40 text-gray-500">
                            Завантаження покажчика...
                        </div>
                    ) : indexError ? (
                        <div className="flex items-center justify-center h-40 text-red-600">
                            {indexError}
                        </div>
                    ) : filteredList.length > 0 ? (
                        filteredList.map(term => (
                            <TermDetail key={term.id} term={term} />
                        ))
                    ) : (
                        <div className="text-center py-10 text-gray-500">
                            Не знайдено термінів за запитом «{searchQuery}»
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};
