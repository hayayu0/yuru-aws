import type { MarqueeInfo } from '../types';
import { elementSize } from '../types/aws';

interface RectLike {
  id: number;
  x: number;
  y: number;
  width?: number;
  height?: number;
}

/**
 * Check if an element is completely contained within the marquee selection rectangle
 */
export function isElementInMarquee<T extends RectLike>(element: T, marqueeInfo: MarqueeInfo): boolean {
  if (!marqueeInfo.isActive) {
    return false;
  }

  const marqueeLeft = Math.min(marqueeInfo.startX, marqueeInfo.currentX);
  const marqueeRight = Math.max(marqueeInfo.startX, marqueeInfo.currentX);
  const marqueeTop = Math.min(marqueeInfo.startY, marqueeInfo.currentY);
  const marqueeBottom = Math.max(marqueeInfo.startY, marqueeInfo.currentY);

  const elementWidth = element.width ?? elementSize.defaultNodeWidth;
  const elementHeight = element.height ?? elementSize.defaultNodeHeight;

  const elementLeft = element.x;
  const elementRight = element.x + elementWidth;
  const elementTop = element.y;
  const elementBottom = element.y + elementHeight;

  return (
    elementLeft >= marqueeLeft &&
    elementRight <= marqueeRight &&
    elementTop >= marqueeTop &&
    elementBottom <= marqueeBottom
  );
}

/**
 * Get all element IDs that are within the marquee selection
 */
export function getElementsInMarquee<T extends RectLike>(elements: T[], marqueeInfo: MarqueeInfo): number[] {
  if (!marqueeInfo.isActive) {
    return [];
  }

  return elements
    .filter(element => isElementInMarquee(element, marqueeInfo))
    .map(element => element.id);
}

/**
 * Check if an edge intersects with the marquee selection rectangle
 */
export function isEdgeInMarquee(edge: any, nodes: any[], frames: any[], marqueeInfo: MarqueeInfo): boolean {
  if (!marqueeInfo.isActive) {
    return false;
  }

  const marqueeLeft = Math.min(marqueeInfo.startX, marqueeInfo.currentX);
  const marqueeRight = Math.max(marqueeInfo.startX, marqueeInfo.currentX);
  const marqueeTop = Math.min(marqueeInfo.startY, marqueeInfo.currentY);
  const marqueeBottom = Math.max(marqueeInfo.startY, marqueeInfo.currentY);

  // Find from and to elements
  const fromElement = nodes.find(n => n.id === edge.from) || frames.find(f => f.id === edge.from);
  const toElement = nodes.find(n => n.id === edge.to) || frames.find(f => f.id === edge.to);

  if (!fromElement || !toElement) {
    return false;
  }

  // Get center points of elements
  const fromCenterX = fromElement.x + (fromElement.width ?? elementSize.defaultNodeWidth) / 2;
  const fromCenterY = fromElement.y + (fromElement.height ?? elementSize.defaultNodeHeight) / 2;
  const toCenterX = toElement.x + (toElement.width ?? elementSize.defaultNodeWidth) / 2;
  const toCenterY = toElement.y + (toElement.height ?? elementSize.defaultNodeHeight) / 2;

  // Check if both endpoints are within marquee
  const fromInMarquee = fromCenterX >= marqueeLeft && fromCenterX <= marqueeRight && 
                       fromCenterY >= marqueeTop && fromCenterY <= marqueeBottom;
  const toInMarquee = toCenterX >= marqueeLeft && toCenterX <= marqueeRight && 
                     toCenterY >= marqueeTop && toCenterY <= marqueeBottom;

  return fromInMarquee && toInMarquee;
}

/**
 * Get all edge IDs that are within the marquee selection
 */
export function getEdgesInMarquee(edges: any[], nodes: any[], frames: any[], marqueeInfo: MarqueeInfo): number[] {
  if (!marqueeInfo.isActive) {
    return [];
  }

  return edges
    .filter(edge => isEdgeInMarquee(edge, nodes, frames, marqueeInfo))
    .map(edge => edge.id);
}