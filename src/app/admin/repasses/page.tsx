'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  RefreshCw, 
  Search, 
  CheckCircle, 
  Clock, 
  FileText, 
  AlertCircle,
  Eye,
  DollarSign,
  Calendar,
  Filter,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { toast } from 'sonner';
import BaseHeader from '@/components/layout/base-header';
import BaseBody from '@/components/layout/base-body';

interface Settlement {
  id: number;
  id_user: number;
  id_customer: number;
  month: number;
  year: number;
  total_volume: number;
  total_transactions: number;
  commission_percentage: number;
  commission_amount: number;
  status: string;
  paid_at: string | null;
  paid_by: number | null;
  created_at: string;
  user_name: string;
  user_email: string;
  customer_name: string;
  invoice_id: number | null;
  invoice_file_url: string | null;
  invoice_validation_status: string | null;
}

interface PaginationInfo {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const STATUS_CONFIG: Record<string, { label: string; variant: string; icon: any }> = {
  pending_consolidation: { label: 'Pendente', variant: 'inactive', icon: Clock },
  pending_invoice: { label: 'Aguardando NF', variant: 'draft', icon: FileText },
  validating: { label: 'Validando', variant: 'info', icon: RefreshCw },
  eligible: { label: 'Elegível', variant: 'success', icon: CheckCircle },
  paid: { label: 'Pago', variant: 'success', icon: DollarSign },
  accumulated: { label: 'Acumulado', variant: 'warning', icon: AlertCircle },
};

export default function AdminRepassesPage() {
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<PaginationInfo>({ page: 1, pageSize: 20, total: 0, totalPages: 0 });
  
  const currentYear = new Date().getFullYear();
  
  const [filters, setFilters] = useState({
    year: currentYear,
    month: 0,
    status: 'all',
    search: '',
  });
  
  const [showPayDialog, setShowPayDialog] = useState(false);
  const [selectedSettlement, setSelectedSettlement] = useState<Settlement | null>(null);
  const [processing, setProcessing] = useState(false);

  const [summary, setSummary] = useState({
    totalEligible: 0,
    totalPaid: 0,
    pendingCount: 0,
    eligibleCount: 0,
  });

  useEffect(() => {
    fetchSettlements();
  }, [pagination.page, filters]);

  async function fetchSettlements() {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        pageSize: pagination.pageSize.toString(),
        year: filters.year.toString(),
      });
      
      if (filters.month > 0) params.append('month', filters.month.toString());
      if (filters.status && filters.status !== 'all') params.append('status', filters.status);
      if (filters.search) params.append('search', filters.search);

      const response = await fetch(`/api/repasse/admin?${params}`);
      const data = await response.json();

      if (data.error) {
        toast.error(data.error);
        return;
      }

      setSettlements(data.settlements || []);
      setPagination(prev => ({
        ...prev,
        total: data.pagination?.total || 0,
        totalPages: data.pagination?.totalPages || 0,
      }));
      setSummary(data.summary || { totalEligible: 0, totalPaid: 0, pendingCount: 0, eligibleCount: 0 });
    } catch {
      toast.error('Erro ao carregar repasses');
    } finally {
      setLoading(false);
    }
  }

  async function handleMarkAsPaid() {
    if (!selectedSettlement) return;
    
    setProcessing(true);
    try {
      const response = await fetch('/api/repasse/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'mark_paid',
          settlementId: selectedSettlement.id,
        }),
      });

      const data = await response.json();

      if (data.error) {
        toast.error(data.error);
        return;
      }

      toast.success('Repasse marcado como pago');
      setShowPayDialog(false);
      setSelectedSettlement(null);
      fetchSettlements();
    } catch {
      toast.error('Erro ao processar pagamento');
    } finally {
      setProcessing(false);
    }
  }

  async function handleValidateInvoice(settlement: Settlement) {
    if (!settlement.invoice_id) {
      toast.error('Nenhuma nota fiscal vinculada');
      return;
    }

    setProcessing(true);
    try {
      const response = await fetch('/api/repasse/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoiceId: settlement.invoice_id }),
      });

      const data = await response.json();

      if (data.error) {
        toast.error(data.error);
        return;
      }

      if (data.valid) {
        toast.success('Nota fiscal validada com sucesso');
      } else {
        toast.error(`Validação falhou: ${data.message}`);
      }
      
      fetchSettlements();
    } catch {
      toast.error('Erro ao validar nota fiscal');
    } finally {
      setProcessing(false);
    }
  }

  function formatCurrency(value: number) {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  }

  function getStatusBadge(status: string) {
    const config = STATUS_CONFIG[status] || { label: status, variant: 'inactive', icon: Clock };
    const Icon = config.icon;
    return (
      <Badge variant={config.variant as any} className="flex items-center gap-1">
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <BaseHeader 
        breadcrumbItems={[
          { title: 'Admin', url: '/admin' },
          { title: 'Repasses' }
        ]}
        showBackButton={true}
        backHref="/admin"
      />
      <BaseBody
        title="Gestão de Repasses"
        subtitle="Gerencie pagamentos e notas fiscais dos usuários"
        actions={
          <Button onClick={fetchSettlements} variant="outline" className="border-[#2a2a2a]">
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        }
      >
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-yellow-500/20">
                    <Clock className="w-5 h-5 text-yellow-500" />
                  </div>
                  <div>
                    <p className="text-sm text-[#808080]">Pendentes</p>
                    <p className="text-xl font-bold text-white">{summary.pendingCount}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-500/20">
                    <CheckCircle className="w-5 h-5 text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-sm text-[#808080]">Elegíveis</p>
                    <p className="text-xl font-bold text-white">{summary.eligibleCount}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-500/20">
                    <DollarSign className="w-5 h-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-sm text-[#808080]">Total Elegível</p>
                    <p className="text-xl font-bold text-white">{formatCurrency(summary.totalEligible)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-600/20">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-[#808080]">Total Pago</p>
                    <p className="text-xl font-bold text-white">{formatCurrency(summary.totalPaid)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl">
            <CardHeader className="border-b border-[#2a2a2a]">
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-[#808080]" />
                  <span className="text-sm text-[#808080]">Filtros:</span>
                </div>
                
                <div className="flex flex-wrap gap-3">
                  <Select
                    value={filters.year.toString()}
                    onValueChange={(v) => setFilters(f => ({ ...f, year: parseInt(v) }))}
                  >
                    <SelectTrigger className="w-[120px] bg-[#0a0a0a] border-[#2a2a2a]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[currentYear, currentYear - 1, currentYear - 2].map(y => (
                        <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Select
                    value={filters.month.toString()}
                    onValueChange={(v) => setFilters(f => ({ ...f, month: parseInt(v) }))}
                  >
                    <SelectTrigger className="w-[140px] bg-[#0a0a0a] border-[#2a2a2a]">
                      <SelectValue placeholder="Todos os meses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Todos os meses</SelectItem>
                      {MONTHS.map((m, i) => (
                        <SelectItem key={i} value={(i + 1).toString()}>{m}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Select
                    value={filters.status}
                    onValueChange={(v) => setFilters(f => ({ ...f, status: v }))}
                  >
                    <SelectTrigger className="w-[160px] bg-[#0a0a0a] border-[#2a2a2a]">
                      <SelectValue placeholder="Todos os status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os status</SelectItem>
                      {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                        <SelectItem key={key} value={key}>{config.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#808080]" />
                    <Input
                      placeholder="Buscar usuário..."
                      value={filters.search}
                      onChange={(e) => setFilters(f => ({ ...f, search: e.target.value }))}
                      className="pl-9 w-[200px] bg-[#0a0a0a] border-[#2a2a2a]"
                    />
                  </div>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-[#1f1f1f] border-b border-[#2a2a2a] hover:bg-[#1f1f1f]">
                      <TableHead className="text-white">Usuário</TableHead>
                      <TableHead className="text-white">ISO</TableHead>
                      <TableHead className="text-white">Período</TableHead>
                      <TableHead className="text-white text-right">Comissão</TableHead>
                      <TableHead className="text-white text-center">Status</TableHead>
                      <TableHead className="text-white text-center">NF</TableHead>
                      <TableHead className="text-white text-center">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-[#808080]">
                          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                          Carregando...
                        </TableCell>
                      </TableRow>
                    ) : settlements.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-[#808080]">
                          Nenhum repasse encontrado
                        </TableCell>
                      </TableRow>
                    ) : (
                      settlements.map((settlement) => (
                        <TableRow key={settlement.id} className="border-b border-[#2a2a2a] hover:bg-[#1f1f1f]">
                          <TableCell>
                            <div>
                              <p className="font-medium text-white">{settlement.user_name}</p>
                              <p className="text-xs text-[#808080]">{settlement.user_email}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">
                              {settlement.customer_name}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 text-[#b0b0b0]">
                              <Calendar className="w-3 h-3" />
                              {MONTHS[settlement.month - 1]} {settlement.year}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <p className="font-semibold text-emerald-400">
                              {formatCurrency(settlement.commission_amount)}
                            </p>
                            <p className="text-xs text-[#808080]">
                              {settlement.commission_percentage.toFixed(2)}%
                            </p>
                          </TableCell>
                          <TableCell className="text-center">
                            {getStatusBadge(settlement.status)}
                          </TableCell>
                          <TableCell className="text-center">
                            {settlement.invoice_file_url ? (
                              <div className="flex items-center justify-center gap-2">
                                <a 
                                  href={settlement.invoice_file_url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="p-1 hover:bg-[#2a2a2a] rounded"
                                >
                                  <Eye className="w-4 h-4 text-blue-400" />
                                </a>
                                <Badge 
                                  variant={
                                    settlement.invoice_validation_status === 'valid' 
                                      ? 'success' 
                                      : settlement.invoice_validation_status === 'invalid'
                                      ? 'destructive'
                                      : 'warning'
                                  }
                                  className="text-xs"
                                >
                                  {settlement.invoice_validation_status === 'valid' ? 'Válida' :
                                   settlement.invoice_validation_status === 'invalid' ? 'Inválida' : 'Pendente'}
                                </Badge>
                              </div>
                            ) : (
                              <span className="text-[#808080] text-xs">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-2">
                              {settlement.status === 'validating' && settlement.invoice_id && (
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  className="text-xs border-blue-500 text-blue-400 hover:bg-blue-500/20"
                                  onClick={() => handleValidateInvoice(settlement)}
                                  disabled={processing}
                                >
                                  Validar NF
                                </Button>
                              )}
                              {settlement.status === 'eligible' && (
                                <Button 
                                  size="sm"
                                  className="text-xs bg-emerald-600 hover:bg-emerald-700"
                                  onClick={() => {
                                    setSelectedSettlement(settlement);
                                    setShowPayDialog(true);
                                  }}
                                >
                                  <DollarSign className="w-3 h-3 mr-1" />
                                  Pagar
                                </Button>
                              )}
                              {settlement.status === 'paid' && settlement.paid_at && (
                                <span className="text-xs text-[#808080]">
                                  {new Date(settlement.paid_at).toLocaleDateString('pt-BR')}
                                </span>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
              
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between p-4 border-t border-[#2a2a2a]">
                  <p className="text-sm text-[#808080]">
                    Mostrando {((pagination.page - 1) * pagination.pageSize) + 1} a{' '}
                    {Math.min(pagination.page * pagination.pageSize, pagination.total)} de {pagination.total}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-[#2a2a2a]"
                      onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
                      disabled={pagination.page === 1}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <span className="text-sm text-[#808080]">
                      Página {pagination.page} de {pagination.totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-[#2a2a2a]"
                      onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
                      disabled={pagination.page >= pagination.totalPages}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </BaseBody>

      <Dialog open={showPayDialog} onOpenChange={setShowPayDialog}>
        <DialogContent className="bg-[#1a1a1a] border-[#2a2a2a] text-white">
          <DialogHeader>
            <DialogTitle>Confirmar Pagamento</DialogTitle>
            <DialogDescription className="text-[#808080]">
              Confirme que o pagamento foi realizado para este repasse.
            </DialogDescription>
          </DialogHeader>
          
          {selectedSettlement && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-[#808080]">Usuário</p>
                  <p className="font-medium">{selectedSettlement.user_name}</p>
                </div>
                <div>
                  <p className="text-sm text-[#808080]">ISO</p>
                  <p className="font-medium">{selectedSettlement.customer_name}</p>
                </div>
                <div>
                  <p className="text-sm text-[#808080]">Período</p>
                  <p className="font-medium">{MONTHS[selectedSettlement.month - 1]} {selectedSettlement.year}</p>
                </div>
                <div>
                  <p className="text-sm text-[#808080]">Valor</p>
                  <p className="font-medium text-emerald-400">{formatCurrency(selectedSettlement.commission_amount)}</p>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" className="border-[#2a2a2a]" onClick={() => setShowPayDialog(false)}>
              Cancelar
            </Button>
            <Button 
              className="bg-emerald-600 hover:bg-emerald-700"
              onClick={handleMarkAsPaid}
              disabled={processing}
            >
              {processing ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle className="w-4 h-4 mr-2" />
              )}
              Confirmar Pagamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
