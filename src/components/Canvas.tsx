import React, { useRef, useEffect, useCallback, useState } from 'react';
import { useAppState } from '../hooks/useAppState';
import { useAppActions } from '../hooks/useAppActions';
import { useMouseEventManager } from '../hooks/useMouseEventManager';
import { getSVGCoordinates } from '../utils/coordinates';
import { exportSelectionToEncodedMxGraph, parseMxGraphClipboard } from '../utils/clipboardMxGraph';
import { elementSize } from '../types/aws';
import GridBackground from './GridBackground';
import DiagramSVG from './DiagramSVG';
import MarqueeSelection from './MarqueeSelection';
import InlineTextEditor from './InlineTextEditor';

const DEFAULT_CANVAS_SCALE = 48 / 78;
const MIN_CANVAS_SCALE = 0.25;
const MAX_CANVAS_SCALE = 3;
const ZOOM_STEP_IN = 1.1;
const ZOOM_STEP_OUT = 0.9;
const ZOOM_IN_EVENT = 'yuruaws:zoom-in';
const ZOOM_OUT_EVENT = 'yuruaws:zoom-out';
const GRID_VISIBILITY_EVENT = 'yuruaws:grid-visibility';

const Canvas: React.FC = () => {
  const svgRef = useRef<SVGSVGElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const pasteSequenceRef = useRef(0);
  const pasteShortcutLockedRef = useRef(false);
  const [showGrid, setShowGrid] = useState(true);
  const [canvasScale, setCanvasScale] = useState(DEFAULT_CANVAS_SCALE);
  const [canvasViewport, setCanvasViewport] = useState({ width: 1, height: 1 });
  const clampScale = useCallback((value: number) => (
    Math.min(MAX_CANVAS_SCALE, Math.max(MIN_CANVAS_SCALE, value))
  ), []);

  const zoomIn = useCallback(() => {
    setCanvasScale((prevScale) => clampScale(prevScale * ZOOM_STEP_IN));
  }, [clampScale]);

  const zoomOut = useCallback(() => {
    setCanvasScale((prevScale) => clampScale(prevScale * ZOOM_STEP_OUT));
  }, [clampScale]);
  const { state } = useAppState();
  const {
    setMarqueeInfo,
    updateNode,
    updateFrame,
    deleteNodes,
    deleteFrames,
    deleteEdges,
    setSelectedNodes,
    setSelectedFrames,
    setSelectedEdges,
    setPendingFrame,
    setNodeToAdd,
    setPendingEdge,
    setEditingNodeId,
    setPendingEditNodeId,
    loadState,
  } = useAppActions();
  
  const {
    handleCanvasMouseDown,
    handleCanvasMouseUp,
    handleDoubleClick,
    resetCursor,
  } = useMouseEventManager(svgRef);

  const handleMouseMove = useCallback((event: MouseEvent) => {
    const coords = getSVGCoordinates(event, svgRef.current);

    // Handle pending frame update
    if (state.pendingFrame) {
      setPendingFrame({
        ...state.pendingFrame,
        currentX: coords.x,
        currentY: coords.y,
      });
      return;
    }

    // Handle marquee selection update
    if (state.marqueeInfo && state.marqueeInfo.isActive) {
      setMarqueeInfo({
        ...state.marqueeInfo,
        currentX: coords.x,
        currentY: coords.y,
      });
      return;
    }

    // Handle dragging
    if (state.dragInfo) {
      const deltaX = coords.x - state.dragInfo.startX;
      const deltaY = coords.y - state.dragInfo.startY;

      state.dragInfo.nodeIds.forEach(nodeId => {
        const startPos = state.dragInfo?.nodePositions[nodeId];
        if (startPos) {
          updateNode(nodeId, {
            x: startPos.x + deltaX,
            y: startPos.y + deltaY,
          });
        }
      });

      state.dragInfo.frameIds.forEach(frameId => {
        const startPos = state.dragInfo?.framePositions[frameId];
        if (startPos) {
          updateFrame(frameId, {
            x: startPos.x + deltaX,
            y: startPos.y + deltaY,
          });
        }
      });
    }

    // Handle resizing (frames only)
    if (state.resizeInfo) {
      const resizeInfo = state.resizeInfo;
      const deltaX = coords.x - resizeInfo.startX;
      const deltaY = coords.y - resizeInfo.startY;
      const frame = state.frames.find(f => f.id === resizeInfo.frameId);
      
      if (frame) {
        if (resizeInfo.handle === 'se') {
          const newWidth = Math.max(elementSize.frameMinWidth, resizeInfo.startWidth + deltaX);
          const newHeight = Math.max(elementSize.frameMinHeight, resizeInfo.startHeight + deltaY);

          updateFrame(resizeInfo.frameId, {
            width: newWidth,
            height: newHeight,
          });

          if (svgRef.current) {
            svgRef.current.style.cursor = 'se-resize';
          }
        } else if (resizeInfo.handle === 'sw') {
          const newWidth = Math.max(elementSize.frameMinWidth, resizeInfo.startWidth - deltaX);
          const newHeight = Math.max(elementSize.frameMinHeight, resizeInfo.startHeight + deltaY);
          const newX = resizeInfo.startFrameX + (resizeInfo.startWidth - newWidth);

          updateFrame(resizeInfo.frameId, {
            x: newX,
            width: newWidth,
            height: newHeight,
          });

          if (svgRef.current) {
            svgRef.current.style.cursor = 'sw-resize';
          }
        } else if (resizeInfo.handle === 'ne') {
          const newWidth = Math.max(elementSize.frameMinWidth, resizeInfo.startWidth + deltaX);
          const newHeight = Math.max(elementSize.frameMinHeight, resizeInfo.startHeight - deltaY);
          const newY = resizeInfo.startFrameY + (resizeInfo.startHeight - newHeight);

          updateFrame(resizeInfo.frameId, {
            y: newY,
            width: newWidth,
            height: newHeight,
          });

          if (svgRef.current) {
            svgRef.current.style.cursor = 'ne-resize';
          }
        } else if (resizeInfo.handle === 'nw') {
          const newWidth = Math.max(elementSize.frameMinWidth, resizeInfo.startWidth - deltaX);
          const newHeight = Math.max(elementSize.frameMinHeight, resizeInfo.startHeight - deltaY);
          const newX = resizeInfo.startFrameX + (resizeInfo.startWidth - newWidth);
          const newY = resizeInfo.startFrameY + (resizeInfo.startHeight - newHeight);

          updateFrame(resizeInfo.frameId, {
            x: newX,
            y: newY,
            width: newWidth,
            height: newHeight,
          });

          if (svgRef.current) {
            svgRef.current.style.cursor = 'nw-resize';
          }
        }
      }
    }
  }, [state.dragInfo, state.resizeInfo, state.marqueeInfo, state.pendingFrame, updateFrame, updateNode, setMarqueeInfo, setPendingFrame]);

  const copySelectionToClipboard = useCallback(async () => {
    const encoded = exportSelectionToEncodedMxGraph(state);
    if (!encoded) {
      return;
    }
    if (!navigator.clipboard || typeof navigator.clipboard.writeText !== 'function') {
      console.warn('Clipboard write is not supported in this environment.');
      return;
    }
    try {
      await navigator.clipboard.writeText(encoded);
    } catch (error) {
      console.error('Failed to write clipboard data.', error);
    }
  }, [state]);

  const pasteFromClipboard = useCallback(async () => {
    if (!navigator.clipboard || typeof navigator.clipboard.readText !== 'function') {
      console.warn('Clipboard read is not supported in this environment.');
      return;
    }

    let clipboardText = '';
    try {
      clipboardText = await navigator.clipboard.readText();
    } catch (error) {
      console.error('Failed to read clipboard data.', error);
      return;
    }

    const parsed = parseMxGraphClipboard(clipboardText);
    if (!parsed) {
      return;
    }

    const usedIds = [...state.usedIds];
    const nextId = () => {
      for (let i = 1; i < usedIds.length; i += 1) {
        if (!usedIds[i]) {
          usedIds[i] = true;
          return i;
        }
      }
      throw new Error('No available IDs.');
    };

    const nextPasteStep = pasteSequenceRef.current + 1;
    const offset = nextPasteStep * 20;
    const idMap = new Map<string, number>();

    const framesToPaste = parsed.frames.map((frame) => {
      const id = nextId();
      idMap.set(frame.originalId, id);
      return {
        id,
        kind: frame.kind,
        x: frame.x + offset,
        y: frame.y + offset,
        width: frame.width,
        height: frame.height,
        label: frame.label ?? null,
      };
    });

    const nodesToPaste = parsed.nodes.map((node) => {
      const id = nextId();
      idMap.set(node.originalId, id);
      return {
        id,
        kind: node.kind,
        x: node.x + offset,
        y: node.y + offset,
        label: node.label ?? null,
      };
    });

    const edgesToPaste = parsed.edges.flatMap((edge) => {
      const from = idMap.get(edge.fromOriginalId);
      const to = idMap.get(edge.toOriginalId);
      if (!from || !to) {
        return [];
      }
      return [{
        id: nextId(),
        from,
        to,
      }];
    });

    if (framesToPaste.length === 0 && nodesToPaste.length === 0) {
      return;
    }

    loadState({
      nodes: [...state.nodes, ...nodesToPaste],
      frames: [...state.frames, ...framesToPaste],
      edges: [...state.edges, ...edgesToPaste],
    });

    setSelectedNodes(nodesToPaste.map((node) => node.id));
    setSelectedFrames(framesToPaste.map((frame) => frame.id));
    setSelectedEdges(edgesToPaste.map((edge) => edge.id));
    pasteSequenceRef.current = nextPasteStep;
  }, [state, loadState, setSelectedNodes, setSelectedFrames, setSelectedEdges]);

  // Keyboard event handler
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    const target = event.target as Element;
    const isTextInput =
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      (target as HTMLElement).contentEditable === 'true' ||
      target.getAttribute('contenteditable') === 'true';

    if (isTextInput) {
      return;
    }

    const key = event.key.toLowerCase();
    const isClipboardShortcut = (event.ctrlKey || event.metaKey) && !event.altKey;

    if (isClipboardShortcut && key === 'c') {
      event.preventDefault();
      void copySelectionToClipboard();
      return;
    }

    if (isClipboardShortcut && key === 'v') {
      event.preventDefault();
      if (pasteShortcutLockedRef.current) {
        return;
      }
      pasteShortcutLockedRef.current = true;
      void pasteFromClipboard();
      return;
    }

    // Arrow key movement (5px)
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
      event.preventDefault();
      
      const hasSelectedElements = state.selectedNodeIds.length > 0 || state.selectedFrameIds.length > 0;
      if (!hasSelectedElements) return;

      let deltaX = 0, deltaY = 0;
      switch (event.key) {
        case 'ArrowUp': deltaY = -5; break;
        case 'ArrowDown': deltaY = 5; break;
        case 'ArrowLeft': deltaX = -5; break;
        case 'ArrowRight': deltaX = 5; break;
      }

      state.selectedNodeIds.forEach(nodeId => {
        const node = state.nodes.find(n => n.id === nodeId);
        if (node) {
          updateNode(nodeId, { x: node.x + deltaX, y: node.y + deltaY });
        }
      });

      state.selectedFrameIds.forEach(frameId => {
        const frame = state.frames.find(f => f.id === frameId);
        if (frame) {
          updateFrame(frameId, { x: frame.x + deltaX, y: frame.y + deltaY });
        }
      });
      return;
    }

    if (event.key === 'Delete' || event.key === 'Backspace') {
      event.preventDefault();

      const hasNodes = state.selectedNodeIds.length > 0;
      const hasFrames = state.selectedFrameIds.length > 0;
      const hasEdges = state.selectedEdgeIds.length > 0;

      if (hasNodes) {
        deleteNodes(state.selectedNodeIds);
        setSelectedNodes([]);
      }

      if (hasFrames) {
        deleteFrames(state.selectedFrameIds);
        setSelectedFrames([]);
      }

      if (hasEdges) {
        deleteEdges(state.selectedEdgeIds);
        setSelectedEdges([]);
      }
    }

    if (event.key === 'Escape') {
      event.preventDefault();

      if (state.marqueeInfo && state.marqueeInfo.isActive) {
        setMarqueeInfo(null);
      }

      if (state.pendingEdge) {
        setPendingEdge(null);
      }

      if (state.nodeToAdd) {
        setNodeToAdd(null);
        resetCursor();
      }

      if (state.selectedNodeIds.length > 0) {
        setSelectedNodes([]);
      }

      if (state.selectedFrameIds.length > 0) {
        setSelectedFrames([]);
      }

      if (state.selectedEdgeIds.length > 0) {
        setSelectedEdges([]);
      }
    }
  }, [
    state.edges,
    state.marqueeInfo,
    state.nodeToAdd,
    state.pendingEdge,
    state.selectedEdgeIds,
    state.selectedFrameIds,
    state.selectedNodeIds,
    state.nodes,
    state.frames,
    deleteEdges,
    deleteFrames,
    deleteNodes,
    resetCursor,
    setMarqueeInfo,
    setNodeToAdd,
    setPendingEdge,
    setSelectedEdges,
    setSelectedFrames,
    setSelectedNodes,
    updateNode,
    updateFrame,
    copySelectionToClipboard,
    pasteFromClipboard,
  ]);

  // Set up mouse event listeners
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    svg.addEventListener('mousedown', handleCanvasMouseDown);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleCanvasMouseUp);
    svg.addEventListener('dblclick', handleDoubleClick);

    return () => {
      svg.removeEventListener('mousedown', handleCanvasMouseDown);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleCanvasMouseUp);
      svg.removeEventListener('dblclick', handleDoubleClick);
    };
  }, [handleCanvasMouseDown, handleMouseMove, handleCanvasMouseUp, handleDoubleClick]);

  // Set up global keyboard event listeners
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  useEffect(() => {
    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === 'v') {
        pasteShortcutLockedRef.current = false;
      }
    };

    document.addEventListener('keyup', handleKeyUp);
    return () => {
      document.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Disable canvas interactions while drawing tools are active
  useEffect(() => {
    if (!wrapperRef.current) {
      return;
    }
    const isDrawingTool =
      state.activeTool === 'pen-black' ||
      state.activeTool === 'pen-red' ||
      state.activeTool === 'penDelete';
    wrapperRef.current.style.pointerEvents = isDrawingTool ? 'none' : 'auto';
  }, [state.activeTool]);

  // Keep SVG viewBox aligned with the canvas wrapper size
  useEffect(() => {
    if (!wrapperRef.current) {
      return;
    }

    const wrapper = wrapperRef.current;
    const updateViewport = () => {
      setCanvasViewport({
        width: Math.max(1, wrapper.clientWidth),
        height: Math.max(1, wrapper.clientHeight),
      });
    };

    updateViewport();
    const resizeObserver = new ResizeObserver(updateViewport);
    resizeObserver.observe(wrapper);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  // Zoom only inside the diagram canvas area with the mouse wheel
  useEffect(() => {
    if (!wrapperRef.current) {
      return;
    }

    const wrapper = wrapperRef.current;

    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();
      if (event.deltaY < 0) {
        zoomIn();
      } else {
        zoomOut();
      }
    };

    wrapper.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      wrapper.removeEventListener('wheel', handleWheel);
    };
  }, [zoomIn, zoomOut]);

  useEffect(() => {
    const handleZoomIn = () => zoomIn();
    const handleZoomOut = () => zoomOut();
    window.addEventListener(ZOOM_IN_EVENT, handleZoomIn);
    window.addEventListener(ZOOM_OUT_EVENT, handleZoomOut);
    return () => {
      window.removeEventListener(ZOOM_IN_EVENT, handleZoomIn);
      window.removeEventListener(ZOOM_OUT_EVENT, handleZoomOut);
    };
  }, [zoomIn, zoomOut]);

  useEffect(() => {
    const handleGridVisibility = (event: Event) => {
      const customEvent = event as CustomEvent<boolean>;
      if (typeof customEvent.detail === 'boolean') {
        setShowGrid(customEvent.detail);
      }
    };
    window.addEventListener(GRID_VISIBILITY_EVENT, handleGridVisibility);
    return () => {
      window.removeEventListener(GRID_VISIBILITY_EVENT, handleGridVisibility);
    };
  }, []);

  const viewBoxWidth = canvasViewport.width / canvasScale;
  const viewBoxHeight = canvasViewport.height / canvasScale;

  // Update cursor when nodeToAdd changes
  useEffect(() => {
    if (svgRef.current) {
      svgRef.current.style.cursor = state.nodeToAdd ? 'copy' : state.activeTool === 'arrow' ? 'crosshair' : 'default';
    }
  }, [state.nodeToAdd, state.activeTool]);

  // Handle pendingEditNodeId to start editing the most recently added node
  useEffect(() => {
    if (state.pendingEditNodeId === -1) {
      const firstSelectedNodeId = state.selectedNodeIds[0];
      if (firstSelectedNodeId !== undefined) {
        setEditingNodeId(firstSelectedNodeId);
        setPendingEditNodeId(null);
      }
    }
  }, [state.pendingEditNodeId, state.selectedNodeIds, setEditingNodeId, setPendingEditNodeId]);

  return (
    <div id="canvas-wrapper" className="canvas-wrapper" ref={wrapperRef}>
      <svg
        ref={svgRef}
        id="diagramCanvas"
        tabIndex={0}
        role="application"
        aria-label="AWS Diagram"
        xmlns="http://www.w3.org/2000/svg"
        viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
        preserveAspectRatio="xMinYMin meet"
        style={{
          width: '100%',
          height: '100%',
          background: '#ffffff'
        }}
      >
        {showGrid && <GridBackground />}
        <defs>
          {/* Regular arrow marker */}
          <marker
              id="arrowHead"
              orient="auto"
              markerUnits="strokeWidth"
              markerWidth="7"
              markerHeight="5"
              refX="7"
              refY="2.5"
            >
              <path d="M0,0 L7,2.5 L0,5 Z" fill="#1f3aad"></path>
          </marker>
          
          {/* Hand-drawn style arrow marker */}
          <marker
              id="roughArrowHead"
              orient="auto"
              markerUnits="strokeWidth"
              markerWidth="12"
              markerHeight="6.5"
              refX="8.5"
              refY="3.25"
            >
              <path 
                d="M0.4,0.5 L8.5,3.25 L0.4,6 Z" 
                fill="#1f3aad"
                stroke="#1f3aad"
                strokeWidth="0.6"
              />
          </marker>
          
          {/* Selected hand-drawn style arrow marker */}
          <marker
              id="roughArrowHeadSelected"
              orient="auto"
              markerUnits="strokeWidth"
              markerWidth="9"
              markerHeight="6.5"
              refX="8.5"
              refY="3.25"
            >
              <path 
                d="M0.4,0.5 L8.5,3.25 L0.4,6 Z" 
                fill="#a00000"
                stroke="#a00000"
                strokeWidth="0.6"
              />
          </marker>
          
          {/* Selected regular arrow marker */}
          <marker
              id="arrowHeadSelected"
              orient="auto"
              markerUnits="strokeWidth"
              markerWidth="7"
              markerHeight="5"
              refX="7"
              refY="2.5"
            >
              <path d="M0,0 L7,2.5 L0,5 Z" fill="#a00000"></path>
          </marker>
        </defs>
        
        {/* Grid background rectangle */}
        {showGrid && (
          <rect
            width="100%"
            height="100%"
            fill="url(#grid)"
          />
        )}
        
        {/* Diagram SVG with structured layers */}
        <DiagramSVG svgRef={svgRef} />
        
        {/* Marquee selection overlay */}
        {state.marqueeInfo && (
          <MarqueeSelection marqueeInfo={state.marqueeInfo} />
        )}
      </svg>
      <InlineTextEditor svgRef={svgRef} wrapperRef={wrapperRef} />
    </div>
  );
};

export default Canvas;
