import React from 'react';
import { useAppState } from '../hooks/useAppState';
import { useAppActions } from '../hooks/useAppActions';
import type { ToolType } from '../types';

interface ToolButtonProps {
  tool: ToolType;
  children: React.ReactNode;
  className?: string;
}

const ToolButton: React.FC<ToolButtonProps> = ({ tool, children, className = '' }) => {
  const { state } = useAppState();
  const { setActiveTool } = useAppActions();

  const isActive = state.activeTool === tool;
  const isDisabled = state.isAIGenerating;

  const handleClick = () => {
    if (!isDisabled) {
      setActiveTool(tool);
    }
  };

  return (
    <button
      type="button"
      data-tool={tool}
      className={`${className} ${isActive ? 'active' : ''}`.trim()}
      onClick={handleClick}
      disabled={isDisabled}
    >
      {children}
    </button>
  );
};

export default ToolButton;