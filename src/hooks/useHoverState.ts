import { useState } from 'react';

interface HoverState {
  hoveredSegmentId: string | null;
  setHoveredSegmentId: (id: string | null) => void;
}

/**
 * Hook for managing cross-column hover highlighting
 */
export function useHoverState(): HoverState {
  const [hoveredSegmentId, setHoveredSegmentId] = useState<string | null>(null);

  return {
    hoveredSegmentId,
    setHoveredSegmentId
  };
}
