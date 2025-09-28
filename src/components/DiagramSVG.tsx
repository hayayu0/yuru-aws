import React from 'react';
import { useAppState } from '../hooks/useAppState';
import { useAppActions } from '../hooks/useAppActions';
import { awsServices } from '../types/aws';
import Edge from './Edge';
import PendingEdge from './PendingEdge';
import Node from './Node';
import FrameNode from './FrameNode';
import type { Frame as FrameType } from '../types';

interface DiagramSVGProps {
  svgRef: React.RefObject<SVGSVGElement | null>;
}

const DiagramSVG: React.FC<DiagramSVGProps> = ({ svgRef }) => {
  const { state } = useAppState();
  const {
    setSelectedNodes,
    setSelectedFrames,
    setDragInfo,
    setEditingNodeId,
  } = useAppActions();

  const sortedFrames = [...state.frames].sort((a, b) => {
    const aZLayer = awsServices[a.kind]?.zLayer || 200;
    const bZLayer = awsServices[b.kind]?.zLayer || 200;
    return aZLayer - bZLayer;
  });

  const sortedNodes = [...state.nodes].sort((a, b) => {
    const aZLayer = awsServices[a.kind]?.zLayer || 200;
    const bZLayer = awsServices[b.kind]?.zLayer || 200;
    return aZLayer - bZLayer;
  });

  const handleElementSelect = (id: number, event: React.MouseEvent, type: 'node' | 'frame') => {
    const isMultiSelect = event.ctrlKey || event.metaKey || event.shiftKey;
    const selectedIds = type === 'node' ? state.selectedNodeIds : state.selectedFrameIds;
    const setSelected = type === 'node' ? setSelectedNodes : setSelectedFrames;
    const clearOther = type === 'node' ? setSelectedFrames : setSelectedNodes;

    if (isMultiSelect) {
      if (selectedIds.includes(id)) {
        setSelected(selectedIds.filter(selectedId => selectedId !== id));
      } else {
        setSelected([...selectedIds, id]);
      }
    } else if (!selectedIds.includes(id)) {
      setSelected([id]);
      clearOther([]);
    }
  };

  const handleNodeSelect = (nodeId: number, event: React.MouseEvent) => {
    handleElementSelect(nodeId, event, 'node');
  };

  const handleFrameSelect = (frameId: number, event: React.MouseEvent) => {
    handleElementSelect(frameId, event, 'frame');
  };

  const handleNodeDoubleClick = (nodeId: number, event: React.MouseEvent) => {
    const target = event.target as SVGElement | null;
    const textElement = target?.closest('text');
    if (!textElement) {
      return;
    }

    if (!state.selectedNodeIds.includes(nodeId)) {
      setSelectedNodes([nodeId]);
    }
    setEditingNodeId(nodeId);
  };

  const handleFrameDoubleClick = (frameId: number, event: React.MouseEvent) => {
    const target = event.target as SVGElement | null;
    const textElement = target?.closest('text');
    if (!textElement) {
      return;
    }

    if (!state.selectedFrameIds.includes(frameId)) {
      setSelectedFrames([frameId]);
    }
    setEditingNodeId(frameId);
  };

  const handleNodeDragStart = (nodeId: number, event: React.MouseEvent) => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;

    const svgX = event.clientX - rect.left;
    const svgY = event.clientY - rect.top;

    let selectedNodeIds = state.selectedNodeIds;
    if (!selectedNodeIds.includes(nodeId)) {
      selectedNodeIds = [nodeId];
      setSelectedNodes(selectedNodeIds);
    }

    const nodePositions: { [nodeId: number]: { x: number; y: number } } = {};
    selectedNodeIds.forEach(id => {
      const node = state.nodes.find(n => n.id === id);
      if (node) {
        nodePositions[id] = { x: node.x, y: node.y };
      }
    });

    const frameIds = state.selectedFrameIds;
    const framePositions: { [frameId: number]: { x: number; y: number } } = {};
    frameIds.forEach(id => {
      const frame = state.frames.find(f => f.id === id);
      if (frame) {
        framePositions[id] = { x: frame.x, y: frame.y };
      }
    });

    setDragInfo({
      nodeIds: selectedNodeIds,
      frameIds,
      startX: svgX,
      startY: svgY,
      nodePositions,
      framePositions,
    });
  };

  const handleFrameDragStart = (frameId: number, event: React.MouseEvent) => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;

    const svgX = event.clientX - rect.left;
    const svgY = event.clientY - rect.top;

    let selectedFrameIds = state.selectedFrameIds;
    if (!selectedFrameIds.includes(frameId)) {
      selectedFrameIds = [frameId];
      setSelectedFrames(selectedFrameIds);
    }

    const framePositions: { [frameId: number]: { x: number; y: number } } = {};
    selectedFrameIds.forEach(id => {
      const frame = state.frames.find(f => f.id === id);
      if (frame) {
        framePositions[id] = { x: frame.x, y: frame.y };
      }
    });

    const nodeIds = state.selectedNodeIds;
    const nodePositions: { [nodeId: number]: { x: number; y: number } } = {};
    nodeIds.forEach(id => {
      const node = state.nodes.find(n => n.id === id);
      if (node) {
        nodePositions[id] = { x: node.x, y: node.y };
      }
    });

    setDragInfo({
      nodeIds,
      frameIds: selectedFrameIds,
      startX: svgX,
      startY: svgY,
      nodePositions,
      framePositions,
    });
  };

  return (
    <g id="panGroup">
      {/* Frames Layer */}
      <g id="framesLayer">
        {sortedFrames.map(frame => {
          const isSelected = state.selectedFrameIds.includes(frame.id);
          return (
            <FrameNode
              key={`frame-${frame.id}`}
              frame={frame}
              isSelected={isSelected}
              onSelect={handleFrameSelect}
              onDoubleClick={handleFrameDoubleClick}
              onDragStart={handleFrameDragStart}
            />
          );
        })}
      </g>

      {/* Edges Layer - for connections between nodes and frames */}
      <g id="edgesLayer">
        {state.edges.map(edge => {
          // Find from element (node or frame)
          const fromNode = state.nodes.find(n => n.id === edge.from);
          const fromFrame = state.frames.find(f => f.id === edge.from);
          const fromElement = fromNode || fromFrame;

          // Find to element (node or frame)
          const toNode = state.nodes.find(n => n.id === edge.to);
          const toFrame = state.frames.find(f => f.id === edge.to);
          const toElement = toNode || toFrame;

          if (!fromElement || !toElement) return null;

          const isSelected = state.selectedEdgeIds.includes(edge.id);

          return (
            <Edge
              key={edge.id}
              edge={edge}
              fromNode={fromElement}
              toNode={toElement}
              isSelected={isSelected}
              handDrawnStyle={true}
            />
          );
        })}

        {state.pendingEdge && (
          <PendingEdge
            fromNodeId={state.pendingEdge.from}
            nodes={state.nodes}
            frames={state.frames}
            svgRef={svgRef}
            initialMousePos={state.pendingEdge.initialMousePos || undefined}
          />
        )}
      </g>

      {/* Nodes Layer */}
      <g id="nodesLayer">
        {sortedNodes.map(node => {
          const isSelected = state.selectedNodeIds.includes(node.id);
          return (
            <Node
              key={`node-${node.id}`}
              node={node}
              isSelected={isSelected}
              onSelect={handleNodeSelect}
              onDoubleClick={handleNodeDoubleClick}
              onDragStart={handleNodeDragStart}
            />
          );
        })}
      </g>

      {/* Handles Layer - for resize handles and other interactive elements */}
      <g id="handlesLayer">
        {state.selectedFrameIds
          .map(frameId => state.frames.find(f => f.id === frameId))
          .filter((frame): frame is FrameType => frame !== undefined)
          .map(frame => (
            <g key={`handles-${frame.id}`} className="resize-handles">
              {/* 左上 */}
              <rect
                x={frame.x - 4}
                y={frame.y - 4}
                width={8}
                height={8}
                fill="#0ea5e9"
                stroke="#ffffff"
                strokeWidth={1}
                className="resize-handle resize-handle-nw"
                style={{
                  cursor: 'nw-resize',
                  pointerEvents: 'all',
                }}
                data-frame-id={frame.id}
                data-handle="nw"
              />
              {/* 左下 */}
              <rect
                x={frame.x - 4}
                y={frame.y + frame.height - 4}
                width={8}
                height={8}
                fill="#0ea5e9"
                stroke="#ffffff"
                strokeWidth={1}
                className="resize-handle resize-handle-sw"
                style={{
                  cursor: 'sw-resize',
                  pointerEvents: 'all',
                }}
                data-frame-id={frame.id}
                data-handle="sw"
              />
              {/* 右上 */}
              <rect
                x={frame.x + frame.width - 4}
                y={frame.y - 4}
                width={8}
                height={8}
                fill="#0ea5e9"
                stroke="#ffffff"
                strokeWidth={1}
                className="resize-handle resize-handle-ne"
                style={{
                  cursor: 'ne-resize',
                  pointerEvents: 'all',
                }}
                data-frame-id={frame.id}
                data-handle="ne"
              />
              {/* 右下 */}
              <rect
                x={frame.x + frame.width - 4}
                y={frame.y + frame.height - 4}
                width={8}
                height={8}
                fill="#0ea5e9"
                stroke="#ffffff"
                strokeWidth={1}
                className="resize-handle resize-handle-se"
                style={{
                  cursor: 'se-resize',
                  pointerEvents: 'all',
                }}
                data-frame-id={frame.id}
                data-handle="se"
              />
            </g>
          ))}
      </g>

      {/* Pending Frame Preview */}
      {state.pendingFrame && (() => {
        const x = Math.min(state.pendingFrame.startX, state.pendingFrame.currentX);
        const y = Math.min(state.pendingFrame.startY, state.pendingFrame.currentY);
        const width = Math.abs(state.pendingFrame.currentX - state.pendingFrame.startX);
        const height = Math.abs(state.pendingFrame.currentY - state.pendingFrame.startY);
        
        return (
          <rect
            x={x}
            y={y}
            width={width}
            height={height}
            fill="none"
            stroke="#888888"
            strokeWidth="1"
            strokeDasharray="5,5"
            opacity="0.7"
            pointerEvents="none"
          />
        );
      })()}

      <rect
        id="marquee"
        className="selection-outline"
        visibility="hidden"
        x="0"
        y="0"
        width="0"
        height="0"
        fill="rgba(14, 165, 233, 0.1)"
        stroke="#0ea5e9"
        strokeWidth="1"
        strokeDasharray="3,3"
      />
    </g>
  );
};

export default DiagramSVG;