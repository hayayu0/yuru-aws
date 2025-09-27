import { createContext } from 'react';
import type { AppState, AppAction } from '../types';

// Context
interface AppStateContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
}

export const AppStateContext = createContext<AppStateContextType | undefined>(undefined);