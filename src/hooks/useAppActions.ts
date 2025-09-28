import { useCallback } from "react";
import { useAppState } from "./useAppState";
import type {
  Node,
  Frame,
  Edge,
  ToolType,
  PendingEdge,
  ResizeInfo,
  DragInfo,
  MarqueeInfo,
  DrawingState,
  FreehandPath,
  AppState,

} from "../types";

// Custom hook that provides convenient action creators
export const useAppActions = () => {
  const { dispatch } = useAppState();

  const setActiveTool = useCallback((tool: ToolType) => {
    if (tool !== "arrow") {
      dispatch({ type: "SET_PENDING_EDGE", payload: null });
    }
    dispatch({ type: "SET_ACTIVE_TOOL", payload: tool });
  }, [dispatch]);

  const addNode = useCallback((node: Node) => {
    dispatch({ type: "ADD_NODE", payload: node });
  }, [dispatch]);

  const setPendingEditNodeId = useCallback((nodeId: number | null) => {
    dispatch({ type: "SET_PENDING_EDIT_NODE", payload: nodeId });
  }, [dispatch]);

  const updateNode = useCallback((id: number, updates: Partial<Node>) => {
    dispatch({ type: "UPDATE_NODE", payload: { id, updates } });
  }, [dispatch]);

  const deleteNodes = useCallback((nodeIds: number[]) => {
    dispatch({ type: "DELETE_NODES", payload: nodeIds });
  }, [dispatch]);

  const addFrame = useCallback((frame: Frame) => {
    dispatch({ type: "ADD_FRAME", payload: frame });
  }, [dispatch]);

  const updateFrame = useCallback((id: number, updates: Partial<Frame>) => {
    dispatch({ type: "UPDATE_FRAME", payload: { id, updates } });
  }, [dispatch]);

  const deleteFrames = useCallback((frameIds: number[]) => {
    dispatch({ type: "DELETE_FRAMES", payload: frameIds });
  }, [dispatch]);

  const addEdge = useCallback((edge: Edge) => {
    dispatch({ type: "ADD_EDGE", payload: edge });
  }, [dispatch]);

  const deleteEdges = useCallback((edgeIds: number[]) => {
    dispatch({ type: "DELETE_EDGES", payload: edgeIds });
  }, [dispatch]);

  const setSelectedNodes = useCallback((nodeIds: number[]) => {
    dispatch({ type: "SET_SELECTED_NODES", payload: nodeIds });
  }, [dispatch]);

  const setSelectedFrames = useCallback((frameIds: number[]) => {
    dispatch({ type: "SET_SELECTED_FRAMES", payload: frameIds });
  }, [dispatch]);

  const setSelectedEdges = useCallback((edgeIds: number[]) => {
    dispatch({ type: "SET_SELECTED_EDGES", payload: edgeIds });
  }, [dispatch]);

  const setPendingEdge = useCallback((pendingEdge: PendingEdge | null) => {
    dispatch({ type: "SET_PENDING_EDGE", payload: pendingEdge });
  }, [dispatch]);

  const setResizeInfo = useCallback((resizeInfo: ResizeInfo | null) => {
    dispatch({ type: "SET_RESIZE_INFO", payload: resizeInfo });
  }, [dispatch]);

  const setDragInfo = useCallback((dragInfo: DragInfo | null) => {
    dispatch({ type: "SET_DRAG_INFO", payload: dragInfo });
  }, [dispatch]);

  const setMarqueeInfo = useCallback((marqueeInfo: MarqueeInfo | null) => {
    dispatch({ type: "SET_MARQUEE_INFO", payload: marqueeInfo });
  }, [dispatch]);

  const setNodeToAdd = useCallback((nodeKind: string | null) => {
    dispatch({ type: "SET_NODE_TO_ADD", payload: nodeKind });
  }, [dispatch]);

  const setEditingNodeId = useCallback((nodeId: number | null) => {
    dispatch({ type: "SET_EDITING_NODE", payload: nodeId });
  }, [dispatch]);

  const setArrowJustDrawn = useCallback((value: boolean) => {
    dispatch({ type: "SET_ARROW_JUST_DRAWN", payload: value });
  }, [dispatch]);

  const setDrawingContainer = useCallback((container: HTMLElement | null) => {
    dispatch({ type: "SET_DRAWING_CONTAINER", payload: container });
  }, [dispatch]);

  const updateDrawing = useCallback((updates: Partial<DrawingState>) => {
    dispatch({ type: "UPDATE_DRAWING", payload: updates });
  }, [dispatch]);

  const addFreehandPath = useCallback((path: FreehandPath) => {
    dispatch({ type: "ADD_FREEHAND_PATH", payload: path });
  }, [dispatch]);

  const deleteFreehandPaths = useCallback((pathIds: number[]) => {
    dispatch({ type: "DELETE_FREEHAND_PATHS", payload: pathIds });
  }, [dispatch]);

  const setPenDeleteActive = useCallback((active: boolean) => {
    dispatch({ type: "SET_PEN_DELETE_ACTIVE", payload: active });
  }, [dispatch]);

  const loadState = useCallback((stateUpdates: Partial<AppState>) => {
    dispatch({ type: "LOAD_STATE", payload: stateUpdates });
  }, [dispatch]);

  const resetState = useCallback(() => {
    dispatch({ type: "RESET_STATE" });
  }, [dispatch]);

  const setAIGenerating = useCallback((isGenerating: boolean) => {
    dispatch({ type: "SET_AI_GENERATING", payload: isGenerating });
  }, [dispatch]);

  const setAIError = useCallback((hasError: boolean, message?: string) => {
    if (typeof hasError === 'boolean' && message) {
      dispatch({ type: "SET_AI_ERROR", payload: { hasError, message } });
    } else {
      dispatch({ type: "SET_AI_ERROR", payload: hasError });
    }
  }, [dispatch]);

  const setPendingFrame = useCallback((pendingFrame: any) => {
    dispatch({ type: "SET_PENDING_FRAME", payload: pendingFrame });
  }, [dispatch]);

  const clearAllDiagram = useCallback(() => {
    dispatch({ type: "SET_SELECTED_NODES", payload: [] });
    dispatch({ type: "SET_SELECTED_FRAMES", payload: [] });
    dispatch({ type: "SET_SELECTED_EDGES", payload: [] });
    dispatch({
      type: "LOAD_STATE",
      payload: {
        nodes: [],
        frames: [],
        edges: [],
        nextId: 1,
      },
    });
  }, [dispatch]);

  const clearAllDrawing = useCallback(() => {
    dispatch({
      type: "LOAD_STATE",
      payload: {
        drawings: [],
        drawing: {
          active: false,
          pathEl: null,
          color: "#000000",
          points: [],
        },
        penDeleteActive: false,
      },
    });
  }, [dispatch]);

  const clearAll = useCallback(() => {
    clearAllDiagram();
    clearAllDrawing();
  }, [clearAllDiagram, clearAllDrawing]);

  return {
    setActiveTool,
    addNode,
    updateNode,
    deleteNodes,
    addFrame,
    updateFrame,
    deleteFrames,
    addEdge,
    deleteEdges,
    setSelectedNodes,
    setSelectedFrames,
    setSelectedEdges,
    setPendingEdge,
    setResizeInfo,
    setDragInfo,
    setMarqueeInfo,
    setNodeToAdd,
    setEditingNodeId,
    setPendingEditNodeId,
    setArrowJustDrawn,
    setDrawingContainer,
    updateDrawing,
    addFreehandPath,
    deleteFreehandPaths,
    setPenDeleteActive,
    clearAllDiagram,
    clearAllDrawing,
    clearAll,
    loadState,
    resetState,
    setAIGenerating,
    setAIError,
    setPendingFrame,
  };
};
