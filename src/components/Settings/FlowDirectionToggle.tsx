import { useAppStore } from '../../store/app-store';
import { FlowDirection } from '../../types/store';

/**
 * Radio button toggle for flow direction setting
 */
export default function FlowDirectionToggle() {
  const flowDirection = useAppStore((state) => state.flowDirection);
  const setFlowDirection = useAppStore((state) => state.setFlowDirection);

  return (
    <div className="mb-8">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">Flow Direction</h3>
      <div className="space-y-2">
        <label className="flex items-start cursor-pointer">
          <input
            type="radio"
            name="flow"
            value="top-to-bottom"
            checked={flowDirection === 'top-to-bottom'}
            onChange={(e) => setFlowDirection(e.target.value as FlowDirection)}
            className="mt-0.5 w-4 h-4 text-blue-600"
          />
          <span className="ml-3 text-sm">
            <div className="font-medium">Top to Bottom</div>
            <div className="text-xs text-gray-500 mt-0.5">
              Row 1: Latin + Ukrainian, Row 2: French + Ukrainian
            </div>
          </span>
        </label>

        <label className="flex items-start cursor-pointer">
          <input
            type="radio"
            name="flow"
            value="left-to-right"
            checked={flowDirection === 'left-to-right'}
            onChange={(e) => setFlowDirection(e.target.value as FlowDirection)}
            className="mt-0.5 w-4 h-4 text-blue-600"
          />
          <span className="ml-3 text-sm">
            <div className="font-medium">Left to Right</div>
            <div className="text-xs text-gray-500 mt-0.5">
              Column 1: Sources, Column 2: Translations
            </div>
          </span>
        </label>
      </div>
    </div>
  );
}
