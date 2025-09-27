import React, { useMemo } from 'react';
import type { Edge as EdgeType, Node, Frame } from '../types';
import { calculateOrthogonalPath, toRectElement } from '../utils/pathCalculation';
import { createRoughPath, addPathDistortion, type RoughOptions } from '../utils/roughDrawing';
import type { OpSet, Op } from '../types/roughjs';

interface EdgeProps {
  /** The edge data containing id and connection information */
  edge: EdgeType;
  /** The source element (node or frame) for the edge */
  fromNode: Node | Frame;
  /** The target element (node or frame) for the edge */
  toNode: Node | Frame;
  /** Whether the edge is currently selected */
  isSelected?: boolean;
  /** Whether to use hand-drawn style rendering */
  handDrawnStyle?: boolean;
}

/**
 * Edge component renders a connection between two elements with orthogonal routing.
 * 
 * Features:
 * - Orthogonal path calculation for clean routing between nodes and frames
 * - Selection state visualization
 * - Arrow marker at the end
 * - Click handling for selection
 * - Hand-drawn style rendering with rough.js
 * - Path distortion effects for organic appearance
 * 
 * Based on the original createEdgeElement function from app.js
 */

const Edge: React.FC<EdgeProps> = ({ 
  edge, 
  fromNode, 
  toNode, 
  isSelected = false, 
  handDrawnStyle = true 
}) => {
  // Convert elements to RectElement for path calculation
  const fromRect = toRectElement(fromNode);
  const toRect = toRectElement(toNode);
  
  // Calculate the orthogonal path between elements
  const basePath = calculateOrthogonalPath(fromRect, toRect);

  // Handle edge cases where path calculation might fail
  if (!basePath || basePath.length === 0) {
    console.warn(`Failed to calculate path for edge ${edge.id}`);
    return null;
  }

  // Memoize the hand-drawn path generation for performance
  const { pathData, roughDrawable } = useMemo(() => {
    if (!handDrawnStyle) {
      return { pathData: basePath, roughDrawable: null };
    }

    // Add distortion to the path for more organic appearance
    // Use edge ID as seed for consistent distortion
    const distortedPath = addPathDistortion(basePath, 1.0, edge.id.toString());
    
    // Create rough.js drawable
    const roughOptions: RoughOptions = {
      roughness: 0.4,
      bowing: 3,
      strokeWidth: 1.5,
      stroke: isSelected ? "#a00000" : "#16225c",
      seed: fromNode.id * 64 + toNode.id,
      disableMultiStroke: true
    };

    const drawable = createRoughPath(distortedPath, roughOptions);
    
    return { pathData: distortedPath, roughDrawable: drawable };
  }, [basePath, handDrawnStyle, isSelected, edge.id, fromNode.id, toNode.id]);

  // Render hand-drawn style using rough.js
  if (handDrawnStyle && roughDrawable) {
    return (
      <g 
        className={`edge-group edge-path ${isSelected ? 'edge-selected' : ''}`}
        data-edge-id={edge.id}
        style={{ 
          pointerEvents: 'stroke',
          cursor: 'pointer'
        }}
      >
        {/* Render the rough.js drawable as SVG paths */}
        {roughDrawable.sets.map((set: OpSet, index: number) => {
          // Convert rough.js operations to SVG path data
          const pathCommands = set.ops.map((op: Op) => {
            if (!op.data || op.data.length === 0) return '';
            
            switch (op.op) {
              case 'move':
                return op.data.length >= 2 && op.data[0] !== undefined && op.data[1] !== undefined ? `M ${op.data[0].toFixed(2)} ${op.data[1].toFixed(2)}` : '';
              case 'line':
                return op.data.length >= 2 && op.data[0] !== undefined && op.data[1] !== undefined ? `L ${op.data[0].toFixed(2)} ${op.data[1].toFixed(2)}` : '';
              case 'curve':
                return op.data.length >= 4 && op.data[0] !== undefined && op.data[1] !== undefined && op.data[2] !== undefined && op.data[3] !== undefined ? `Q ${op.data[0].toFixed(2)} ${op.data[1].toFixed(2)} ${op.data[2].toFixed(2)} ${op.data[3].toFixed(2)}` : '';
              case 'bcurveTo':
                return op.data.length >= 6 && op.data[0] !== undefined && op.data[1] !== undefined && op.data[2] !== undefined && op.data[3] !== undefined && op.data[4] !== undefined && op.data[5] !== undefined ? `C ${op.data[0].toFixed(2)} ${op.data[1].toFixed(2)} ${op.data[2].toFixed(2)} ${op.data[3].toFixed(2)} ${op.data[4].toFixed(2)} ${op.data[5].toFixed(2)}` : '';
              default:
                return '';
            }
          }).filter((cmd: string) => cmd !== '').join(' ');

          return (
            <path
              key={`${edge.id}-rough-${index}`}
              d={pathCommands}
              stroke={set.stroke || roughDrawable.options?.stroke || (isSelected ? "#a00000" : "#1f3aad")}
              strokeWidth={set.strokeWidth || roughDrawable.options?.strokeWidth || (isSelected ? 2 : 1.5)}
              fill="none"
              markerEnd={index === roughDrawable.sets.length - 1 ? `url(#${isSelected ? 'roughArrowHeadSelected' : 'roughArrowHead'})` : undefined}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          );
        })}
      </g>
    );
  }

  // Fallback to regular SVG path for non-hand-drawn style
  return (
    <path
      d={pathData}
      stroke={isSelected ? "#a00000" : "#1f3aad"}
      strokeWidth={isSelected ? "2" : "1.5"}
      fill="none"
      markerEnd={`url(#${isSelected ? 'arrowHeadSelected' : 'arrowHead'})`}
      className={`edge-path ${isSelected ? 'edge-selected' : ''}`}
      data-edge-id={edge.id}
      style={{ 
        pointerEvents: 'stroke',
        cursor: 'pointer'
      }}
    />
  );
};

export default Edge;