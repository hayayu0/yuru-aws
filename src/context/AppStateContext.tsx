import React, { useReducer } from 'react';
import type { ReactNode } from 'react';
import type { AppState, AppAction } from '../types';
import { MAX_ELEMENTS } from '../types';
import { AppStateContext } from './AppContext';
import { calculateNextIdFromCollections } from '../utils/diagramNormalization';

// Helper functions for ID management
const getNextAvailableId = (usedIds: boolean[]): number => {
  for (let i = 1; i < usedIds.length; i++) {
    if (!usedIds[i]) {
      return i;
    }
  }
  throw new Error('No available IDs');
};

const markIdAsUsed = (usedIds: boolean[], id: number): boolean[] => {
  const newUsedIds = [...usedIds];
  newUsedIds[id] = true;
  return newUsedIds;
};

const markIdAsUnused = (usedIds: boolean[], id: number): boolean[] => {
  const newUsedIds = [...usedIds];
  newUsedIds[id] = false;
  return newUsedIds;
};

// Initial state based on the original app.js
const initialState: AppState = {
  nodes: [],
  frames: [],
  edges: [],
  usedIds: new Array(MAX_ELEMENTS).fill(false),
  activeTool: 'select',
  interactionMode: 'select',
  selectedNodeIds: [],
  selectedFrameIds: [],
  selectedEdgeIds: [],

  pendingEdge: null,
  pendingFrame: null,
  resizeInfo: null,
  dragInfo: null,
  marqueeInfo: null,
  nodeToAdd: null,
  editingNodeId: null,
  pendingEditNodeId: null,

  drawingContainer: null,
  drawing: {
    active: false,
    color: '#000000',
    points: [],
  },
  drawings: [],
  penDeleteActive: false,
  isAIGenerating: false,
  aiError: false,
  aiErrorMessage: undefined,
};

// Reducer function
function appStateReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_ACTIVE_TOOL': {
      const nextTool = action.payload;
      return {
        ...state,
        activeTool: nextTool,
        pendingEdge: nextTool === 'arrow' ? state.pendingEdge : null,
      };
    }

    case 'SET_INTERACTION_MODE':
      return { ...state, interactionMode: action.payload };

    case 'ADD_NODE': {
      const availableId = getNextAvailableId(state.usedIds);
      const nodeWithId = { ...action.payload, id: availableId };
      return {
        ...state,
        nodes: [...state.nodes, nodeWithId],
        usedIds: markIdAsUsed(state.usedIds, availableId),
        selectedNodeIds: [availableId],
        selectedFrameIds: [],
        selectedEdgeIds: [],
      };
    }

    case 'UPDATE_NODE':
      return {
        ...state,
        nodes: state.nodes.map(node =>
          node.id === action.payload.id
            ? { ...node, ...action.payload.updates }
            : node
        ),
      };
    
    case 'DELETE_NODES': {
      const nodeIdsToDelete = new Set(action.payload);
      let newUsedIds = state.usedIds;
      nodeIdsToDelete.forEach(id => {
        newUsedIds = markIdAsUnused(newUsedIds, id);
      });
      return {
        ...state,
        nodes: state.nodes.filter(node => !nodeIdsToDelete.has(node.id)),
        edges: state.edges.filter(edge =>
          !nodeIdsToDelete.has(edge.from) && !nodeIdsToDelete.has(edge.to)
        ),
        usedIds: newUsedIds,
        selectedNodeIds: state.selectedNodeIds.filter(id => !nodeIdsToDelete.has(id)),
        editingNodeId:
          state.editingNodeId !== null && nodeIdsToDelete.has(state.editingNodeId)
            ? null
            : state.editingNodeId,
      };
    }

    case 'ADD_FRAME': {
      const availableId = getNextAvailableId(state.usedIds);
      const frameWithId = { ...action.payload, id: availableId };
      return {
        ...state,
        frames: [...state.frames, frameWithId],
        usedIds: markIdAsUsed(state.usedIds, availableId),
        selectedFrameIds: [availableId],
        selectedNodeIds: [],
        selectedEdgeIds: [],
      };
    }

    case 'UPDATE_FRAME':
      return {
        ...state,
        frames: state.frames.map(frame =>
          frame.id === action.payload.id
            ? { ...frame, ...action.payload.updates }
            : frame
        ),
      };

    case 'DELETE_FRAMES': {
      const frameIdsToDelete = new Set(action.payload);
      let newUsedIds = state.usedIds;
      frameIdsToDelete.forEach(id => {
        newUsedIds = markIdAsUnused(newUsedIds, id);
      });
      const shouldClearResizeInfo = state.resizeInfo && frameIdsToDelete.has(state.resizeInfo.frameId);
      return {
        ...state,
        frames: state.frames.filter(frame => !frameIdsToDelete.has(frame.id)),
        usedIds: newUsedIds,
        selectedFrameIds: state.selectedFrameIds.filter(id => !frameIdsToDelete.has(id)),
        resizeInfo: shouldClearResizeInfo ? null : state.resizeInfo,
      };
    }

    case 'ADD_EDGE': {
      const availableId = getNextAvailableId(state.usedIds);
      const edgeWithId = { ...action.payload, id: availableId };
      return {
        ...state,
        edges: [...state.edges, edgeWithId],
        usedIds: markIdAsUsed(state.usedIds, availableId),
      };
    }
    
    case 'DELETE_EDGES': {
      const edgeIdsToDelete = new Set(action.payload);
      let newUsedIds = state.usedIds;
      edgeIdsToDelete.forEach(id => {
        newUsedIds = markIdAsUnused(newUsedIds, id);
      });
      return {
        ...state,
        edges: state.edges.filter(edge => !edgeIdsToDelete.has(edge.id)),
        usedIds: newUsedIds,
        selectedEdgeIds: state.selectedEdgeIds.filter(id => !edgeIdsToDelete.has(id)),
      };
    }
    
    case 'SET_SELECTED_NODES':
      return { ...state, selectedNodeIds: action.payload };

    case 'SET_SELECTED_FRAMES':
      return { ...state, selectedFrameIds: action.payload };
    
    case 'SET_SELECTED_EDGES':
      return { ...state, selectedEdgeIds: action.payload };
    
    case 'SET_PENDING_EDGE':
      return { ...state, pendingEdge: action.payload };
    
    case 'SET_RESIZE_INFO':
      return { ...state, resizeInfo: action.payload };
    
    case 'SET_DRAG_INFO':
      return { ...state, dragInfo: action.payload };
    
    case 'SET_MARQUEE_INFO':
      return { ...state, marqueeInfo: action.payload };
    
    case 'SET_NODE_TO_ADD':
      return { ...state, nodeToAdd: action.payload };

    case 'SET_EDITING_NODE':
      return { ...state, editingNodeId: action.payload };

    case 'SET_PENDING_EDIT_NODE':
      return { ...state, pendingEditNodeId: action.payload };



    case 'SET_DRAWING_CONTAINER':
      return { ...state, drawingContainer: action.payload };
    
    case 'UPDATE_DRAWING':
      return {
        ...state,
        drawing: { ...state.drawing, ...action.payload },
      };
    
    case 'ADD_FREEHAND_PATH':
      return {
        ...state,
        drawings: [...state.drawings, action.payload],
      };

    case 'DELETE_FREEHAND_PATHS': {
      const idsToDelete = new Set(action.payload);
      return {
        ...state,
        drawings: state.drawings.filter(path => !idsToDelete.has(path.id))
      };
    }

    case 'SET_PEN_DELETE_ACTIVE': {
      return { ...state, penDeleteActive: action.payload };
    }



    case 'LOAD_STATE': {
      const nodes = action.payload.nodes ?? [];
      const frames = action.payload.frames ?? [];
      const edges = action.payload.edges ?? [];
      
      let newUsedIds = new Array(MAX_ELEMENTS).fill(false);
      
      const processedNodes = nodes.map(node => {
        const originalId = node.id || 1; // Convert 0 to 1
        const id = (originalId > 0 && !newUsedIds[originalId]) ? originalId : getNextAvailableId(newUsedIds);
        newUsedIds[id] = true;
        return { ...node, id };
      });
      
      const processedFrames = frames.map(frame => {
        const originalId = frame.id || 1; // Convert 0 to 1
        const id = (originalId > 0 && !newUsedIds[originalId]) ? originalId : getNextAvailableId(newUsedIds);
        newUsedIds[id] = true;
        return { ...frame, id };
      });
      
      const processedEdges = edges.filter(edge => {
        // Only include edges where both from and to exist in usedIds
        return newUsedIds[edge.from] && newUsedIds[edge.to];
      }).map(edge => {
        const originalId = edge.id || 1; // Convert 0 to 1
        const id = (originalId > 0 && !newUsedIds[originalId]) ? originalId : getNextAvailableId(newUsedIds);
        newUsedIds[id] = true;
        return { ...edge, id };
      });

      return {
        ...state,
        nodes: processedNodes,
        frames: processedFrames,
        edges: processedEdges,
        usedIds: newUsedIds,
        editingNodeId: null,
        activeTool: 'select',
        interactionMode: 'select',
      };
    }
    
    case 'RESET_STATE':
      return { ...initialState }; 
    
    case 'SET_AI_GENERATING':
      return { ...state, isAIGenerating: action.payload };
    
    case 'SET_AI_ERROR': {
      if (typeof action.payload === 'boolean') {
        return { ...state, aiError: action.payload, aiErrorMessage: undefined };
      }
      return { 
        ...state, 
        aiError: action.payload.hasError, 
        aiErrorMessage: action.payload.message 
      };
    }
    
    case 'SET_PENDING_FRAME':
      return { ...state, pendingFrame: action.payload };
    
    default:
      return state;
  }
}

// Provider component
interface AppStateProviderProps {
  children: ReactNode;
}

export const AppStateProvider: React.FC<AppStateProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(appStateReducer, initialState);

  return (
    <AppStateContext.Provider value={{ state, dispatch }}>
      {children}
    </AppStateContext.Provider>
  );
};
