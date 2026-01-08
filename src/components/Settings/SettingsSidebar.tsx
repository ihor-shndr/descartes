import { useAppStore } from '../../store/app-store';
import FlowDirectionToggle from './FlowDirectionToggle';
import LanguageGrid2x2 from './LanguageGrid2x2';

/**
 * Settings sidebar that slides in from the right
 * Contains flow direction toggle and language selection grid
 */
export default function SettingsSidebar() {
  const settingsSidebarOpen = useAppStore((state) => state.settingsSidebarOpen);
  const toggleSettingsSidebar = useAppStore((state) => state.toggleSettingsSidebar);

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
          <FlowDirectionToggle />
          <LanguageGrid2x2 />
        </div>
      </div>
    </>
  );
}
