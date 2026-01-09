'use client';

import { createContext, useContext, ReactNode } from 'react';
import { useViewMode, SimulatedUser } from '@/hooks/useViewMode';

interface ViewModeContextType {
  isSimulating: boolean;
  simulatedUser: SimulatedUser | null;
  setSimulatedUser: (user: SimulatedUser) => void;
  resetViewMode: () => void;
}

const ViewModeContext = createContext<ViewModeContextType | null>(null);

interface ViewModeProviderProps {
  children: ReactNode;
  isSuperAdmin: boolean;
}

export function ViewModeProvider({ children, isSuperAdmin }: ViewModeProviderProps) {
  const viewModeState = useViewMode(isSuperAdmin);
  
  return (
    <ViewModeContext.Provider value={viewModeState}>
      {children}
    </ViewModeContext.Provider>
  );
}

export function useViewModeContext() {
  const context = useContext(ViewModeContext);
  if (!context) {
    return null;
  }
  return context;
}

export function useSimulatedUserId(): number | null {
  const context = useContext(ViewModeContext);
  if (!context) {
    return null;
  }
  if (context.isSimulating && context.simulatedUser?.id) {
    return context.simulatedUser.id;
  }
  return null;
}
