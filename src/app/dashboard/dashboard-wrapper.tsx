'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSimulatedUserId } from '@/contexts/ViewModeContext';
import Dashboard from '@/components/dashboard-page';
import { MerchantData } from '@/app/dashboard/actions';

interface IsoStats {
  customerId: number;
  customerName: string;
  transactionCount: number;
  volume: number;
  profit: number;
  marginPercent: number;
}

interface DashboardData {
  totalEstabelecimentos: number;
  totalTransacoes: number;
  totalBruto: number;
  totalLucro: number;
  topMerchants: MerchantData[];
  isoBreakdown?: IsoStats[];
  lastUpdate?: Date;
}

const defaultData: DashboardData = {
  totalEstabelecimentos: 0,
  totalTransacoes: 0,
  totalBruto: 0,
  totalLucro: 0,
  topMerchants: [],
  isoBreakdown: [],
  lastUpdate: new Date()
};

export function DashboardWrapper({ initialData }: { initialData?: DashboardData }) {
  const simulatedUserId = useSimulatedUserId();
  const [dashboardData, setDashboardData] = useState<DashboardData>(initialData || defaultData);
  const [isLoading, setIsLoading] = useState(false);

  const fetchDashboardData = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (simulatedUserId) {
        params.set('simulatedUserId', simulatedUserId.toString());
      }
      
      const url = `/api/dashboard${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await fetch(url);
      
      if (response.ok) {
        const data = await response.json();
        setDashboardData({
          ...data,
          lastUpdate: data.lastUpdate ? new Date(data.lastUpdate) : new Date()
        });
      }
    } catch (error) {
      console.error('Erro ao buscar dados do dashboard:', error);
    } finally {
      setIsLoading(false);
    }
  }, [simulatedUserId]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  return (
    <div className="relative">
      {isLoading && (
        <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      )}
      <Dashboard dashboardData={dashboardData} />
    </div>
  );
}
