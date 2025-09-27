import React, { useState, useEffect } from 'react';
import type { Node, Frame } from '../types';
import { elementSize } from '../types/aws';
import { getSVGCoordinates } from '../utils/coordinates';

interface PendingEdgeProps {
  fromNodeId: number;
  nodes: Node[];
  frames: Frame[];
  svgRef: React.RefObject<SVGSVGElement | null>;
  initialMousePos?: { x: number; y: number } | undefined;
}

/**
 * PendingEdge component renders a dynamic edge that follows the mouse cursor
 * while the user is in the process of creating a connection between elements.
 */
const PendingEdge: React.FC<PendingEdgeProps> = ({ fromNodeId, nodes, frames, svgRef, initialMousePos }) => {
  // Find from element (node or frame)
  const fromNode = nodes.find(n => n.id === fromNodeId);
  const fromFrame = frames.find(f => f.id === fromNodeId);

  let fromX: number, fromY: number;
  
  if (fromFrame) {
    fromX = fromFrame.x + fromFrame.width / 2;
    fromY = fromFrame.y + fromFrame.height / 2;
  } else if (fromNode) {
    fromX = fromNode.x + elementSize.defaultNodeWidth / 2;
    fromY = fromNode.y + elementSize.defaultNodeHeight / 2;
  } else {
    return null;
  }
  
  const fallbackPos = { x: fromX, y: fromY };
  const [mousePos, setMousePos] = useState(initialMousePos || fallbackPos);

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (svgRef.current) {
        const coords = getSVGCoordinates(event, svgRef.current);
        setMousePos(coords);
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, [svgRef]);

  return (
    <line
      x1={fromX}
      y1={fromY}
      x2={mousePos.x}
      y2={mousePos.y}
      stroke="#1f3aad"
      strokeWidth="2"
      strokeDasharray="5,5"
      opacity="0.7"
      pointerEvents="none"
      className="pending-edge"
    />
  );
};

export default PendingEdge;