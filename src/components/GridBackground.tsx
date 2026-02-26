import React from 'react';

/**
 * Grid background pattern component for SVG canvas
 * Creates a grid pattern with configurable size and color
 */
interface GridBackgroundProps {
  gridSize?: number;
  strokeColor?: string;
  strokeWidth?: number;
  patternId?: string;
}

const GridBackground: React.FC<GridBackgroundProps> = ({
  gridSize = 20,
  strokeColor = 'rgba(206, 212, 220, 0.6)',
  strokeWidth = 1,
  patternId = 'grid'
}) => (
  <defs>
    <pattern
      id={patternId}
      width={gridSize}
      height={gridSize}
      patternUnits="userSpaceOnUse"
    >
      <path
        d={`M ${gridSize} 0 L 0 0 0 ${gridSize}`}
        fill="none"
        stroke={strokeColor}
        strokeWidth={strokeWidth}
      />
    </pattern>
  </defs>
);

export default GridBackground;
