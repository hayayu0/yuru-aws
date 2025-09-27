export interface RectElement {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Port {
  x: number;
  y: number;
  name: 'top' | 'bottom' | 'left' | 'right';
}

const defaultNodeWidth = 48;
const defaultNodeHeight = 48;

const getWidth = (element: RectElement): number => element.width;
const getHeight = (element: RectElement): number => element.height;

// Helper function to convert Node or Frame to RectElement
export const toRectElement = (element: { id: number; x: number; y: number; width?: number; height?: number }): RectElement => {
  return {
    id: element.id,
    x: element.x,
    y: element.y,
    width: element.width ?? 48,
    height: element.height ?? 48,
  };
};

/**
 * Calculate orthogonal path between two rectangular elements
 */
export const calculateOrthogonalPath = (
  fromNode: RectElement,
  toNode: RectElement,
): string => {
  const fromWidth = getWidth(fromNode);
  const fromHeight = getHeight(fromNode);
  const toWidth = getWidth(toNode);
  const toHeight = getHeight(toNode);

  const fromPorts: Port[] = [
    { x: fromNode.x + fromWidth / 2, y: fromNode.y, name: 'top' },
    { x: fromNode.x + fromWidth / 2, y: fromNode.y + fromHeight, name: 'bottom' },
    { x: fromNode.x, y: fromNode.y + fromHeight / 2, name: 'left' },
    { x: fromNode.x + fromWidth, y: fromNode.y + fromHeight / 2, name: 'right' },
  ];

  const toPorts: Port[] = [
    { x: toNode.x + toWidth / 2, y: toNode.y, name: 'top' },
    { x: toNode.x + toWidth / 2, y: toNode.y + toHeight, name: 'bottom' },
    { x: toNode.x, y: toNode.y + toHeight / 2, name: 'left' },
    { x: toNode.x + toWidth, y: toNode.y + toHeight / 2, name: 'right' },
  ];

  let bestPath = { path: '', dist: Infinity };

  const fromCenterX = fromNode.x + fromWidth / 2;
  const fromCenterY = fromNode.y + fromHeight / 2;
  const toCenterX = toNode.x + toWidth / 2;
  const toCenterY = toNode.y + toHeight / 2;

  const dx = Math.abs(fromCenterX - toCenterX);
  const dy = Math.abs(fromCenterY - toCenterY);

  let startPorts: Port[];
  let endPorts: Port[];

  if (dx > dy) {
    startPorts = fromPorts.filter((p) => p.name === 'left' || p.name === 'right');
    endPorts = toPorts.filter((p) => p.name === 'left' || p.name === 'right');
  } else {
    startPorts = fromPorts.filter((p) => p.name === 'top' || p.name === 'bottom');
    endPorts = toPorts.filter((p) => p.name === 'top' || p.name === 'bottom');
  }

  if (startPorts.length === 0) startPorts = fromPorts;
  if (endPorts.length === 0) endPorts = toPorts;

  for (const from of startPorts) {
    for (const to of endPorts) {
      const dist = Math.abs(from.x - to.x) + Math.abs(from.y - to.y);
      if (dist < bestPath.dist) {
        let path: string;

        const isVerticalConnection =
          (from.name === 'top' || from.name === 'bottom') &&
          (to.name === 'top' || to.name === 'bottom');
        const isHorizontalConnection =
          (from.name === 'left' || from.name === 'right') &&
          (to.name === 'left' || to.name === 'right');

        if (isVerticalConnection) {
          const midY = (from.y + to.y) / 2;
          path = `M ${from.x},${from.y} L ${from.x},${midY} L ${to.x},${midY} L ${to.x},${to.y}`;
        } else if (isHorizontalConnection) {
          const midX = (from.x + to.x) / 2;
          path = `M ${from.x},${from.y} L ${midX},${from.y} L ${midX},${to.y} L ${to.x},${to.y}`;
        } else {
          const midX = (from.x + to.x) / 2;
          path = `M ${from.x},${from.y} L ${midX},${from.y} L ${midX},${to.y} L ${to.x},${to.y}`;
        }

        bestPath = { path, dist };
      }
    }
  }

  return bestPath.path;
};

/**
 * Get connection ports for a rectangular element
 */
export const getNodePorts = (element: RectElement): Port[] => {
  const width = getWidth(element);
  const height = getHeight(element);

  return [
    { x: element.x + width / 2, y: element.y, name: 'top' },
    { x: element.x + width / 2, y: element.y + height, name: 'bottom' },
    { x: element.x, y: element.y + height / 2, name: 'left' },
    { x: element.x + width, y: element.y + height / 2, name: 'right' },
  ];
};