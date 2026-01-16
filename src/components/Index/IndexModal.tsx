
import React, { useEffect, useState } from 'react';
import { useAppStore } from '../../store/app-store';
import { IndexData, TermEntry } from '../../types/termIndex';
import { TermDetail } from './TermDetail';
import { X } from 'lucide-react';

export const IndexModal: React.FC = () => {
    const { indexModalOpen, toggleIndexModal } = useAppStore();
    const [data, setData] = useState<IndexData | null>(null);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'latin' | 'french'>('latin');
    const [searchQuery, setSearchQuery] = useState('');

    // Fetch data only once when first opened
    useEffect(() => {
        if (indexModalOpen && !data && !loading) {
            setLoading(true);

            // Fetch both index files in parallel
            Promise.all([
                fetch('/descartes/meditations/index/la.json').then(res => {
                    if (!res.ok) throw new Error(`Failed to load Latin index: ${res.status}`);
                    return res.json();
                }),
                fetch('/descartes/meditations/index/fr.json').then(res => {
                    if (!res.ok) throw new Error(`Failed to load French index: ${res.status}`);
                    return res.json();
                })
            ])
                .then(([latinData, frenchData]) => {
                    setData({
                        latin: latinData,
                        french: frenchData
                    });
                    setLoading(false);
                })
                .catch(err => {
                    console.error("Failed to load index", err);
                    setLoading(false);
                });
        }
    }, [indexModalOpen, data, loading]);

    if (!indexModalOpen) return null;

    const currentList = data ? data[activeTab] : [];

    const filteredList = currentList.filter(entry =>
        entry.term.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white w-full max-w-2xl h-[85vh] rounded-lg shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">

                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b bg-gray-50">
                    <h2 className="text-xl font-serif font-bold text-gray-800">Index of Terms</h2>
                    <button
                        onClick={() => toggleIndexModal(false)}
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
                            onClick={() => setActiveTab('latin')}
                            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${activeTab === 'latin' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
                        >
                            Latin Terms
                        </button>
                        <button
                            onClick={() => setActiveTab('french')}
                            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${activeTab === 'french' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
                        >
                            French Terms
                        </button>
                    </div>

                    {/* Search */}
                    <input
                        type="text"
                        placeholder={`Search ${activeTab} terms...`}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 bg-white">
                    {loading ? (
                        <div className="flex items-center justify-center h-40 text-gray-500">
                            Loading index...
                        </div>
                    ) : filteredList.length > 0 ? (
                        filteredList.map(term => (
                            <TermDetail key={term.id} term={term} />
                        ))
                    ) : (
                        <div className="text-center py-10 text-gray-500">
                            No terms found matching "{searchQuery}"
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};
