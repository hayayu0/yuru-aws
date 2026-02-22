import React, { useRef, useEffect, useCallback } from "react";
import { useAppState } from "../hooks/useAppState";
import { useAppActions } from "../hooks/useAppActions";
import { getSVGCoordinates } from "../utils/coordinates";

const PEN_COLORS: Record<'pen-black' | 'pen-red', string> = {
  'pen-black': '#111122',
  'pen-red': '#dc2020',
};

const toPointString = (points: { x: number; y: number }[]) =>
  points.map(point => `${point.x},${point.y}`).join(' ');

const getStrokeWidthForColor = () => 2;

const distanceSqToSegment = (
  point: { x: number; y: number },
  start: { x: number; y: number },
  end: { x: number; y: number }
) => {
  const vx = end.x - start.x;
  const vy = end.y - start.y;
  const wx = point.x - start.x;
  const wy = point.y - start.y;

  const lengthSq = vx * vx + vy * vy;
  if (lengthSq === 0) {
    return wx * wx + wy * wy;
  }

  let t = (wx * vx + wy * vy) / lengthSq;
  t = Math.max(0, Math.min(1, t));

  const projX = start.x + t * vx;
  const projY = start.y + t * vy;
  const dx = point.x - projX;
  const dy = point.y - projY;
  return dx * dx + dy * dy;
};

const PEN_DELETE_THRESHOLD = 2;

const DrawingLayer: React.FC = () => {
  const { state } = useAppState();
  const {
    updateDrawing,
    addFreehandPath,
    deleteFreehandPaths,
    setDrawingContainer,
    setPenDeleteActive,

  } = useAppActions();
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const activePointerId = useRef<number | null>(null);
  const [drawingViewBox, setDrawingViewBox] = React.useState("0 0 1 1");

  const isPenTool = state.activeTool === 'pen-black' || state.activeTool === 'pen-red';
  const isPenDelete = state.activeTool === 'penDelete';
  const isDrawingTool = isPenTool || isPenDelete;

  useEffect(() => {
    if (wrapperRef.current) {
      setDrawingContainer(wrapperRef.current);
    }
  }, [setDrawingContainer]);

  useEffect(() => {
    if (!isPenTool && state.drawing.active) {
      // Cancel any in-progress drawing if the user switches tools mid-stroke
      updateDrawing({ active: false, points: [] });
      activePointerId.current = null;
    }
  }, [isPenTool, state.drawing.active, updateDrawing]);

  useEffect(() => {
    if (!isPenDelete && state.penDeleteActive) {
      setPenDeleteActive(false);
    }
  }, [isPenDelete, state.penDeleteActive, setPenDeleteActive]);

  useEffect(() => {
    const canvasSvg = document.getElementById('diagramCanvas') as SVGSVGElement | null;
    if (!canvasSvg) {
      return;
    }

    const syncViewBox = () => {
      const nextViewBox = canvasSvg.getAttribute('viewBox');
      if (nextViewBox) {
        setDrawingViewBox(nextViewBox);
      }
    };

    syncViewBox();
    const observer = new MutationObserver(syncViewBox);
    observer.observe(canvasSvg, {
      attributes: true,
      attributeFilter: ['viewBox'],
    });

    return () => {
      observer.disconnect();
    };
  }, []);

  const getSvgCoords = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    const canvasSvg = document.getElementById('diagramCanvas') as SVGSVGElement | null;
    if (!canvasSvg) {
      return { x: 0, y: 0 };
    }
    return getSVGCoordinates(event.nativeEvent, canvasSvg);
  }, []);

  const removePathsNearPoint = useCallback((point: { x: number; y: number }) => {
    const thresholdSq = PEN_DELETE_THRESHOLD * PEN_DELETE_THRESHOLD;
    const idsToDelete = new Set<number>();

    state.drawings.forEach(path => {
      const points = path.points;
      if (points.length === 0) {
        return;
      }

      for (let i = 0; i < points.length; i += 1) {
        const current = points[i];
        if (!current) {
          continue;
        }

        const dx = current.x - point.x;
        const dy = current.y - point.y;
        if (dx * dx + dy * dy <= thresholdSq) {
          idsToDelete.add(path.id);
          return;
        }

        const next = points[i + 1];
        if (next) {
          const distanceSq = distanceSqToSegment(point, current, next);
          if (distanceSq <= thresholdSq) {
            idsToDelete.add(path.id);
            return;
          }
        }
      }
    });

    if (idsToDelete.size > 0) {
      deleteFreehandPaths(Array.from(idsToDelete));
    }
  }, [deleteFreehandPaths, state.drawings]);

  const handlePointerDown = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) {
      return;
    }

    event.preventDefault();
    const coords = getSvgCoords(event);

    activePointerId.current = event.pointerId;
    wrapperRef.current?.setPointerCapture(event.pointerId);

    if (isPenTool) {
      const color = PEN_COLORS[state.activeTool as 'pen-black' | 'pen-red'];
      updateDrawing({
        active: true,
        color,
        points: [coords],
      });
    } else if (isPenDelete) {
      setPenDeleteActive(true);
      removePathsNearPoint(coords);
    }
  }, [getSvgCoords, isPenTool, isPenDelete, state.activeTool, updateDrawing, setPenDeleteActive, removePathsNearPoint]);

  const handlePointerMove = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (activePointerId.current !== event.pointerId) {
      return;
    }

    const coords = getSvgCoords(event);

    if (isPenTool && state.drawing.active) {
      updateDrawing({
        points: [...state.drawing.points, coords],
      });
    } else if (isPenDelete && state.penDeleteActive) {
      removePathsNearPoint(coords);
    }
  }, [getSvgCoords, isPenTool, isPenDelete, state.drawing.active, state.drawing.points, state.penDeleteActive, updateDrawing, removePathsNearPoint]);

  const finalizeStroke = useCallback((extraPoint?: { x: number; y: number }) => {
    if (!state.drawing.active) {
      return;
    }

    const basePoints = state.drawing.points;
    let nextPoints = basePoints;
    if (extraPoint) {
      const lastPoint = basePoints[basePoints.length - 1];
      if (!lastPoint || lastPoint.x !== extraPoint.x || lastPoint.y !== extraPoint.y) {
        nextPoints = [...basePoints, extraPoint];
      }
    } else {
      nextPoints = [...basePoints];
    }

    if (nextPoints.length > 1) {
      addFreehandPath({
        id: Date.now(),
        color: state.drawing.color,
        points: nextPoints,
        strokeWidth: getStrokeWidthForColor(),
      });
    }

    updateDrawing({
      active: false,
      points: [],
    });
  }, [addFreehandPath, state.drawing.active, state.drawing.color, state.drawing.points, updateDrawing]);

  const handlePointerEnd = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (activePointerId.current !== event.pointerId) {
      return;
    }

    const coords = getSvgCoords(event);
    wrapperRef.current?.releasePointerCapture(event.pointerId);
    activePointerId.current = null;

    if (isPenTool) {
      finalizeStroke(coords);
    } else if (isPenDelete) {
      removePathsNearPoint(coords);
      setPenDeleteActive(false);
    }
  }, [finalizeStroke, getSvgCoords, isPenTool, isPenDelete, removePathsNearPoint, setPenDeleteActive]);

  return (
    <div
      id="drawing-wrapper"
      className={`drawing-wrapper${isDrawingTool ? ' drawing-wrapper--active' : ''}`}
      ref={wrapperRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerEnd}
      onPointerLeave={handlePointerEnd}
      onPointerCancel={handlePointerEnd}
      aria-hidden={!isDrawingTool}
    >
      <svg className="drawing-surface" role="presentation" viewBox={drawingViewBox} preserveAspectRatio="xMinYMin meet">
        {state.drawings.map(path => (
          <polyline
            key={path.id}
            className="drawing-path"
            points={toPointString(path.points)}
            stroke={path.color}
            strokeWidth={path.strokeWidth || getStrokeWidthForColor()}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}
        {isPenTool && state.drawing.active && state.drawing.points.length > 1 && (
          <polyline
            className="drawing-path drawing-path--current"
            points={toPointString(state.drawing.points)}
            stroke={state.drawing.color}
            strokeWidth={getStrokeWidthForColor()}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
      </svg>
    </div>
  );
};

export default DrawingLayer;

