"use client";

import { useState, useEffect, useCallback } from "react";
import { BiFilters } from "./bi-filters";
import { ExecutiveLayer } from "./layers/executive-layer";
import { FinancialLayer } from "./layers/financial-layer";
import { BrandProductLayer } from "./layers/brand-product-layer";
import { TemporalLayer } from "./layers/temporal-layer";
import { ConversionLayer } from "./layers/conversion-layer";
import { CommercialLayer } from "./layers/commercial-layer";
import { Loader2 } from "lucide-react";

export type BiData = {
  executive: {
    tpv: number;
    totalTransactions: number;
    ticketMedio: number;
    taxaAprovacao: string;
    taxaCancelamento: string;
    taxaRecusa: string;
  };
  dailyTpv: Array<{
    date: string;
    count: number;
    tpv: number;
    ticketMedio: number;
    taxaAprovacao: string;
  }>;
  productMix: Array<{ name: string; count: number; value: number }>;
  brandAnalysis: Array<{ name: string; count: number; tpv: number; taxaAprovacao: string }>;
  hourlyHeatmap: Array<{ hour: number; dayOfWeek: number; count: number; tpv: number }>;
  weekdayVolume: Array<{ day: string; dayIndex: number; count: number; tpv: number; ticketMedio: number }>;
  shiftVolume: Array<{ shift: string; count: number; tpv: number }>;
  statusDistribution: Array<{ status: string; count: number; tpv: number }>;
  topMerchants: Array<{ slug: string; name: string; customerSlug: string; count: number; tpv: number }>;
  settlement: { bruto: number; liquido: number; taxas: number; pendingCount: number };
  customerBreakdown: Array<{ name: string; slug: string; count: number; tpv: number }>;
  merchantBreakdown: Array<{ name: string; slug: string }>;
  mdrData: {
    isoMargins: Array<{
      customerId: number;
      customerName: string;
      slug: string;
      marginOutbank: number;
      marginExecutivo: number;
      marginCore: number;
    }>;
    brandMargins: Array<{
      bandeira: string;
      modalidade: string;
      marginIso: number;
      customerId: number;
      customerName: string;
    }>;
    avgMarginPortal: number;
  };
  filters: { dateFrom: string; dateTo: string; availableCustomers: string[] };
};

export type BiFiltersState = {
  dateFrom: string;
  dateTo: string;
  customer: string;
  merchant: string;
  brand: string;
  productType: string;
  salesChannel: string;
  status: string;
};

export function BiDashboard() {
  const [data, setData] = useState<BiData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  
  const [filters, setFilters] = useState<BiFiltersState>({
    dateFrom: '',
    dateTo: '',
    customer: '',
    merchant: '',
    brand: '',
    productType: '',
    salesChannel: '',
    status: ''
  });

  useEffect(() => {
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    setFilters(prev => ({
      ...prev,
      dateFrom: thirtyDaysAgo.toISOString().split('T')[0],
      dateTo: today.toISOString().split('T')[0]
    }));
    setMounted(true);
  }, []);

  const fetchData = useCallback(async () => {
    if (!filters.dateFrom || !filters.dateTo) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams();
      params.set('dateFrom', filters.dateFrom);
      params.set('dateTo', filters.dateTo);
      if (filters.customer) params.set('customer', filters.customer);
      if (filters.merchant) params.set('merchant', filters.merchant);
      if (filters.brand) params.set('brand', filters.brand);
      if (filters.productType) params.set('productType', filters.productType);
      if (filters.salesChannel) params.set('salesChannel', filters.salesChannel);
      if (filters.status) params.set('status', filters.status);

      const response = await fetch(`/api/bi?${params.toString()}`);
      
      const contentType = response.headers.get('content-type');
      if (!contentType?.includes('application/json')) {
        if (response.status === 401 || response.redirected) {
          window.location.href = '/auth/sign-in';
          return;
        }
        throw new Error('Sessão expirada. Por favor, faça login novamente.');
      }
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Erro ao carregar dados');
      }
      
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    if (mounted && filters.dateFrom && filters.dateTo) {
      fetchData();
    }
  }, [mounted, filters, fetchData]);

  const handleFilterChange = (newFilters: Partial<BiFiltersState>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-64 text-red-400">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <BiFilters 
        filters={filters} 
        onFilterChange={handleFilterChange}
        availableCustomers={data?.filters?.availableCustomers || []}
        customerBreakdown={data?.customerBreakdown || []}
        merchantBreakdown={data?.merchantBreakdown || []}
      />
      
      <div className="relative">
        {loading && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10 rounded-lg">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            <span className="ml-3 text-gray-400">Carregando dados...</span>
          </div>
        )}
        
        {data ? (
          <div className="space-y-10">
            <ExecutiveLayer data={data} />
            <FinancialLayer data={data} />
            <BrandProductLayer data={data} />
            <TemporalLayer data={data} />
            <ConversionLayer data={data} />
            <CommercialLayer data={data} />
          </div>
        ) : (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            <span className="ml-3 text-gray-400">Carregando dados...</span>
          </div>
        )}
      </div>
    </div>
  );
}
