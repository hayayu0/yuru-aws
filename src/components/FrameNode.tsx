import React, { useMemo } from 'react';
import { awsServices, elementSize } from '../types/aws';
import type { Frame } from '../types';
import { createRoughRect, type RoughOptions } from '../utils/roughDrawing';
import type { OpSet, Op } from '../types/roughjs';

interface FrameNodeProps {
  frame: Frame;
  isSelected: boolean;
}

const FrameNode: React.FC<FrameNodeProps> = ({ frame, isSelected }) => {
  const service = awsServices[frame.kind];
  const displayIcon = service?.displayIcon !== false;
  const labelText = frame.label || service?.buttonText || frame.kind;

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
  const baseLabelY = frame.kind === 'AutoScaling' && displayIcon
    ? elementSize.defaultNodeWidth * 0.6 + 20
    : displayIcon ? elementSize.defaultNodeWidth * 0.6 - 12 : 12;
  const labelY = isCenteredLabel
    ? baseLabelY + 8
    : baseLabelY;

  const iconX = isCenteredIcon
    ? (frame.width - elementSize.defaultNodeWidth * 0.6) / 2
    : 2;

  const roughDrawable = useMemo(() => {
    if (frame.kind === 'PublicSubnet' || frame.kind === 'PrivateSubnet') {
      return null;
    }

    const roughOptions: RoughOptions = {
      roughness: 0.2,
      bowing: 8,
      strokeWidth,
      stroke,
      seed: frame.id * 42,
      disableMultiStroke: true,
    };

    return createRoughRect(0, 0, frame.width, frame.height, roughOptions);
  }, [frame.kind, frame.width, frame.height, frame.id, stroke, strokeWidth]);

  const baseGroupProps = {
    transform: `translate(${frame.x}, ${frame.y})`,
    'data-id': frame.id,
    'data-element-id': frame.id,
    'data-element-type': 'frame',
    className: `frame-node ${isSelected ? 'node-selected' : ''}`,
  } as const;

  if (roughDrawable) {
    return (
      <g {...baseGroupProps}>
        <rect
          width={frame.width}
          height={frame.height}
          fill="transparent"
          style={{ pointerEvents: 'all', cursor: 'pointer' }}
        />

        {roughDrawable.sets.map((set: OpSet, index: number) => {
          const pathCommands = set.ops
            .map((op: Op) => {
              if (!op.data || op.data.length === 0) return '';

              switch (op.op) {
                case 'move':
                  return op.data.length >= 2 ? `M ${op.data[0]!.toFixed(2)} ${op.data[1]!.toFixed(2)}` : '';
                case 'line':
                  return op.data.length >= 2 ? `L ${op.data[0]!.toFixed(2)} ${op.data[1]!.toFixed(2)}` : '';
                case 'curve':
                  return op.data.length >= 4
                    ? `Q ${op.data[0]!.toFixed(2)} ${op.data[1]!.toFixed(2)} ${op.data[2]!.toFixed(2)} ${op.data[3]!.toFixed(2)}`
                    : '';
                case 'bcurveTo':
                  return op.data.length >= 6
                    ? `C ${op.data[0]!.toFixed(2)} ${op.data[1]!.toFixed(2)} ${op.data[2]!.toFixed(2)} ${op.data[3]!.toFixed(2)} ${op.data[4]!.toFixed(2)} ${op.data[5]!.toFixed(2)}`
                    : '';
                default:
                  return '';
              }
            })
            .filter(Boolean)
            .join(' ');

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
          style={{ pointerEvents: 'all', cursor: 'text', fontWeight: 'bold', fill: '#333333' }}
        >
          {labelText}
        </text>
      </g>
    );
  }

  return (
    <g {...baseGroupProps}>
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
        style={{ pointerEvents: 'all', cursor: 'text', fontWeight: 'bold', fill: '#333333' }}
      >
        {labelText}
      </text>
    </g>
  );
};

export default FrameNode;
