import React, { useMemo } from 'react';
import { awsServices, elementSize } from '../types/aws';
import type { Frame } from '../types';
import { createRoughRect, type RoughOptions } from '../utils/roughDrawing';
import type { OpSet, Op } from '../types/roughjs';

interface FrameNodeProps {
  frame: Frame;
  isSelected: boolean;
  onSelect: (frameId: number, event: React.MouseEvent) => void;
  onDoubleClick: (frameId: number, event: React.MouseEvent) => void;
  onDragStart: (frameId: number, event: React.MouseEvent) => void;
}

const FrameNode: React.FC<FrameNodeProps> = ({
  frame,
  isSelected,
  onSelect,
  onDoubleClick,
  onDragStart,
}) => {
  const service = awsServices[frame.kind];
  const displayIcon = service?.displayIcon !== false;
  const labelText = frame.label || service?.buttonText || frame.kind;

  const handleMouseDown = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    onSelect(frame.id, event);
    onDragStart(frame.id, event);
  };

  const handleDoubleClick = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    onDoubleClick(frame.id, event);
  };

  let stroke = '#aaaaaa';
  const strokeWidth = 1;
  let strokeDasharray: string | undefined = '5,5';
  let fill = 'none';
  let fillOpacity: number | undefined;

  switch (frame.kind) {
    case 'Account':
    case 'Building':
      stroke = '#555555';
      strokeDasharray = undefined;
      break;
    case 'Region':
      stroke = '#008b8b';
      strokeDasharray = '5 2';
      break;
    case 'AZ':
      stroke = '#008b8b';
      strokeDasharray = '7 5';
      break;
    case 'VPC':
      stroke = '#8b5cf6';
      strokeDasharray = undefined;
      break;
    case 'PublicSubnet':
      stroke = '#98dcb1';
      fill = '#dcfce7';
      fillOpacity = 0.7;
      strokeDasharray = undefined;
      break;
    case 'PrivateSubnet':
      stroke = '#b0c2ec';
      fill = '#dbeafe';
      fillOpacity = 0.7;
      strokeDasharray = undefined;
      break;
    case 'AutoScaling':
      stroke = '#c06e09';
      strokeDasharray = '7 5';
      break;
    case 'StepFunctions':
      stroke = '#cd4085';
      strokeDasharray = undefined;
      break;
    default:
      strokeDasharray = '5,5';
      break;
  }

  const rectStyle: React.CSSProperties = {
    pointerEvents: 'all',
    cursor: 'pointer',
    opacity: 0.7,
  };

  const isCenteredLabel = frame.kind === 'AZ' || frame.kind === 'GeneralGroup' || frame.kind === 'AutoScaling';
  const isCenteredIcon = frame.kind === 'AutoScaling';
  const labelX = isCenteredLabel
    ? frame.width / 2
    : displayIcon
      ? elementSize.defaultNodeWidth * 0.6 + 12
      : 12;
  const labelAnchor: 'start' | 'middle' = isCenteredLabel ? 'middle' : 'start';
  const labelY = frame.kind === 'AutoScaling' && displayIcon 
    ? elementSize.defaultNodeWidth * 0.6 + 16
    : displayIcon ? elementSize.defaultNodeWidth * 0.6 - 4 : 20;
  
  const iconX = isCenteredIcon 
    ? (frame.width - elementSize.defaultNodeWidth * 0.6) / 2
    : 2;

  // Rough.js rendering for Region frames
  const roughDrawable = useMemo(() => {
    if (frame.kind === 'PublicSubnet' || frame.kind === 'PrivateSubnet') {
      return null;
    }

    const roughOptions: RoughOptions = {
      roughness: 0.2,
      bowing: 8,
      strokeWidth: strokeWidth,
      stroke: stroke,
      seed: frame.id * 42,
      disableMultiStroke: true
    };

    return createRoughRect(0, 0, frame.width, frame.height, roughOptions);
  }, [frame.kind, frame.width, frame.height, frame.id, stroke, strokeWidth]);

  // Render rough.js style for frames (except PublicSubnet and PrivateSubnet)
  if (roughDrawable) {
    return (
      <g
        transform={`translate(${frame.x}, ${frame.y})`}
        data-id={frame.id}
        data-type="frame"
        className={`frame-node ${isSelected ? 'node-selected' : ''}`}
        onMouseDown={handleMouseDown}
        onDoubleClick={handleDoubleClick}
      >
        {/* Invisible clickable area */}
        <rect
          width={frame.width}
          height={frame.height}
          fill="transparent"
          style={{ pointerEvents: 'all', cursor: 'pointer' }}
        />
        
        {roughDrawable.sets.map((set: OpSet, index: number) => {
          const pathCommands = set.ops.map((op: Op) => {
            if (!op.data || op.data.length === 0) return '';
            
            switch (op.op) {
              case 'move':
                return op.data.length >= 2 ? `M ${op.data[0]!.toFixed(2)} ${op.data[1]!.toFixed(2)}` : '';
              case 'line':
                return op.data.length >= 2 ? `L ${op.data[0]!.toFixed(2)} ${op.data[1]!.toFixed(2)}` : '';
              case 'curve':
                return op.data.length >= 4 ? `Q ${op.data[0]!.toFixed(2)} ${op.data[1]!.toFixed(2)} ${op.data[2]!.toFixed(2)} ${op.data[3]!.toFixed(2)}` : '';
              case 'bcurveTo':
                return op.data.length >= 6 ? `C ${op.data[0]!.toFixed(2)} ${op.data[1]!.toFixed(2)} ${op.data[2]!.toFixed(2)} ${op.data[3]!.toFixed(2)} ${op.data[4]!.toFixed(2)} ${op.data[5]!.toFixed(2)}` : '';
              default:
                return '';
            }
          }).filter((cmd: string) => cmd !== '').join(' ');

          return (
            <path
              key={`${frame.id}-rough-${index}`}
              d={pathCommands}
              stroke={set.stroke || roughDrawable.options?.stroke || stroke}
              strokeWidth={set.strokeWidth || roughDrawable.options?.strokeWidth || strokeWidth}
              strokeDasharray={strokeDasharray}
              fill={fill}
              fillOpacity={fillOpacity}
              style={{ pointerEvents: 'none' }}
            />
          );
        })}

        {displayIcon && (
          <image
            href={`aws-icons/${frame.kind}.png`}
            width={elementSize.defaultNodeWidth * 0.6}
            height={elementSize.defaultNodeHeight * 0.6}
            x={iconX}
            y={2}
            style={{ pointerEvents: 'all', cursor: 'pointer' }}
          />
        )}

        <text
          x={labelX}
          y={labelY}
          textAnchor={labelAnchor}
          className="node-label container-label"
          style={{
            pointerEvents: 'all',
            cursor: 'text',
            fontWeight: 'bold',
            fill: '#333333',
          }}
        >
          {labelText}
        </text>
      </g>
    );
  }

  // Regular SVG rendering for other frames
  return (
    <g
      transform={`translate(${frame.x}, ${frame.y})`}
      data-id={frame.id}
      data-type="frame"
      className={`frame-node ${isSelected ? 'node-selected' : ''}`}
      onMouseDown={handleMouseDown}
      onDoubleClick={handleDoubleClick}
    >
      <rect
        width={frame.width}
        height={frame.height}
        rx={8}
        className="shape container-shape"
        fill={fill}
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeDasharray={strokeDasharray}
        fillOpacity={fillOpacity}
        style={rectStyle}
      />

      {displayIcon && (
        <image
          href={`aws-icons/${frame.kind}.png`}
          width={elementSize.defaultNodeWidth * 0.6}
          height={elementSize.defaultNodeHeight * 0.6}
          x={iconX}
          y={2}
          style={{ pointerEvents: 'all', cursor: 'pointer' }}
        />
      )}

      <text
        x={labelX}
        y={labelY}
        textAnchor={labelAnchor}
        className="node-label container-label"
        style={{
          pointerEvents: 'all',
          cursor: 'text',
          fontWeight: 'bold',
          fill: '#333333',
        }}
      >
        {labelText}
      </text>
    </g>
  );
};

export default FrameNode;
