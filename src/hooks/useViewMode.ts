"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

export type ViewMode = 'super_admin' | 'admin' | 'executivo' | 'core';

export interface SimulatedUser {
  id: number;
  name: string;
  category: ViewMode;
}

interface ViewModeState {
  isSimulating: boolean;
  simulatedUser: SimulatedUser | null;
}

const VIEW_MODE_KEY = 'portal_view_mode';

export function useViewMode(isSuperAdmin: boolean) {
  const router = useRouter();
  const [state, setState] = useState<ViewModeState>({
    isSimulating: false,
    simulatedUser: null,
  });

  useEffect(() => {
    if (typeof window !== 'undefined' && isSuperAdmin) {
      const stored = sessionStorage.getItem(VIEW_MODE_KEY);
      if (stored) {
        try {
          const parsed = JSON.parse(stored) as ViewModeState;
          setState({
            isSimulating: parsed.isSimulating,
            simulatedUser: parsed.simulatedUser || null,
          });
        } catch {
          sessionStorage.removeItem(VIEW_MODE_KEY);
        }
      } else {
        fetch('/api/dev/view-as')
          .then(res => res.json())
          .then(data => {
            if (data.isSimulating && data.userId) {
              console.log('[useViewMode] Orphan cookie detected, clearing silently...');
              fetch('/api/dev/view-as', { method: 'DELETE' })
                .then(() => {
                  console.log('[useViewMode] Orphan cookie cleared');
                  router.refresh();
                })
                .catch(err => console.error('[useViewMode] Failed to clear orphan cookie:', err));
            }
          })
          .catch(err => console.error('[useViewMode] Failed to check server state:', err));
      }
    }
  }, [isSuperAdmin, router]);

  const setSimulatedUser = useCallback(async (user: SimulatedUser) => {
    if (!isSuperAdmin) return;
    
    const newState: ViewModeState = {
      isSimulating: true,
      simulatedUser: user,
    };
    
    setState(newState);
    
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(VIEW_MODE_KEY, JSON.stringify(newState));
      await fetch('/api/dev/view-as', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      });
      router.refresh();
    }
  }, [isSuperAdmin, router]);

  const resetViewMode = useCallback(async () => {
    setState({ isSimulating: false, simulatedUser: null });
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(VIEW_MODE_KEY);
      await fetch('/api/dev/view-as', { method: 'DELETE' });
      router.refresh();
    }
  }, [router]);

  return {
    isSimulating: state.isSimulating,
    simulatedUser: state.simulatedUser,
    setSimulatedUser,
    resetViewMode,
  };
}
