import { useContext } from 'react';
import { AppStateContext } from '../context/AppContext';

// Custom hook
export const useAppState = () => {
  const context = useContext(AppStateContext);
  if (context === undefined) {
    throw new Error('useAppState must be used within an AppStateProvider');
  }
  return context;
};