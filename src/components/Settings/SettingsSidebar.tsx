import { useAppStore } from '../../store/app-store';
import DraggableLanguageGrid from './DraggableLanguageGrid';
import { HIGHLIGHT_OPTIONS, HighlightColor } from '../../constants/highlights';

/**
 * Settings sidebar that slides in from the right
 * Contains draggable grid for language layout
 */
export default function SettingsSidebar() {
  const settingsSidebarOpen = useAppStore((state) => state.settingsSidebarOpen);
  const toggleSettingsSidebar = useAppStore((state) => state.toggleSettingsSidebar);
  const showIndexHighlights = useAppStore((state) => state.showIndexHighlights);
  const setShowIndexHighlights = useAppStore((state) => state.setShowIndexHighlights);
  const loadIndexData = useAppStore((state) => state.loadIndexData);
  const highlightColor = useAppStore((state) => state.highlightColor);
  const setHighlightColor = useAppStore((state) => state.setHighlightColor);

  return (
    <>
      {/* Overlay */}
      {settingsSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40"
          onClick={toggleSettingsSidebar}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
          fixed top-0 right-0 h-full w-80 bg-white shadow-2xl z-50
          transform transition-transform duration-300 ease-in-out
          ${settingsSidebarOpen ? 'translate-x-0' : 'translate-x-full'}
        `}
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">Settings</h2>
            <button
              onClick={toggleSettingsSidebar}
              className="text-gray-500 hover:text-gray-700 p-1 rounded hover:bg-gray-100"
              aria-label="Close settings"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Settings content */}
          <DraggableLanguageGrid />

          <div className="mt-8 space-y-3">
            <label className="flex items-start space-x-3">
              <input
                type="checkbox"
                className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                checked={showIndexHighlights}
                onChange={(e) => {
                  setShowIndexHighlights(e.target.checked);
                  if (e.target.checked) {
                    loadIndexData();
                  }
                }}
              />
              <div>
                <div className="text-sm font-semibold text-gray-900">Highlight Latin index lines</div>
                <p className="text-sm text-gray-600">
                  Show a marker on Latin lines that contain indexed terms and open the index from that line.
                </p>
              </div>
            </label>

            <div className="space-y-1">
              <div className="text-sm font-semibold text-gray-900">Highlight color</div>
              <select
                value={highlightColor}
                onChange={(e) => setHighlightColor(e.target.value as HighlightColor)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {HIGHLIGHT_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <p className="text-sm text-gray-600">
                Applied to hover and navigation highlights.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
