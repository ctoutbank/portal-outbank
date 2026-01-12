'use client';

import { useState } from 'react';
import { CostTemplate, MarginConfig } from '@/types/margins';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Save, Info } from 'lucide-react';
import { getMarginsByCustomer, updateMarginConfig } from './actions';
import { toast } from 'sonner';

interface MargensPageProps {
  customers: Array<{ id: number; name: string; slug: string }>;
  costTemplates: CostTemplate[];
  userRole: 'super_admin' | 'executivo' | 'core' | null;
  mccs: Array<{ id: number; code: string; description: string }>;
  fornecedores: Array<{ id: string; nome: string }>;
}

export function MargensPage({ customers, userRole }: MargensPageProps) {
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [marginConfig, setMarginConfig] = useState<MarginConfig | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editValues, setEditValues] = useState({
    marginOutbank: '',
    marginExecutivo: '',
    marginCore: ''
  });

  const isSuperAdmin = userRole === 'super_admin';
  const isExecutivo = userRole === 'executivo';
  const isCore = userRole === 'core';

  const loadMargins = async (customerId: string) => {
    if (!customerId) return;
    setLoading(true);
    try {
      const data = await getMarginsByCustomer(parseInt(customerId));
      setMarginConfig(data);
      setEditValues({
        marginOutbank: data.marginOutbank?.toString() || '0',
        marginExecutivo: data.marginExecutivo?.toString() || '0',
        marginCore: data.marginCore?.toString() || '0'
      });
    } catch (error) {
      console.error('Erro ao carregar margens:', error);
      toast.error('Erro ao carregar margens');
    } finally {
      setLoading(false);
    }
  };

  const handleCustomerChange = (value: string) => {
    setSelectedCustomerId(value);
    loadMargins(value);
  };

  const handleSave = async () => {
    if (!selectedCustomerId) return;
    setSaving(true);
    try {
      const data: { marginOutbank?: number; marginExecutivo?: number; marginCore?: number } = {};
      
      if (isSuperAdmin) {
        data.marginOutbank = parseFloat(editValues.marginOutbank) || 0;
        data.marginExecutivo = parseFloat(editValues.marginExecutivo) || 0;
        data.marginCore = parseFloat(editValues.marginCore) || 0;
      } else if (isCore) {
        data.marginCore = parseFloat(editValues.marginCore) || 0;
      }
      
      const updated = await updateMarginConfig(parseInt(selectedCustomerId), data);
      setMarginConfig(updated);
      toast.success('Margens salvas com sucesso');
    } catch (error: any) {
      console.error('Erro ao salvar margens:', error);
      toast.error(error.message || 'Erro ao salvar margens');
    } finally {
      setSaving(false);
    }
  };

  const totalMargin = 
    (parseFloat(editValues.marginOutbank) || 0) + 
    (parseFloat(editValues.marginExecutivo) || 0) + 
    (parseFloat(editValues.marginCore) || 0);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Margens do Portal</h1>
          <p className="text-muted-foreground">
            {isSuperAdmin && 'Super Admin - Acesso total a todas as margens'}
            {isExecutivo && 'Executivo - Visualização da sua margem'}
            {isCore && 'CORE - Edição da sua margem'}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Selecione o ISO</CardTitle>
          <CardDescription>
            Escolha um ISO para visualizar e editar as margens do Portal
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedCustomerId} onValueChange={handleCustomerChange}>
            <SelectTrigger className="w-full max-w-md">
              <SelectValue placeholder="Selecione um ISO" />
            </SelectTrigger>
            <SelectContent>
              {customers.map((customer) => (
                <SelectItem key={customer.id} value={customer.id.toString()}>
                  {customer.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {loading && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Carregando margens...
          </CardContent>
        </Card>
      )}

      {!loading && selectedCustomerId && marginConfig && (
        <Card>
          <CardHeader>
            <CardTitle>Margens do Portal</CardTitle>
            <CardDescription>
              Estas margens são aplicadas sobre o custo do fornecedor para formar o custo_base do ISO.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="marginOutbank">Margem Outbank (%)</Label>
                <Input
                  id="marginOutbank"
                  type="number"
                  step="0.01"
                  value={editValues.marginOutbank}
                  onChange={(e) => setEditValues({ ...editValues, marginOutbank: e.target.value })}
                  disabled={!isSuperAdmin}
                  placeholder="0.00"
                />
                <p className="text-xs text-muted-foreground">Margem da Outbank sobre o custo</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="marginExecutivo">Margem Executivo (%)</Label>
                <Input
                  id="marginExecutivo"
                  type="number"
                  step="0.01"
                  value={editValues.marginExecutivo}
                  onChange={(e) => setEditValues({ ...editValues, marginExecutivo: e.target.value })}
                  disabled={!isSuperAdmin}
                  placeholder="0.00"
                />
                <p className="text-xs text-muted-foreground">Margem do Executivo sobre o custo</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="marginCore">Margem CORE (%)</Label>
                <Input
                  id="marginCore"
                  type="number"
                  step="0.01"
                  value={editValues.marginCore}
                  onChange={(e) => setEditValues({ ...editValues, marginCore: e.target.value })}
                  disabled={isExecutivo}
                  placeholder="0.00"
                />
                <p className="text-xs text-muted-foreground">Margem do CORE sobre o custo</p>
              </div>
            </div>

            <div className="p-4 bg-muted rounded-lg flex items-center gap-3">
              <Info className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Total de Margens do Portal: {totalMargin.toFixed(2)}%</p>
                <p className="text-sm text-muted-foreground">
                  Este valor será somado ao custo do fornecedor para formar o custo_base do ISO.
                </p>
              </div>
            </div>

            {(isSuperAdmin || isCore) && (
              <div className="flex justify-end">
                <Button onClick={handleSave} disabled={saving}>
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? 'Salvando...' : 'Salvar Margens'}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {!loading && selectedCustomerId && !marginConfig && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Nenhuma configuração de margem encontrada para este ISO.
            {isSuperAdmin && ' Clique em Salvar para criar uma nova configuração.'}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
