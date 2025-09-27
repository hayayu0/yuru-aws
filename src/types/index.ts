// TypeScript interfaces for the application state

export interface Node {
  id: number;
  kind: string;
  x: number;
  y: number;
  label?: string | null;
}

export interface Frame {
  id: number;
  kind: string;
  x: number;
  y: number;
  width: number;
  height: number;
  label?: string | null;
}

export interface Edge {
  id: number;
  from: number; // node id or frame id
  to: number;   // node id or frame id
}

export interface ViewBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface PendingEdge {
  from: number; // node id or frame id
  initialMousePos?: { x: number; y: number };
}

export interface ResizeInfo {
  frameId: number;
  handle: string;
  startX: number;
  startY: number;
  startWidth: number;
  startHeight: number;
  startFrameX: number;
  startFrameY: number;
}

export interface DragInfo {
  nodeIds: number[];
  frameIds: number[];
  startX: number;
  startY: number;
  nodePositions: { [nodeId: number]: { x: number; y: number } };
  framePositions: { [frameId: number]: { x: number; y: number } };
}

export interface MarqueeInfo {
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  isActive: boolean;
}

export interface DrawingState {
  active: boolean;
  pathEl: SVGPathElement | null;
  color: string;
  points: { x: number; y: number }[];
}

export interface FreehandPath {
  id: number;
  color: string;
  points: { x: number; y: number }[];
  strokeWidth?: number;
}

export type ToolType = 'select' | 'arrow' | 'pen-black' | 'pen-red' | 'penDelete';



export interface PendingFrame {
  kind: string;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
}

export interface AppState {
  nodes: Node[];
  frames: Frame[];
  edges: Edge[];
  nextId: number;
  
  activeTool: ToolType;
  selectedNodeIds: number[];
  selectedFrameIds: number[];
  selectedEdgeIds: number[];
  viewBox: ViewBox;
  
  pendingEdge: PendingEdge | null;
  pendingFrame: PendingFrame | null;
  resizeInfo: ResizeInfo | null;
  dragInfo: DragInfo | null;
  marqueeInfo: MarqueeInfo | null;
  nodeToAdd: string | null;
  editingNodeId: number | null;
  arrowJustDrawn: boolean;
  drawingContainer: HTMLElement | null;
  
  drawing: DrawingState;
  drawings: FreehandPath[];
  penDeleteActive: boolean;
  isAIGenerating: boolean;
  aiError: boolean;
  aiErrorMessage?: string | undefined;
}

export interface AWSService {
  buttonGroup: string;
  buttonText?: string;
  isFrame?: boolean;
  zLayer?: number;
  displayIcon?: boolean;
}

export interface AWSServicesConfig {
  [key: string]: AWSService;
}

// Action types
export type AppAction =
  | { type: 'SET_ACTIVE_TOOL'; payload: ToolType }
  | { type: 'ADD_NODE'; payload: Node }
  | { type: 'UPDATE_NODE'; payload: { id: number; updates: Partial<Node> } }
  | { type: 'DELETE_NODES'; payload: number[] }
  | { type: 'ADD_FRAME'; payload: Frame }
  | { type: 'UPDATE_FRAME'; payload: { id: number; updates: Partial<Frame> } }
  | { type: 'DELETE_FRAMES'; payload: number[] }
  | { type: 'ADD_EDGE'; payload: Edge }
  | { type: 'DELETE_EDGES'; payload: number[] }
  | { type: 'SET_SELECTED_NODES'; payload: number[] }
  | { type: 'SET_SELECTED_FRAMES'; payload: number[] }
  | { type: 'SET_SELECTED_EDGES'; payload: number[] }
  | { type: 'SET_PENDING_EDGE'; payload: PendingEdge | null }
  | { type: 'SET_RESIZE_INFO'; payload: ResizeInfo | null }
  | { type: 'SET_DRAG_INFO'; payload: DragInfo | null }
  | { type: 'SET_MARQUEE_INFO'; payload: MarqueeInfo | null }
  | { type: 'SET_NODE_TO_ADD'; payload: string | null }
  | { type: 'SET_EDITING_NODE'; payload: number | null }
  | { type: 'SET_ARROW_JUST_DRAWN'; payload: boolean }
  | { type: 'SET_DRAWING_CONTAINER'; payload: HTMLElement | null }
  | { type: 'UPDATE_DRAWING'; payload: Partial<DrawingState> }
  | { type: 'ADD_FREEHAND_PATH'; payload: FreehandPath }
  | { type: 'DELETE_FREEHAND_PATHS'; payload: number[] }
  | { type: 'SET_PEN_DELETE_ACTIVE'; payload: boolean }

  | { type: 'LOAD_STATE'; payload: Partial<AppState> }
  | { type: 'RESET_STATE' }
  | { type: 'SET_AI_GENERATING'; payload: boolean }
  | { type: 'SET_AI_ERROR'; payload: boolean | { hasError: boolean; message?: string } }
  | { type: 'SET_PENDING_FRAME'; payload: PendingFrame | null };
