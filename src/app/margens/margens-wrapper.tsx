'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { IsoList } from './iso-list';
import { getIsoList, getUserRole, checkIsSuperAdminForView } from './actions-new';
import { useSimulatedUserId } from '@/contexts/ViewModeContext';
import { IsoMarginConfig } from '@/lib/db/iso-margins';

interface MargensWrapperProps {
  initialIsoConfigs: IsoMarginConfig[];
  initialUserRole: 'super_admin' | 'admin' | 'executivo' | 'core' | null;
  initialIsSuperAdmin: boolean;
  initialIsSimulating?: boolean;
  initialSimulatedUserId?: number | null;
}

export function MargensWrapper({ 
  initialIsoConfigs, 
  initialUserRole,
  initialIsSuperAdmin,
  initialIsSimulating = false,
  initialSimulatedUserId = null
}: MargensWrapperProps) {
  const simulatedUserId = useSimulatedUserId();
  const previousSimulatedUserId = useRef<number | null>(initialSimulatedUserId);
  
  const [isoConfigs, setIsoConfigs] = useState<IsoMarginConfig[]>(initialIsoConfigs);
  const [userRole, setUserRole] = useState<'super_admin' | 'admin' | 'executivo' | 'core' | null>(initialUserRole);
  const [isSuperAdminForView, setIsSuperAdminForView] = useState(initialIsSuperAdmin);
  const [loading, setLoading] = useState(false);
  const [isSimulating, setIsSimulating] = useState(initialIsSimulating);

  const loadData = useCallback(async (targetUserId: number | null) => {
    setLoading(true);
    try {
      const [configs, role, superAdminStatus] = await Promise.all([
        getIsoList(targetUserId),
        getUserRole(targetUserId),
        checkIsSuperAdminForView(targetUserId)
      ]);
      
      setIsoConfigs(configs);
      setUserRole(role);
      setIsSuperAdminForView(superAdminStatus);
      setIsSimulating(targetUserId !== null);
      
      console.log('[MargensWrapper] Data loaded:', {
        targetUserId,
        configsCount: configs.length,
        role,
        superAdminStatus,
        isSimulating: targetUserId !== null
      });
    } catch (error) {
      console.error('[MargensWrapper] Error loading data:', error);
      setIsoConfigs(initialIsoConfigs);
      setUserRole(initialUserRole);
      setIsSuperAdminForView(initialIsSuperAdmin);
      setIsSimulating(false);
    } finally {
      setLoading(false);
    }
  }, [initialIsoConfigs, initialUserRole, initialIsSuperAdmin]);

  useEffect(() => {
    const wasSimulating = previousSimulatedUserId.current !== null;
    const isNowSimulating = simulatedUserId !== null;
    
    if (isNowSimulating) {
      loadData(simulatedUserId);
    } else if (wasSimulating) {
      loadData(null);
    }
    
    previousSimulatedUserId.current = simulatedUserId;
  }, [simulatedUserId, loadData]);

  if (loading) {
    return (
      <div className="p-8 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
          <p>{simulatedUserId ? 'Carregando dados do usuário simulado...' : 'Restaurando visão completa...'}</p>
        </div>
      </div>
    );
  }

  return (
    <IsoList 
      isoConfigs={isoConfigs} 
      userRole={userRole}
      isSuperAdminForView={isSuperAdminForView}
      isSimulating={isSimulating}
      simulatedUserId={simulatedUserId}
    />
  );
}
