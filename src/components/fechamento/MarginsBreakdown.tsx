'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Percent, Building2, TrendingUp, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MarginEntry {
  modalidade: string;
  canal: string;
  marginPercent: number;
}

interface UserMarginBreakdown {
  customerId: number;
  customerName: string;
  marginType: 'OUTBANK' | 'EXECUTIVO' | 'CORE';
  margins: MarginEntry[];
  totalMarginSum: number;
}

const marginTypeColors: Record<string, string> = {
  'OUTBANK': 'border-purple-500/50 text-purple-400 bg-purple-500/10',
  'EXECUTIVO': 'border-blue-500/50 text-blue-400 bg-blue-500/10',
  'CORE': 'border-amber-500/50 text-amber-400 bg-amber-500/10',
};

const marginTypeLabels: Record<string, string> = {
  'OUTBANK': 'Outbank',
  'EXECUTIVO': 'Executivo',
  'CORE': 'Core',
};

const getMarginBadgeVariant = (value: number): 'info' | 'destructive' | 'inactive' => {
  if (value < 0) return 'destructive';
  if (value > 0) return 'info';
  return 'inactive';
};

function IsoMarginCard({ item }: { item: UserMarginBreakdown }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card className="bg-[#0a0a0a] border-[#2E2E2E] overflow-hidden">
      <Button
        variant="ghost"
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-[#1a1a1a] h-auto"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <Building2 className="w-4 h-4 text-[#616161]" />
          <span className="text-white font-medium">{item.customerName}</span>
          <Badge variant="outline" className={marginTypeColors[item.marginType]}>
            {marginTypeLabels[item.marginType]}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={getMarginBadgeVariant(item.totalMarginSum)} className="text-xs">
            {item.totalMarginSum.toFixed(2)}%
          </Badge>
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-[#616161]" />
          ) : (
            <ChevronDown className="w-4 h-4 text-[#616161]" />
          )}
        </div>
      </Button>
      
      {expanded && (
        <div className="px-4 pb-4 border-t border-[#2E2E2E]">
          {item.margins.length === 0 ? (
            <p className="text-[#616161] text-sm mt-3">Nenhuma margem específica configurada</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 mt-3">
              {item.margins.map((m, idx) => (
                <div 
                  key={idx} 
                  className="flex items-center justify-between p-2 bg-[#1a1a1a] rounded border border-[#2E2E2E]"
                >
                  <div className="flex items-center gap-2">
                    <Percent className="w-3 h-3 text-[#616161]" />
                    <span className="text-sm text-white">{m.modalidade}</span>
                    <span className="text-xs text-[#616161]">({m.canal})</span>
                  </div>
                  <span className="text-sm font-medium text-blue-400">
                    {m.marginPercent.toFixed(2)}%
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

export function MarginsBreakdown() {
  const [loading, setLoading] = useState(true);
  const [breakdown, setBreakdown] = useState<UserMarginBreakdown[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBreakdown() {
      try {
        setLoading(true);
        const res = await fetch('/api/fechamento/margins-breakdown', {
          credentials: 'include',
        });
        if (!res.ok) {
          throw new Error('Erro ao buscar margens');
        }
        const data = await res.json();
        setBreakdown(data.breakdown || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchBreakdown();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-[#616161]" />
        <span className="ml-2 text-[#616161]">Carregando margens...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-400">
        {error}
      </div>
    );
  }

  if (breakdown.length === 0) {
    return (
      <div className="text-center py-8 text-[#616161]">
        Nenhuma margem configurada para este usuário
      </div>
    );
  }

  const totalGeral = breakdown.reduce((sum, b) => sum + b.totalMarginSum, 0);

  return (
    <div className="space-y-4">
      <Card className="p-4 bg-[#0a0a0a] border-[#2E2E2E]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
            <span className="text-white font-medium">Resumo Geral</span>
          </div>
          <div className="text-right">
            <p className="text-sm text-[#616161]">Soma Total das Margens</p>
            <p className="text-xl font-bold text-emerald-400">{totalGeral.toFixed(2)}%</p>
          </div>
        </div>
      </Card>

      <div className="space-y-2">
        {breakdown.map((item) => (
          <IsoMarginCard key={item.customerId} item={item} />
        ))}
      </div>
    </div>
  );
}
