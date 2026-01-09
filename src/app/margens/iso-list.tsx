'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { IsoMarginConfig } from '@/lib/db/iso-margins';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Building2, ChevronRight, ChevronLeft, Layers, Settings } from 'lucide-react';
import Link from 'next/link';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ISO_ACCESS_STORAGE_KEY = 'margens_iso_last_access';

function getIsoAccessHistory(): Record<number, number> {
  if (typeof window === 'undefined') return {};
  try {
    const stored = localStorage.getItem(ISO_ACCESS_STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

function saveIsoAccess(customerId: number): void {
  if (typeof window === 'undefined') return;
  try {
    const history = getIsoAccessHistory();
    history[customerId] = Date.now();
    localStorage.setItem(ISO_ACCESS_STORAGE_KEY, JSON.stringify(history));
  } catch {
    console.error('Failed to save ISO access history');
  }
}

interface IsoListProps {
  isoConfigs: IsoMarginConfig[];
  userRole: 'super_admin' | 'executivo' | 'core' | null;
  isSuperAdminForView?: boolean;
  isSimulating?: boolean;
  simulatedUserId?: number | null;
}

export function IsoList({ 
  isoConfigs, 
  userRole,
  isSuperAdminForView = false,
  isSimulating = false,
}: IsoListProps) {
  const isNonAdmin = userRole === 'executivo' || userRole === 'core';
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'configured' | 'pending'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [accessHistory, setAccessHistory] = useState<Record<number, number>>({});

  useEffect(() => {
    setAccessHistory(getIsoAccessHistory());
  }, []);

  const handleIsoClick = useCallback((customerId: number) => {
    saveIsoAccess(customerId);
    setAccessHistory(prev => ({ ...prev, [customerId]: Date.now() }));
  }, []);

  const filteredConfigs = useMemo(() => {
    let result = isoConfigs;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(c => 
        c.customerName.toLowerCase().includes(term) ||
        c.customerSlug.toLowerCase().includes(term)
      );
    }

    if (statusFilter === 'configured') {
      result = result.filter(c => c.linkedTablesCount > 0);
    } else if (statusFilter === 'pending') {
      result = result.filter(c => c.linkedTablesCount === 0);
    }

    result = [...result].sort((a, b) => {
      const aAccess = accessHistory[a.customerId] || 0;
      const bAccess = accessHistory[b.customerId] || 0;
      return bAccess - aAccess;
    });

    return result;
  }, [isoConfigs, searchTerm, statusFilter, accessHistory]);

  const totalPages = Math.max(1, Math.ceil(filteredConfigs.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedConfigs = useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredConfigs.slice(startIndex, endIndex);
  }, [filteredConfigs, safeCurrentPage, pageSize]);

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setCurrentPage(1);
  };

  const handleFilterChange = (filter: 'all' | 'configured' | 'pending') => {
    setStatusFilter(filter);
    setCurrentPage(1);
  };

  const stats = useMemo(() => {
    const configured = isoConfigs.filter(c => c.validatedTablesCount > 0).length;
    const draft = isoConfigs.filter(c => c.draftTablesCount > 0 && c.validatedTablesCount === 0).length;
    const pending = isoConfigs.filter(c => c.linkedTablesCount === 0).length;
    return { total: isoConfigs.length, configured, draft, pending };
  }, [isoConfigs]);

  const hasMargins = (config: IsoMarginConfig) => {
    if (userRole === 'executivo') {
      return parseFloat(config.marginExecutivo) > 0;
    }
    if (userRole === 'core') {
      return parseFloat(config.marginCore) > 0;
    }
    return parseFloat(config.marginOutbank) > 0 || 
           parseFloat(config.marginExecutivo) > 0 || 
           parseFloat(config.marginCore) > 0;
  };

  const getUserMargin = (config: IsoMarginConfig) => {
    if (userRole === 'executivo') return config.marginExecutivo;
    if (userRole === 'core') return config.marginCore;
    return null;
  };

  const getRoleLabel = () => {
    if (userRole === 'super_admin') return 'Super Admin';
    if (userRole === 'executivo') return 'Executivo';
    if (userRole === 'core') return 'Core';
    return 'Usuário';
  };

  return (
    <div className="space-y-6">
      {isSimulating && !isSuperAdminForView && (
        <div className="bg-amber-600/20 border border-amber-500/50 rounded-lg px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              <span className="text-amber-300 text-sm font-medium">
                Modo Simulação: Visualizando como {getRoleLabel()}
              </span>
            </div>
            <span className="text-amber-300/70 text-xs">
              {isoConfigs.length} ISO{isoConfigs.length !== 1 ? 's' : ''} visível{isoConfigs.length !== 1 ? 'is' : ''}
            </span>
          </div>
        </div>
      )}
      
      <div className="space-y-6">
        {!isNonAdmin && (
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-medium">Total ISOs</CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold">{stats.total}</div>
                <p className="text-xs text-muted-foreground">Total de ISOs cadastrados</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-medium">Configurados</CardTitle>
                <Settings className="h-4 w-4 text-emerald-400" />
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold text-emerald-400">{stats.configured}</div>
                <p className="text-xs text-muted-foreground">ISOs com tabelas vinculadas</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-medium">Pendentes</CardTitle>
                <Layers className="h-4 w-4 text-orange-400" />
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold text-orange-400">{stats.pending}</div>
                <p className="text-xs text-muted-foreground">ISOs sem tabelas vinculadas</p>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#616161]" />
            <Input
              placeholder="Buscar ISO..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-[42px] bg-[#424242] border border-[#353535] rounded-[6px] text-[#E0E0E0] placeholder:text-[#E0E0E0] focus-visible:ring-2 focus-visible:ring-[#555555] focus-visible:border-[#555555]"
            />
          </div>
          
          {!isNonAdmin && (
            <div className="flex gap-2">
              <Button
                variant={statusFilter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleFilterChange('all')}
                className={statusFilter === 'all' ? 'bg-[#ff9800] hover:bg-[#f57c00] text-black' : 'border-[#2E2E2E] text-[#616161]'}
              >
                Todos
              </Button>
              <Button
                variant={statusFilter === 'configured' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleFilterChange('configured')}
                className={statusFilter === 'configured' ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'border-[#2E2E2E] text-[#616161]'}
              >
                Configurados
              </Button>
              <Button
                variant={statusFilter === 'pending' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleFilterChange('pending')}
                className={statusFilter === 'pending' ? 'bg-orange-600 hover:bg-orange-700 text-white' : 'border-[#2E2E2E] text-[#616161]'}
              >
                Pendentes
              </Button>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3">
          {paginatedConfigs
            .filter(config => config.customerId !== null && config.customerId !== undefined)
            .map((config, index) => (
            <Link 
              key={config.customerId || `iso-${index}`} 
              href={`/margens/${config.customerId}`}
              onClick={() => handleIsoClick(config.customerId)}
            >
              <Card className="border border-[rgba(255,255,255,0.1)] rounded-[6px] hover:border-[#ff9800]/50 transition-all cursor-pointer group bg-[#1D1D1D]">
                <CardContent className="py-3 px-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-[#2E2E2E] rounded-lg">
                        <Building2 className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-medium text-white">{config.customerName}</h3>
                        <p className="text-sm text-[#616161]">{config.customerSlug}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      {hasMargins(config) ? (
                        <div className="flex items-center gap-4 text-sm">
                          {isNonAdmin ? (
                            <div className="text-center">
                              <p className="text-[#616161] text-xs">Sua Margem</p>
                              <p className="text-white font-medium">{getUserMargin(config)}%</p>
                            </div>
                          ) : (
                            <>
                              <div className="text-center">
                                <p className="text-[#616161] text-xs">Outbank</p>
                                <p className="text-white font-medium">{config.marginOutbank}%</p>
                              </div>
                              <div className="text-center">
                                <p className="text-[#616161] text-xs">Executivo</p>
                                <p className="text-white font-medium">{config.marginExecutivo}%</p>
                              </div>
                              <div className="text-center">
                                <p className="text-[#616161] text-xs">CORE</p>
                                <p className="text-white font-medium">{config.marginCore}%</p>
                              </div>
                            </>
                          )}
                        </div>
                      ) : (
                        <span className="text-[#616161] text-sm">{isNonAdmin ? 'Margem não configurada' : 'Margens não configuradas'}</span>
                      )}

                      <div className="flex items-center gap-3">
                        {!isNonAdmin && config.validatedTablesCount > 0 && (
                          <Badge 
                            variant="outline" 
                            className="border-emerald-500/50 text-emerald-400 bg-emerald-500/10"
                          >
                            {config.validatedTablesCount} validada{config.validatedTablesCount !== 1 ? 's' : ''}
                          </Badge>
                        )}
                        {!isNonAdmin && config.draftTablesCount > 0 && (
                          <Badge 
                            variant="outline" 
                            className="border-yellow-500/50 text-yellow-400 bg-yellow-500/10"
                          >
                            {config.draftTablesCount} rascunho{config.draftTablesCount !== 1 ? 's' : ''}
                          </Badge>
                        )}
                        {!isNonAdmin && config.linkedTablesCount === 0 && (
                          <Badge 
                            variant="outline" 
                            className="border-orange-500/50 text-orange-400 bg-orange-500/10"
                          >
                            Sem tabelas
                          </Badge>
                        )}
                        <ChevronRight className="w-5 h-5 text-[#616161]" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}

          {filteredConfigs.length === 0 && (
            <div className="w-full p-4 text-center border border-[rgba(255,255,255,0.1)] rounded-[6px] bg-[#1D1D1D]">
              <p className="text-[#5C5C5C] text-sm font-normal">Nenhum ISO encontrado</p>
            </div>
          )}
        </div>

        {paginatedConfigs.length > 0 && (
          <div className="flex items-center justify-between pt-4 border-t border-[rgba(255,255,255,0.1)]">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-[#616161]">Exibir</span>
                <Select
                  value={pageSize.toString()}
                  onValueChange={(value) => handlePageSizeChange(parseInt(value))}
                >
                  <SelectTrigger className="w-[70px] h-8 bg-[#0d0d0d] border border-[#2a2a2a] rounded-md text-white text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
                <span className="text-sm text-[#616161]">por página</span>
              </div>
              <span className="text-sm text-[#616161]">
                Mostrando {Math.min((safeCurrentPage - 1) * pageSize + 1, filteredConfigs.length)} - {Math.min(safeCurrentPage * pageSize, filteredConfigs.length)} de {filteredConfigs.length}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={safeCurrentPage === 1}
                className="border-[#2E2E2E] text-[#616161] hover:text-white disabled:opacity-50"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Anterior
              </Button>
              <span className="text-sm text-white px-3">
                {safeCurrentPage} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={safeCurrentPage >= totalPages}
                className="border-[#2E2E2E] text-[#616161] hover:text-white disabled:opacity-50"
              >
                Próximo
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
