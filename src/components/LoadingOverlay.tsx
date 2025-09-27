import React from 'react';
import { useAppState } from '../hooks/useAppState';

const LoadingOverlay: React.FC = () => {
  const { state } = useAppState();

  if (!state.isAIGenerating && !state.aiError) return null;

  return (
    <div className="loading-overlay">
      <div className="loading-spinner">
        {state.isAIGenerating ? (
          <>
            <div className="spinner"></div>
            <p>AI構成図を生成中...</p>
          </>
        ) : (
          <p style={{ color: '#ef4444', fontSize: '1.2rem', fontWeight: 'bold', whiteSpace: 'pre-line' }}>
            {state.aiErrorMessage || '生成に失敗しました。'}
          </p>
        )}
      </div>
    </div>
  );
};

export default LoadingOverlay;