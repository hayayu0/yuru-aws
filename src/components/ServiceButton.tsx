import React, { useEffect } from 'react';
import { awsServices, getIconPath } from '../types/aws';
import { useAppActions } from '../hooks/useAppActions';
import { useAppState } from '../hooks/useAppState';

interface ServiceButtonProps {
  serviceName: string;
}

const ServiceButton: React.FC<ServiceButtonProps> = ({ serviceName }) => {
  const { setNodeToAdd, setActiveTool, updateDrawing } = useAppActions();
  const { state } = useAppState();
  const service = awsServices[serviceName];
  const isDisabled = state.isAIGenerating;
  
  if (!service) {
    console.warn(`Service ${serviceName} not found in awsServices`);
    return null;
  }
  
  const handleClick = () => {
    if (isDisabled) return;
    
    // Always switch to select tool when adding nodes (from any tool including pen tools)
    setActiveTool("select");

    // Clear any ongoing drawing state from pen tools
    if (state.drawing && state.drawing.active) {
      updateDrawing({
        active: false,
        pathEl: null,
        points: [],
      });
    }

    // Set cursor to copy and prepare for node addition
    setNodeToAdd(serviceName);
  };

  // Update cursor when nodeToAdd changes
  useEffect(() => {
    const canvas = document.getElementById('diagramCanvas');
    if (canvas && state.nodeToAdd === serviceName) {
      canvas.style.cursor = 'copy';
    }
  }, [state.nodeToAdd, serviceName]);

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    // Hide image if it fails to load
    e.currentTarget.style.display = 'none';
  };

  return (
    <button
      type="button"
      data-kind={serviceName}
      title={serviceName}
      onClick={handleClick}
      disabled={isDisabled}
      aria-label={`Add ${service.buttonText || serviceName} to diagram`}
    >
      <img 
        src={getIconPath(serviceName)} 
        alt=""
        style={{ pointerEvents: 'none' }}
        onError={handleImageError}
      />
      <span>{service.buttonText || serviceName}</span>
    </button>
  );
};

export default ServiceButton;