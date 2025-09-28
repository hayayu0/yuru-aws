// @ts-expect-error - rough.js doesn't have proper TypeScript definitions
import rough from 'roughjs/bundled/rough.esm';

/**
 * Rough.js utility functions for hand-drawn style rendering
 */

export interface RoughOptions {
  roughness?: number;
  bowing?: number;
  stroke?: string;
  strokeWidth?: number;
  fill?: string;
  seed?: number;
  disableMultiStroke?: boolean;
  fillStyle?: string; /*'hachure' | 'solid' | 'zigzag' | 'cross-hatch' | 'dots' | 'dashed' | 'zigzag-line' */
  hachureAngle?: number;
  hachureGap?: number;
}

/**
 * Creates a rough.js drawable for a path with hand-drawn style
 */
export const createRoughPath = (
  pathData: string,
  options: RoughOptions = {}
) => {
  const defaultOptions: RoughOptions = {
    strokeWidth: 1.5,
    stroke: '#1f3aad',
    ...options
  };

  const generator = rough.generator();
  
  // Parse the path data to extract points for rough.js
  const pathCommands = parsePathData(pathData);
  
  if (pathCommands.length < 2) {
    return null;
  }

  // Create a rough path using the parsed points
  return generator.path(pathData, defaultOptions);
};

/**
 * Creates a rough.js drawable for an arrow marker
 */
export const createRoughArrow = (
  x: number,
  y: number,
  angle: number,
  options: RoughOptions = {}
) => {
  const defaultOptions: RoughOptions = {
    roughness: 0.4,
    bowing: 2,
    strokeWidth: 1.5,
    stroke: '#1f3aad',
    fill: '#1f3aad',
    fillStyle: 'solid',
    disableMultiStroke: options.disableMultiStroke ?? true,
    ...options
  };

  const generator = rough.generator();
  
  // Calculate arrow points
  const arrowLength = 12;
  const arrowWidth = 8;
  
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  
  const points: [number, number][] = [
    [x, y],
    [x - arrowLength * cos + arrowWidth * sin, y - arrowLength * sin - arrowWidth * cos],
    [x - arrowLength * cos - arrowWidth * sin, y - arrowLength * sin + arrowWidth * cos]
  ];

  return generator.polygon(points, defaultOptions);
};

/**
 * Parses SVG path data to extract coordinate points
 */
function parsePathData(pathData: string): { x: number; y: number }[] {
  const points: { x: number; y: number }[] = [];
  const commands = pathData.match(/[MLHVCSQTAZ][^MLHVCSQTAZ]*/gi) || [];
  
  let currentX = 0;
  let currentY = 0;
  
  commands.forEach(command => {
    if (!command || command.length === 0) return;
    
    const type = command.charAt(0).toUpperCase();
    const coords = command.slice(1).trim().split(/[\s,]+/).map(Number).filter(n => !isNaN(n));
    
    switch (type) {
      case 'M':
        if (coords.length >= 2 && coords[0] !== undefined && coords[1] !== undefined) {
          currentX = coords[0];
          currentY = coords[1];
          points.push({ x: currentX, y: currentY });
        }
        break;
      case 'L':
        if (coords.length >= 2 && coords[0] !== undefined && coords[1] !== undefined) {
          currentX = coords[0];
          currentY = coords[1];
          points.push({ x: currentX, y: currentY });
        }
        break;
      case 'H':
        if (coords.length >= 1 && coords[0] !== undefined) {
          currentX = coords[0];
          points.push({ x: currentX, y: currentY });
        }
        break;
      case 'V':
        if (coords.length >= 1 && coords[0] !== undefined) {
          currentY = coords[0];
          points.push({ x: currentX, y: currentY });
        }
        break;
    }
  });
  
  return points;
}

// Cache for distorted paths to improve performance
const pathDistortionCache = new Map<string, string>();

/**
 * Adds distortion effect to path points for more hand-drawn appearance
 * Uses caching to improve performance for repeated paths
 */
export const addPathDistortion = (
  pathData: string,
  distortionAmount: number = 0.5,
  seed?: string
): string => {
  // Create cache key including seed for consistent distortion per edge
  const cacheKey = `${pathData}-${distortionAmount}-${seed || 'default'}`;
  
  // Return cached result if available
  if (pathDistortionCache.has(cacheKey)) {
    return pathDistortionCache.get(cacheKey)!;
  }
  
  const commands = pathData.match(/[MLHVCSQTAZ][^MLHVCSQTAZ]*/gi) || [];
  
  // Use seeded random for consistent distortion
  let seedValue = 0;
  if (seed) {
    for (let i = 0; i < seed.length; i++) {
      seedValue += seed.charCodeAt(i);
    }
  }
  
  const distortedCommands = commands.map((command, commandIndex) => {
    const type = command[0];
    const coords = command.slice(1).trim().split(/[\s,]+/).map(Number).filter(n => !isNaN(n));
    
    // Add small random distortion to coordinates using seeded randomness
    const distortedCoords = coords.map((coord, coordIndex) => {
      // Simple seeded random function
      const randomSeed = (seedValue + commandIndex * 100 + coordIndex) % 1000;
      const pseudoRandom = (Math.sin(randomSeed) + 1) / 2; // 0 to 1
      const distortion = (pseudoRandom - 0.5) * distortionAmount;
      return coord + distortion;
    });
    
    return type + distortedCoords.join(' ');
  });
  
  const result = distortedCommands.join(' ');
  
  // Cache the result
  pathDistortionCache.set(cacheKey, result);
  
  // Limit cache size to prevent memory leaks
  if (pathDistortionCache.size > 100) {
    const firstKey = pathDistortionCache.keys().next().value;
    if (firstKey !== undefined) {
      pathDistortionCache.delete(firstKey);
    }
  }
  
  return result;
};

/**
 * Clears the path distortion cache
 */
export const clearPathDistortionCache = (): void => {
  pathDistortionCache.clear();
};

export const createRoughRect = (x: number, y: number, width: number, height: number, options: RoughOptions = {}) => {
  const defaultOptions: RoughOptions = {
    roughness: 2,
    bowing: 4,
    strokeWidth: 1.5,
    stroke: '#008b8b',
    disableMultiStroke: false,
    ...options
  };

  const generator = rough.generator();
  return generator.rectangle(x, y, width, height, defaultOptions);
};