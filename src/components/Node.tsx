import React from 'react';
import { awsServices, elementSize } from '../types/aws';
import type { Node as NodeType } from '../types';

interface NodeProps {
  node: NodeType;
  isSelected: boolean;
}

const Node: React.FC<NodeProps> = ({ node, isSelected }) => {
  const service = awsServices[node.kind];
  const displayIcon = service?.displayIcon !== false;
  const labelText = node.label || service?.buttonText || node.kind;
  const isTextBox = node.kind === 'TextBox';

  const nodeWidth = elementSize.defaultNodeWidth;
  const nodeHeight = isTextBox ? 36 : elementSize.defaultNodeHeight;

  return (
    <g
      transform={`translate(${node.x}, ${node.y})`}
      data-id={node.id}
      data-element-id={node.id}
      data-element-type="node"
      className={`node regular-node ${isSelected ? 'node-selected' : ''}`}
    >
      {isSelected && (
        <rect
          x={-3}
          y={-3}
          width={nodeWidth + 6}
          height={nodeHeight + 6}
          rx={2}
          fill="none"
          stroke="#a00000"
          strokeWidth="1"
          className="selection-outline"
          style={{ pointerEvents: 'none' }}
        />
      )}

      {isTextBox && (
        <rect
          width={nodeWidth}
          height={nodeHeight}
          fill="white"
          stroke="#ccc"
          strokeWidth="1"
          rx={2}
          style={{ pointerEvents: 'all', cursor: 'pointer' }}
        />
      )}

      {displayIcon && !isTextBox && (
        <image
          href={`aws-icons/${node.kind}.png`}
          width={nodeWidth}
          height={nodeHeight}
          style={{ pointerEvents: 'all', cursor: 'pointer' }}
        />
      )}

      <text
        x={nodeWidth / 2}
        y={isTextBox ? nodeHeight / 2 + 4 : nodeHeight + 15}
        textAnchor="middle"
        className="node-label regular-label"
        style={{ pointerEvents: 'all', cursor: 'text', fill: '#333333' }}
      >
        {labelText}
      </text>
    </g>
  );
};

export default Node;
