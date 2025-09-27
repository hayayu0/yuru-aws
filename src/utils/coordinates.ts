// Coordinate conversion utilities for SVG canvas

/**
 * Convert mouse/pointer coordinates to SVG coordinates
 * @param event - Mouse or pointer event
 * @param svgElement - SVG element reference
 * @returns Object with x and y coordinates in SVG space
 */
export const getSVGCoordinates = (
  event: MouseEvent | React.MouseEvent | PointerEvent,
  svgElement: SVGSVGElement | null
): { x: number; y: number } => {
  if (!svgElement) return { x: 0, y: 0 };
  
  const svg = svgElement;
  const pt = svg.createSVGPoint();
  pt.x = event.clientX;
  pt.y = event.clientY;
  
  const screenCTM = svg.getScreenCTM();
  if (!screenCTM) return { x: 0, y: 0 };
  
  const svgP = pt.matrixTransform(screenCTM.inverse());
  return { x: svgP.x, y: svgP.y };
};

/**
 * Convert SVG coordinates to screen coordinates
 * @param svgX - X coordinate in SVG space
 * @param svgY - Y coordinate in SVG space
 * @param svgElement - SVG element reference
 * @returns Object with x and y coordinates in screen space
 */
export const getScreenCoordinates = (
  svgX: number,
  svgY: number,
  svgElement: SVGSVGElement | null
): { x: number; y: number } => {
  if (!svgElement) return { x: 0, y: 0 };
  
  const svg = svgElement;
  const pt = svg.createSVGPoint();
  pt.x = svgX;
  pt.y = svgY;
  
  const screenCTM = svg.getScreenCTM();
  if (!screenCTM) return { x: 0, y: 0 };
  
  const screenP = pt.matrixTransform(screenCTM);
  return { x: screenP.x, y: screenP.y };
};

/**
 * Get the bounding box of an SVG graphics element in SVG coordinates
 * @param element - SVG graphics element
 * @returns Bounding box with x, y, width, height
 */
export const getSVGBoundingBox = (element: SVGGraphicsElement): {
  x: number;
  y: number;
  width: number;
  height: number;
} => {
  const bbox = element.getBBox();
  return {
    x: bbox.x,
    y: bbox.y,
    width: bbox.width,
    height: bbox.height
  };
};