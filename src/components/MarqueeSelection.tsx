import React from 'react';
import type { MarqueeInfo } from '../types';

interface MarqueeSelectionProps {
  marqueeInfo: MarqueeInfo;
}

const MarqueeSelection: React.FC<MarqueeSelectionProps> = ({ marqueeInfo }) => {
  if (!marqueeInfo.isActive) {
    return null;
  }

  // Calculate rectangle bounds
  const x = Math.min(marqueeInfo.startX, marqueeInfo.currentX);
  const y = Math.min(marqueeInfo.startY, marqueeInfo.currentY);
  const width = Math.abs(marqueeInfo.currentX - marqueeInfo.startX);
  const height = Math.abs(marqueeInfo.currentY - marqueeInfo.startY);

  return (
    <rect
      x={x}
      y={y}
      width={width}
      height={height}
      fill="rgba(0, 123, 255, 0.1)"
      stroke="rgba(0, 123, 255, 0.5)"
      strokeWidth="1"
      strokeDasharray="5,5"
      pointerEvents="none"
    />
  );
};

export default MarqueeSelection;