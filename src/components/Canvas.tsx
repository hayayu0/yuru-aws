import React, { useRef, useEffect, useCallback } from 'react';
import { useAppState } from '../hooks/useAppState';
import { useAppActions } from '../hooks/useAppActions';
import { awsServices, elementSize } from '../types/aws';
import { getSVGCoordinates } from '../utils/coordinates';
import { getElementsInMarquee, getEdgesInMarquee } from '../utils/marqueeSelection';
import GridBackground from './GridBackground';
import DiagramSVG from './DiagramSVG';
import MarqueeSelection from './MarqueeSelection';
import InlineTextEditor from './InlineTextEditor';
import type { Node } from '../types';

const Canvas: React.FC = () => {
  const svgRef = useRef<SVGSVGElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const pendingFrameRef = useRef<{ kind: string; startX: number; startY: number } | null>(null);
  const { state } = useAppState();
  const {
    addNode,
    addFrame,
    setNodeToAdd,
    setSelectedNodes,
    setSelectedFrames,
    setSelectedEdges,
    setPendingEdge,
    setPendingFrame,
    addEdge,
    setDragInfo,
    setResizeInfo,
    setMarqueeInfo,
    setActiveTool,
    updateNode,
    updateFrame,
    deleteNodes,
    deleteFrames,
    deleteEdges,
  } = useAppActions();

  const resetCursor = useCallback(() => {
    if (svgRef.current) {
      svgRef.current.style.cursor = state.activeTool === 'arrow' ? 'crosshair' : 'default';
    }
  }, [state.activeTool]);

  // Mouse event handlers with useCallback to prevent unnecessary re-renders
  const handleMouseDown = useCallback((event: MouseEvent) => {
    if (event.button !== 0) return; // Only left-click

    const coords = getSVGCoordinates(event, svgRef.current);
    const element = (event.target as Element).closest('[data-type]');
    const elementType = element?.getAttribute('data-type');
    const resizeHandle = (event.target as Element).closest('.resize-handle');

    // Priority 1: Add a new element if one is pending
    if (state.nodeToAdd) {
      const serviceConfig = awsServices[state.nodeToAdd];
      if (!serviceConfig) return;

      if (serviceConfig.isFrame) {
        setPendingFrame({
          kind: state.nodeToAdd,
          startX: coords.x,
          startY: coords.y,
          currentX: coords.x,
          currentY: coords.y,
        });
        event.stopPropagation();
        return;
      }

      // Calculate next available ID
      const allIds = [...state.nodes.map(n => n.id), ...state.frames.map(f => f.id), ...state.edges.map(e => e.id)];
      const maxId = allIds.length > 0 ? Math.max(...allIds) : 0;
      const nextAvailableId = Math.max(state.nextId, maxId + 1);

      const newNode: Node = {
        id: nextAvailableId,
        kind: state.nodeToAdd,
        x: coords.x - elementSize.defaultNodeWidth / 2,
        y: coords.y - elementSize.defaultNodeHeight / 2,
        label: null,
      };

      addNode(newNode);
      setNodeToAdd(null);
      resetCursor();
      return;
    }

    // Handle different tools
    if (state.activeTool === 'select') {
      // Priority 1: Check if clicked on a resize handle
      if (resizeHandle) {
        const frameId = parseInt(resizeHandle.getAttribute('data-frame-id') || '0', 10);
        const handle = resizeHandle.getAttribute('data-handle') || '';
        const frame = state.frames.find(f => f.id === frameId);

        if (frame) {
          setResizeInfo({
            frameId,
            handle,
            startX: coords.x,
            startY: coords.y,
            startWidth: frame.width,
            startHeight: frame.height,
            startFrameX: frame.x,
            startFrameY: frame.y,
          });

          event.stopPropagation();
          return;
        }
      }

      // Priority 2: Check if clicked on an edge
      const edgeTarget = (event.target as Element).closest('.edge-path');
      if (edgeTarget) {
        const edgeId = parseInt(edgeTarget.getAttribute('data-edge-id') || '0', 10);

        if (!event.shiftKey) {
          setSelectedEdges([edgeId]);
          setSelectedNodes([]);
          setSelectedFrames([]);
        } else {
          if (state.selectedEdgeIds.includes(edgeId)) {
            setSelectedEdges(state.selectedEdgeIds.filter(id => id !== edgeId));
          } else {
            setSelectedEdges([...state.selectedEdgeIds, edgeId]);
          }
        }
        return;
      }

      // Priority 3: Check if clicked on a frame or node
      if (element && elementType) {
        const id = parseInt(element.getAttribute('data-id') || '0', 10);

        if (elementType === 'frame') {
          const frame = state.frames.find(f => f.id === id);
          if (!frame) {
            return;
          }

          if (state.selectedEdgeIds.length > 0) {
            setSelectedEdges([]);
          }

          const frameAlreadySelected = state.selectedFrameIds.includes(id);

          if (!event.shiftKey) {
            if (!frameAlreadySelected) {
              setSelectedFrames([id]);
              setSelectedNodes([]);
            }
          } else {
            setSelectedFrames(frameAlreadySelected
              ? state.selectedFrameIds.filter(frameId => frameId !== id)
              : [...state.selectedFrameIds, id]);
          }

          const dragFrameIds = frameAlreadySelected ? state.selectedFrameIds : [id];
          const dragNodeIds = frameAlreadySelected ? state.selectedNodeIds : [];

          const framePositions: { [frameId: number]: { x: number; y: number } } = {};
          dragFrameIds.forEach(frameId => {
            const dragFrame = state.frames.find(f => f.id === frameId);
            if (dragFrame) {
              framePositions[frameId] = { x: dragFrame.x, y: dragFrame.y };
            }
          });

          const nodePositions: { [nodeId: number]: { x: number; y: number } } = {};
          dragNodeIds.forEach(nodeId => {
            const dragNode = state.nodes.find(n => n.id === nodeId);
            if (dragNode) {
              nodePositions[nodeId] = { x: dragNode.x, y: dragNode.y };
            }
          });

          setDragInfo({
            nodeIds: dragNodeIds,
            frameIds: dragFrameIds,
            startX: coords.x,
            startY: coords.y,
            nodePositions,
            framePositions,
          });
          return;
        }

        if (elementType === 'node' && element) {
          const node = state.nodes.find(n => n.id === id);
          if (!node) {
            return;
          }

          if (state.selectedEdgeIds.length > 0) {
            setSelectedEdges([]);
          }

          const nodeAlreadySelected = state.selectedNodeIds.includes(id);

          if (!event.shiftKey) {
            if (!nodeAlreadySelected) {
              setSelectedNodes([id]);
              setSelectedFrames([]);
            }
          } else {
            setSelectedNodes(nodeAlreadySelected
              ? state.selectedNodeIds.filter(nodeId => nodeId !== id)
              : [...state.selectedNodeIds, id]);
          }

          const dragNodeIds = nodeAlreadySelected ? state.selectedNodeIds : [id];
          const dragFrameIds = nodeAlreadySelected ? state.selectedFrameIds : [];

          const nodePositions: { [nodeId: number]: { x: number; y: number } } = {};
          dragNodeIds.forEach(nodeId => {
            const dragNode = state.nodes.find(n => n.id === nodeId);
            if (dragNode) {
              nodePositions[nodeId] = { x: dragNode.x, y: dragNode.y };
            }
          });

          const framePositions: { [frameId: number]: { x: number; y: number } } = {};
          dragFrameIds.forEach(frameId => {
            const dragFrame = state.frames.find(f => f.id === frameId);
            if (dragFrame) {
              framePositions[frameId] = { x: dragFrame.x, y: dragFrame.y };
            }
          });

          setDragInfo({
            nodeIds: dragNodeIds,
            frameIds: dragFrameIds,
            startX: coords.x,
            startY: coords.y,
            nodePositions,
            framePositions,
          });
          return;
        }
      }

      // Clicked on empty space: clear selection (unless shift) and start marquee
      if (!event.shiftKey) {
        setSelectedNodes([]);
        setSelectedFrames([]);
        setSelectedEdges([]);
      }

      setMarqueeInfo({
        startX: coords.x,
        startY: coords.y,
        currentX: coords.x,
        currentY: coords.y,
        isActive: true,
      });
    } else if (state.activeTool === 'arrow') {
      if ((elementType === 'node' || elementType === 'frame') && element) {
        const elementId = parseInt(element.getAttribute('data-id') || '0', 10);

        if (!state.pendingEdge) {
          setPendingEdge({
            from: elementId,
            initialMousePos: coords,
          });
        } else if (state.pendingEdge.from !== elementId) {
          // Calculate next available ID
          const allIds = [...state.nodes.map(n => n.id), ...state.frames.map(f => f.id), ...state.edges.map(e => e.id)];
          const maxId = allIds.length > 0 ? Math.max(...allIds) : 0;
          const nextAvailableId = Math.max(state.nextId, maxId + 1);

          addEdge({
            id: nextAvailableId,
            from: state.pendingEdge.from,
            to: elementId,
          });
          setPendingEdge(null);
        }
      } else {
        setPendingEdge(null);
        setActiveTool('select');
      }
    }
  }, [
    state.activeTool,
    state.frames,
    state.marqueeInfo,
    state.nodeToAdd,
    state.nodes,
    state.pendingEdge,
    state.selectedEdgeIds,
    state.selectedFrameIds,
    state.selectedNodeIds,
    state.nextId,
    addEdge,
    addFrame,
    addNode,
    resetCursor,
    setActiveTool,
    setDragInfo,
    setMarqueeInfo,
    setNodeToAdd,
    setPendingEdge,
    setPendingFrame,
    setResizeInfo,
    setSelectedEdges,
    setSelectedFrames,
    setSelectedNodes,
  ]);

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

  const handleMouseUp = useCallback((event: MouseEvent) => {
    const coords = getSVGCoordinates(event, svgRef.current);

    if (state.pendingFrame) {
      const { kind, startX, startY } = state.pendingFrame;
      setPendingFrame(null);

      const endX = coords.x;
      const endY = coords.y;

      let width = Math.abs(endX - startX);
      let height = Math.abs(endY - startY);
      const x = Math.min(startX, endX);
      const y = Math.min(startY, endY);

      if (width < elementSize.frameMinWidth) {
        width = elementSize.frameMinWidth;
      }
      if (height < elementSize.frameMinHeight) {
        height = elementSize.frameMinHeight;
      }

      // Calculate next available ID
      const allIds = [...state.nodes.map(n => n.id), ...state.frames.map(f => f.id), ...state.edges.map(e => e.id)];
      const maxId = allIds.length > 0 ? Math.max(...allIds) : 0;
      const nextAvailableId = Math.max(state.nextId, maxId + 1);
      
      addFrame({
        id: nextAvailableId,
        kind,
        x,
        y,
        width,
        height,
        label: null,
      });

      setNodeToAdd(null);
      resetCursor();
      return;
    }

    if (state.marqueeInfo && state.marqueeInfo.isActive) {
      const nodesInMarquee = getElementsInMarquee(state.nodes, state.marqueeInfo);
      const framesInMarquee = getElementsInMarquee(state.frames, state.marqueeInfo);
      const edgesInMarquee = getEdgesInMarquee(state.edges, state.nodes, state.frames, state.marqueeInfo);

      if (event.shiftKey) {
        const combinedNodeSelection = [...new Set([...state.selectedNodeIds, ...nodesInMarquee])];
        const combinedFrameSelection = [...new Set([...state.selectedFrameIds, ...framesInMarquee])];
        const combinedEdgeSelection = [...new Set([...state.selectedEdgeIds, ...edgesInMarquee])];
        setSelectedNodes(combinedNodeSelection);
        setSelectedFrames(combinedFrameSelection);
        setSelectedEdges(combinedEdgeSelection);
      } else {
        setSelectedNodes(nodesInMarquee);
        setSelectedFrames(framesInMarquee);
        setSelectedEdges(edgesInMarquee);
      }

      setMarqueeInfo(null);
      return;
    }

    if (state.dragInfo) {
      setDragInfo(null);
    }

    if (state.resizeInfo) {
      setResizeInfo(null);
      resetCursor();
    } else {
      resetCursor();
    }
  }, [
    state.dragInfo,
    state.edges,
    state.frames,
    state.marqueeInfo,
    state.nextId,
    state.nodes,
    state.resizeInfo,
    state.selectedEdgeIds,
    state.selectedFrameIds,
    state.selectedNodeIds,
    state.pendingFrame,
    addFrame,
    resetCursor,
    setDragInfo,
    setMarqueeInfo,
    setNodeToAdd,
    setResizeInfo,
    setSelectedEdges,
    setSelectedFrames,
    setSelectedNodes,
    setPendingFrame,
  ]);

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
        pendingFrameRef.current = null;
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
  ]);

  // Set up mouse event listeners
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    svg.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      svg.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseDown, handleMouseMove, handleMouseUp]);

  // Set up global keyboard event listeners
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

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

  // Update cursor when nodeToAdd changes
  useEffect(() => {
    if (svgRef.current) {
      svgRef.current.style.cursor = state.nodeToAdd ? 'copy' : state.activeTool === 'arrow' ? 'crosshair' : 'default';
    }
  }, [state.nodeToAdd, state.activeTool]);

  return (
    <div id="canvas-wrapper" className="canvas-wrapper" ref={wrapperRef}>
      <svg
        ref={svgRef}
        id="diagramCanvas"
        tabIndex={0}
        role="application"
        aria-label="AWS Diagram"
        xmlns="http://www.w3.org/2000/svg"
        style={{
          width: '100%',
          height: '100%',
          background: 'url(#grid)'
        }}
      >
        <GridBackground />
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
        <rect
          width="100%"
          height="100%"
          fill="url(#grid)"
        />
        
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