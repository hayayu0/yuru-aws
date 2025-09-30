import React from 'react';
import { useAppState } from '../hooks/useAppState';
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

  const sortedFrames = React.useMemo(
    () => [...state.frames].sort((a, b) => {
      const aZLayer = awsServices[a.kind]?.zLayer || 200;
      const bZLayer = awsServices[b.kind]?.zLayer || 200;
      return aZLayer - bZLayer;
    }),
    [state.frames],
  );

  const sortedNodes = React.useMemo(
    () => [...state.nodes].sort((a, b) => {
      const aZLayer = awsServices[a.kind]?.zLayer || 200;
      const bZLayer = awsServices[b.kind]?.zLayer || 200;
      return aZLayer - bZLayer;
    }),
    [state.nodes],
  );

  return (
    <g id="panGroup">
      <g id="framesLayer">
        {sortedFrames.map(frame => (
          <FrameNode
            key={`frame-${frame.id}`}
            frame={frame}
            isSelected={state.selectedFrameIds.includes(frame.id)}
          />
        ))}
      </g>

      <g id="edgesLayer">
        {state.edges.map(edge => {
          const fromElement = state.nodes.find(n => n.id === edge.from) || state.frames.find(f => f.id === edge.from);
          const toElement = state.nodes.find(n => n.id === edge.to) || state.frames.find(f => f.id === edge.to);

          if (!fromElement || !toElement) {
            return null;
          }

          return (
            <Edge
              key={edge.id}
              edge={edge}
              fromNode={fromElement}
              toNode={toElement}
              isSelected={state.selectedEdgeIds.includes(edge.id)}
              handDrawnStyle
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

      <g id="nodesLayer">
        {sortedNodes.map(node => (
          <Node
            key={`node-${node.id}`}
            node={node}
            isSelected={state.selectedNodeIds.includes(node.id)}
          />
        ))}
      </g>

      <g id="handlesLayer">
        {state.selectedFrameIds
          .map(frameId => state.frames.find(f => f.id === frameId))
          .filter((frame): frame is FrameType => frame !== undefined)
          .map(frame => (
            <g key={`handles-${frame.id}`} className="resize-handles">
              <rect
                x={frame.x - 4}
                y={frame.y - 4}
                width={8}
                height={8}
                fill="#0ea5e9"
                stroke="#ffffff"
                strokeWidth={1}
                className="resize-handle resize-handle-nw"
                style={{ cursor: 'nw-resize', pointerEvents: 'all' }}
                data-frame-id={frame.id}
                data-handle="nw"
              />
              <rect
                x={frame.x - 4}
                y={frame.y + frame.height - 4}
                width={8}
                height={8}
                fill="#0ea5e9"
                stroke="#ffffff"
                strokeWidth={1}
                className="resize-handle resize-handle-sw"
                style={{ cursor: 'sw-resize', pointerEvents: 'all' }}
                data-frame-id={frame.id}
                data-handle="sw"
              />
              <rect
                x={frame.x + frame.width - 4}
                y={frame.y - 4}
                width={8}
                height={8}
                fill="#0ea5e9"
                stroke="#ffffff"
                strokeWidth={1}
                className="resize-handle resize-handle-ne"
                style={{ cursor: 'ne-resize', pointerEvents: 'all' }}
                data-frame-id={frame.id}
                data-handle="ne"
              />
              <rect
                x={frame.x + frame.width - 4}
                y={frame.y + frame.height - 4}
                width={8}
                height={8}
                fill="#0ea5e9"
                stroke="#ffffff"
                strokeWidth={1}
                className="resize-handle resize-handle-se"
                style={{ cursor: 'se-resize', pointerEvents: 'all' }}
                data-frame-id={frame.id}
                data-handle="se"
              />
            </g>
          ))}
      </g>

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
