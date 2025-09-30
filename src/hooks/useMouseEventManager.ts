import { useCallback } from 'react';
import { useAppState } from './useAppState';
import { useAppActions } from './useAppActions';
import { getSVGCoordinates } from '../utils/coordinates';
import { elementSize } from '../types/aws';

export const useMouseEventManager = (svgRef: React.RefObject<SVGSVGElement | null>) => {
  const { state } = useAppState();
  const {
    addNode,
    addFrame,
    setNodeToAdd,
    setSelectedNodes,
    setSelectedFrames,
    setSelectedEdges,
    setPendingFrame,
    setPendingEdge,
    addEdge,
    setDragInfo,
    setResizeInfo,
    setMarqueeInfo,
    setActiveTool,
    setInteractionMode,
    setEditingNodeId,
    setPendingEditNodeId,
  } = useAppActions();

  const toggleSelection = (selectedIds: number[], id: number) => {
    if (selectedIds.includes(id)) {
      return selectedIds.filter(selectedId => selectedId !== id);
    }
    return [...selectedIds, id];
  };

  const resetCursor = useCallback(() => {
    if (svgRef.current) {
      svgRef.current.style.cursor = state.activeTool === 'arrow' ? 'crosshair' : 'default';
    }
  }, [state.activeTool, svgRef]);

  const handleCanvasMouseDown = useCallback((event: MouseEvent) => {
    if (event.button !== 0) return;

    const coords = getSVGCoordinates(event, svgRef.current);
    const element = (event.target as Element).closest('[data-element-type]');
    const elementType = element?.getAttribute('data-element-type');
    const elementIdAttr = element?.getAttribute('data-element-id');
    const elementId = elementIdAttr ? Number.parseInt(elementIdAttr, 10) : NaN;
    const resizeHandle = (event.target as Element).closest('.resize-handle');

    // Handle node/frame creation modes
    if (state.interactionMode === 'createNodeReady') {
      // Do nothing on mousedown for nodes
      event.stopPropagation();
      return;
    } else if (state.interactionMode === 'createFrameReady') {
      // Start frame creation on mousedown
      if (state.nodeToAdd) {
        setPendingFrame({
          kind: state.nodeToAdd,
          startX: coords.x,
          startY: coords.y,
          currentX: coords.x,
          currentY: coords.y,
        });
      }
      event.stopPropagation();
      return;
    }

    // Handle existing element interactions
    if (state.interactionMode === 'createEdgeReady') {
      // Start edge creation
      if (element && (elementType === 'node' || elementType === 'frame') && !Number.isNaN(elementId)) {
        setPendingEdge({ from: elementId });
        setInteractionMode('drawingEdge');
        event.stopPropagation();
        return;
      }
      
      // Click on empty space - return to select mode
      setActiveTool('select');
      event.stopPropagation();
      return;
    } else if (state.interactionMode === 'drawingEdge') {
      // Complete edge creation
      if (element && (elementType === 'node' || elementType === 'frame') && !Number.isNaN(elementId)) {
        if (state.pendingEdge && state.pendingEdge.from !== elementId) {
          addEdge({
            from: state.pendingEdge.from,
            to: elementId,
          });
        }
        
        setPendingEdge(null);
        setInteractionMode('createEdgeReady');
        event.stopPropagation();
        return;
      }
      
      // Click on empty space - return to select mode
      setPendingEdge(null);
      setActiveTool('select');
      event.stopPropagation();
      return;
    } else if (state.interactionMode === 'select') {
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

      // Handle element selection and drag
            if (element && elementType && !Number.isNaN(elementId)) {
        if (elementType === 'node') {
          handleNodeMouseDown(elementId, event, coords);
        } else if (elementType === 'frame') {
          handleFrameMouseDown(elementId, event, coords);
        } else if (elementType === 'edge') {
          handleEdgeMouseDown(elementId, event);
        }
        return;
      }

      // Start marquee selection
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
    }
  }, [state, svgRef, setPendingEdge, addEdge, setInteractionMode, setActiveTool]);

  const handleCanvasMouseUp = useCallback((event: MouseEvent) => {
    const coords = getSVGCoordinates(event, svgRef.current);

    // Priority 1: Complete frame creation
    if (state.pendingFrame) {
      const { kind, startX, startY } = state.pendingFrame;
      let width = Math.abs(coords.x - startX);
      let height = Math.abs(coords.y - startY);
      
      setPendingFrame(null);
      
      width = Math.max(width, elementSize.frameMinWidth)
      height = Math.max(height, elementSize.frameMinHeight)

      addFrame({
        kind,
        x: Math.min(startX, coords.x),
        y: Math.min(startY, coords.y),
        width,
        height,
        label: null,
      });
      
      setNodeToAdd(null);
      setInteractionMode('select');
      return;
    }

    // Priority 2: Create node
    if (state.interactionMode === 'createNodeReady' && state.nodeToAdd) {
      if (coords.x >= 0 && coords.y >= 0) {
        const newNode = {
          kind: state.nodeToAdd,
          x: coords.x - elementSize.defaultNodeWidth / 2,
          y: coords.y - elementSize.defaultNodeHeight / 2,
          label: null,
        };
        addNode(newNode);
        setPendingEditNodeId(-1); // Use -1 as a signal to edit the most recently added node
      }

      if (event.ctrlKey || event.metaKey) {
        return;
      }

      setNodeToAdd(null);
      setInteractionMode('select');
      return;
    }

    // End marquee selection
    if (state.marqueeInfo?.isActive) {
      const { startX, startY } = state.marqueeInfo;
      const minX = Math.min(startX, coords.x);
      const maxX = Math.max(startX, coords.x);
      const minY = Math.min(startY, coords.y);
      const maxY = Math.max(startY, coords.y);

      // Select nodes within marquee
      const selectedNodeIds = state.nodes
        .filter(node => {
          const nodeRight = node.x + elementSize.defaultNodeWidth;
          const nodeBottom = node.y + (node.kind === 'TextBox' ? 36 : elementSize.defaultNodeHeight);
          return node.x >= minX && nodeRight <= maxX && node.y >= minY && nodeBottom <= maxY;
        })
        .map(node => node.id);

      // Select frames within marquee
      const selectedFrameIds = state.frames
        .filter(frame => {
          const frameRight = frame.x + frame.width;
          const frameBottom = frame.y + frame.height;
          return frame.x >= minX && frameRight <= maxX && frame.y >= minY && frameBottom <= maxY;
        })
        .map(frame => frame.id);

      // Select edges where endpoints are in marquee but nodes/frames might not be fully selected
      const selectedEdgeIds = state.edges
        .filter(edge => {
          const fromNode = state.nodes.find(n => n.id === edge.from) || state.frames.find(f => f.id === edge.from);
          const toNode = state.nodes.find(n => n.id === edge.to) || state.frames.find(f => f.id === edge.to);
          
          if (!fromNode || !toNode) return false;
          
          // Calculate edge endpoints (center of nodes/frames)
          const fromCenterX = fromNode.x + ('width' in fromNode ? (fromNode as any).width : elementSize.defaultNodeWidth) / 2;
          const fromCenterY = fromNode.y + ('height' in fromNode ? (fromNode as any).height : elementSize.defaultNodeHeight) / 2;
          const toCenterX = toNode.x + ('width' in toNode ? (toNode as any).width : elementSize.defaultNodeWidth) / 2;
          const toCenterY = toNode.y + ('height' in toNode ? (toNode as any).height : elementSize.defaultNodeHeight) / 2;
          
          // Check if either endpoint is within marquee
          const fromInMarquee = fromCenterX >= minX && fromCenterX <= maxX && fromCenterY >= minY && fromCenterY <= maxY;
          const toInMarquee = toCenterX >= minX && toCenterX <= maxX && toCenterY >= minY && toCenterY <= maxY;
          
          return fromInMarquee || toInMarquee;
        })
        .map(edge => edge.id);

      if (event.shiftKey) {
        setSelectedNodes([...state.selectedNodeIds, ...selectedNodeIds]);
        setSelectedFrames([...state.selectedFrameIds, ...selectedFrameIds]);
        setSelectedEdges([...state.selectedEdgeIds, ...selectedEdgeIds]);
      } else {
        setSelectedNodes(selectedNodeIds);
        setSelectedFrames(selectedFrameIds);
        setSelectedEdges(selectedEdgeIds);
      }

      setMarqueeInfo(null);
    }

    // Clear drag and resize states
    setDragInfo(null);
    setResizeInfo(null);
    setPendingFrame(null);
  }, [state, svgRef, addNode, addFrame, setPendingEditNodeId, setNodeToAdd, resetCursor, setMarqueeInfo, setDragInfo, setResizeInfo, setPendingFrame, setPendingEdge]);

  const handleNodeMouseDown = useCallback((nodeId: number, event: MouseEvent, coords: { x: number; y: number }) => {
    const node = state.nodes.find(n => n.id === nodeId);
    if (!node) return;

    const isToggleModifier = event.ctrlKey || event.metaKey || event.shiftKey;

    if (!isToggleModifier && state.selectedEdgeIds.length > 0) {
      setSelectedEdges([]);
    }

    const nodeAlreadySelected = state.selectedNodeIds.includes(nodeId);
    let nextSelectedNodes = state.selectedNodeIds;

    if (isToggleModifier) {
      nextSelectedNodes = toggleSelection(state.selectedNodeIds, nodeId);
      setSelectedNodes(nextSelectedNodes);
    } else if (!nodeAlreadySelected) {
      nextSelectedNodes = [nodeId];
      setSelectedNodes(nextSelectedNodes);
      setSelectedFrames([]);
    }

    if (!nextSelectedNodes.includes(nodeId)) {
      return;
    }

    const dragNodeIds = nextSelectedNodes;
    const dragFrameIds = state.selectedFrameIds;

    const nodePositions: { [nodeId: number]: { x: number; y: number } } = {};
    dragNodeIds.forEach(id => {
      const dragNode = state.nodes.find(n => n.id === id);
      if (dragNode) {
        nodePositions[id] = { x: dragNode.x, y: dragNode.y };
      }
    });

    const framePositions: { [frameId: number]: { x: number; y: number } } = {};
    dragFrameIds.forEach(id => {
      const dragFrame = state.frames.find(f => f.id === id);
      if (dragFrame) {
        framePositions[id] = { x: dragFrame.x, y: dragFrame.y };
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
  }, [state, setSelectedNodes, setSelectedFrames, setSelectedEdges, setDragInfo]);

  const handleFrameMouseDown = useCallback((frameId: number, event: MouseEvent, coords: { x: number; y: number }) => {
    const frame = state.frames.find(f => f.id === frameId);
    if (!frame) return;

    const isToggleModifier = event.ctrlKey || event.metaKey || event.shiftKey;

    if (!isToggleModifier && state.selectedEdgeIds.length > 0) {
      setSelectedEdges([]);
    }

    const frameAlreadySelected = state.selectedFrameIds.includes(frameId);
    let nextSelectedFrames = state.selectedFrameIds;

    if (isToggleModifier) {
      nextSelectedFrames = toggleSelection(state.selectedFrameIds, frameId);
      setSelectedFrames(nextSelectedFrames);
    } else if (!frameAlreadySelected) {
      nextSelectedFrames = [frameId];
      setSelectedFrames(nextSelectedFrames);
      setSelectedNodes([]);
    }

    if (!nextSelectedFrames.includes(frameId)) {
      return;
    }

    const dragFrameIds = nextSelectedFrames;
    const dragNodeIds = state.selectedNodeIds;

    const framePositions: { [frameId: number]: { x: number; y: number } } = {};
    dragFrameIds.forEach(id => {
      const dragFrame = state.frames.find(f => f.id === id);
      if (dragFrame) {
        framePositions[id] = { x: dragFrame.x, y: dragFrame.y };
      }
    });

    const nodePositions: { [nodeId: number]: { x: number; y: number } } = {};
    dragNodeIds.forEach(id => {
      const dragNode = state.nodes.find(n => n.id === id);
      if (dragNode) {
        nodePositions[id] = { x: dragNode.x, y: dragNode.y };
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
  }, [state, setSelectedFrames, setSelectedNodes, setSelectedEdges, setDragInfo]);

  const handleEdgeMouseDown = useCallback((edgeId: number, event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();

    const edgeAlreadySelected = state.selectedEdgeIds.includes(edgeId);

    if (event.ctrlKey || event.metaKey || event.shiftKey) {
      setSelectedEdges(toggleSelection(state.selectedEdgeIds, edgeId));
    } else {
      if (!edgeAlreadySelected || state.selectedEdgeIds.length !== 1) {
        setSelectedEdges([edgeId]);
      }
      setSelectedNodes([]);
      setSelectedFrames([]);
    }
  }, [state.selectedEdgeIds, setSelectedEdges, setSelectedNodes, setSelectedFrames]);

  const handleDoubleClick = useCallback((event: MouseEvent) => {
    const element = (event.target as Element).closest('[data-element-type]');
    const elementType = element?.getAttribute('data-element-type');
    const elementIdAttr = element?.getAttribute('data-element-id');
    const elementId = elementIdAttr ? Number.parseInt(elementIdAttr, 10) : NaN;
    
    if (element && elementType && !Number.isNaN(elementId)) {
      const id = elementId;
      const textElement = (event.target as Element).closest('text');
      
      if (textElement) {
        if (elementType === 'node' && !state.selectedNodeIds.includes(id)) {
          setSelectedNodes([id]);
        } else if (elementType === 'frame' && !state.selectedFrameIds.includes(id)) {
          setSelectedFrames([id]);
        }
        setEditingNodeId(id);
      }
    }
  }, [state, setSelectedNodes, setSelectedFrames, setEditingNodeId]);

  return {
    handleCanvasMouseDown,
    handleCanvasMouseUp,
    handleDoubleClick,
    resetCursor,
  };
};