import React, { useReducer } from 'react';
import type { ReactNode } from 'react';
import type { AppState, AppAction } from '../types';
import { AppStateContext } from './AppContext';
import { calculateNextIdFromCollections } from '../utils/diagramNormalization';

// Initial state based on the original app.js
const initialState: AppState = {
  nodes: [],
  frames: [],
  edges: [],
  nextId: 1,
  activeTool: 'select',
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

    case 'ADD_NODE': {
      const nextId = calculateNextIdFromCollections(state.nextId, state.nodes, state.frames, state.edges, [action.payload]);
      return {
        ...state,
        nodes: [...state.nodes, action.payload],
        nextId,
        selectedNodeIds: [action.payload.id],
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
      return {
        ...state,
        nodes: state.nodes.filter(node => !nodeIdsToDelete.has(node.id)),
        edges: state.edges.filter(edge =>
          !nodeIdsToDelete.has(edge.from) && !nodeIdsToDelete.has(edge.to)
        ),
        selectedNodeIds: state.selectedNodeIds.filter(id => !nodeIdsToDelete.has(id)),
        editingNodeId:
          state.editingNodeId !== null && nodeIdsToDelete.has(state.editingNodeId)
            ? null
            : state.editingNodeId,
      };
    }

    case 'ADD_FRAME': {
      const nextId = calculateNextIdFromCollections(state.nextId, state.nodes, state.frames, state.edges, [action.payload]);
      return {
        ...state,
        frames: [...state.frames, action.payload],
        nextId,
        selectedFrameIds: [action.payload.id],
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
      const shouldClearResizeInfo = state.resizeInfo && frameIdsToDelete.has(state.resizeInfo.frameId);
      return {
        ...state,
        frames: state.frames.filter(frame => !frameIdsToDelete.has(frame.id)),
        selectedFrameIds: state.selectedFrameIds.filter(id => !frameIdsToDelete.has(id)),
        resizeInfo: shouldClearResizeInfo ? null : state.resizeInfo,
      };
    }

    case 'ADD_EDGE': {
      const nextId = calculateNextIdFromCollections(state.nextId, state.nodes, state.frames, state.edges, [action.payload]);
      return {
        ...state,
        edges: [...state.edges, action.payload],
        nextId,
      };
    }
    
    case 'DELETE_EDGES': {
      const edgeIdsToDelete = new Set(action.payload);
      return {
        ...state,
        edges: state.edges.filter(edge => !edgeIdsToDelete.has(edge.id)),
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
      
      const nextId = calculateNextIdFromCollections(1, nodes, frames, edges);

      return {
        ...state,
        ...action.payload,
        nextId,
        editingNodeId: null,
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
