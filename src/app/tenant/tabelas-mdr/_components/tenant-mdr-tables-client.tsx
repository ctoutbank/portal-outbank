"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Save, ChevronDown, ChevronRight } from "lucide-react";
import { toast } from "sonner";

interface TaxaCell {
  custo_base: string;
  margin_iso: string;
  taxa_final: string;
}

interface BandeiraData {
  bandeira: string;
  taxas: {
    pos: Record<string, TaxaCell>;
    online: Record<string, TaxaCell>;
  };
}

interface LinkedMdrTable {
  linkId: string;
  id: string;
  categoryName: string;
  mcc: string | null;
  cnae: string | null;
  fornecedorNome: string;
  status: string;
  bandeiras: string[];
  data: BandeiraData[];
  antecipacao: {
    pos: TaxaCell;
    online: TaxaCell;
  };
}

interface TenantMdrTablesClientProps {
  tenantName: string;
}

const MODALIDADES = [
  { key: 'debito', label: 'Débito' },
  { key: 'credito', label: 'Créd. Vista' },
  { key: 'credito2x', label: 'Créd. 2-6x' },
  { key: 'credito7x', label: 'Créd. 7-12x' },
  { key: 'pre', label: 'Pré-pago' },
  { key: 'voucher', label: 'Voucher' },
] as const;

type Channel = 'pos' | 'online';

export function TenantMdrTablesClient({ tenantName }: TenantMdrTablesClientProps) {
  const [tables, setTables] = useState<LinkedMdrTable[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [expandedTables, setExpandedTables] = useState<Set<string>>(new Set());
  const [editedMargins, setEditedMargins] = useState<Record<string, Record<string, string>>>({});
  const [activeChannel, setActiveChannel] = useState<Record<string, Channel>>({});

  useEffect(() => {
    fetchTables();
  }, []);

  const fetchTables = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/tenant/tabelas-mdr');
      if (!response.ok) throw new Error('Erro ao carregar tabelas');
      const data = await response.json();
      setTables(data.tables || []);
      
      const initialChannels: Record<string, Channel> = {};
      const initialExpanded = new Set<string>();
      (data.tables || []).forEach((t: LinkedMdrTable) => {
        initialChannels[t.linkId] = 'pos';
        if (data.tables.length === 1) {
          initialExpanded.add(t.linkId);
        }
      });
      setActiveChannel(initialChannels);
      setExpandedTables(initialExpanded);
    } catch (error) {
      console.error('Erro ao carregar tabelas:', error);
      toast.error('Erro ao carregar tabelas MDR');
    } finally {
      setLoading(false);
    }
  };

  const toggleTable = (linkId: string) => {
    setExpandedTables(prev => {
      const newSet = new Set(prev);
      if (newSet.has(linkId)) {
        newSet.delete(linkId);
      } else {
        newSet.add(linkId);
      }
      return newSet;
    });
  };

  const getMarginKey = (bandeira: string, modalidade: string, channel: Channel) => 
    `${bandeira}:${modalidade}:${channel}`;

  const handleMarginChange = (linkId: string, bandeira: string, modalidade: string, channel: Channel, value: string) => {
    const numericValue = value.replace(/[^\d.,]/g, '').replace(',', '.');
    const key = getMarginKey(bandeira, modalidade, channel);
    setEditedMargins(prev => ({
      ...prev,
      [linkId]: {
        ...prev[linkId],
        [key]: numericValue
      }
    }));
  };

  const getDisplayMargin = (table: LinkedMdrTable, bandeira: string, modalidade: string, channel: Channel): string => {
    const key = getMarginKey(bandeira, modalidade, channel);
    const edited = editedMargins[table.linkId]?.[key];
    if (edited !== undefined) return edited;
    
    const bandeiraData = table.data.find(d => d.bandeira === bandeira);
    if (!bandeiraData) return '0.000';
    
    const taxa = bandeiraData.taxas[channel]?.[modalidade];
    return taxa?.margin_iso || '0.000';
  };

  const getCustoBase = (table: LinkedMdrTable, bandeira: string, modalidade: string, channel: Channel): string => {
    const bandeiraData = table.data.find(d => d.bandeira === bandeira);
    if (!bandeiraData) return '0.00';
    
    const taxa = bandeiraData.taxas[channel]?.[modalidade];
    return taxa?.custo_base || '0.00';
  };

  const getTaxaFinal = (table: LinkedMdrTable, bandeira: string, modalidade: string, channel: Channel): string => {
    const custoBase = parseFloat(getCustoBase(table, bandeira, modalidade, channel)) || 0;
    const marginIso = parseFloat(getDisplayMargin(table, bandeira, modalidade, channel)) || 0;
    return (custoBase + marginIso).toFixed(2);
  };

  const hasChanges = (linkId: string): boolean => {
    return Object.keys(editedMargins[linkId] || {}).length > 0;
  };

  const saveMargins = async (table: LinkedMdrTable, channel: Channel) => {
    if (!hasChanges(table.linkId)) return;

    setSaving(table.linkId);
    try {
      const changes = editedMargins[table.linkId] || {};
      const margins = Object.entries(changes)
        .filter(([key]) => key.endsWith(`:${channel}`))
        .map(([key, marginIso]) => {
          const [bandeira, modalidade] = key.split(':');
          return { linkId: table.linkId, bandeira, modalidade, marginIso, channel };
        });

      if (margins.length === 0) {
        toast.info('Nenhuma alteração para salvar');
        setSaving(null);
        return;
      }

      const response = await fetch('/api/tenant/tabelas-mdr', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ margins })
      });

      if (!response.ok) throw new Error('Erro ao salvar margens');

      toast.success('Margens salvas com sucesso');
      setEditedMargins(prev => {
        const updated = { ...prev };
        if (updated[table.linkId]) {
          const newLinkMargins: Record<string, string> = {};
          for (const [key, value] of Object.entries(updated[table.linkId])) {
            if (!key.endsWith(`:${channel}`)) {
              newLinkMargins[key] = value;
            }
          }
          if (Object.keys(newLinkMargins).length === 0) {
            delete updated[table.linkId];
          } else {
            updated[table.linkId] = newLinkMargins;
          }
        }
        return updated;
      });
      fetchTables();
    } catch (error) {
      console.error('Erro ao salvar margens:', error);
      toast.error('Erro ao salvar margens');
    } finally {
      setSaving(null);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (tables.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <h3 className="text-lg font-semibold mb-2">Nenhuma tabela MDR vinculada</h3>
          <p className="text-muted-foreground">
            Entre em contato com o administrador do portal para vincular tabelas MDR ao seu ISO.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {tables.map(table => {
        const isExpanded = expandedTables.has(table.linkId);
        const channel = activeChannel[table.linkId] || 'pos';
        
        return (
          <Card key={table.linkId} className="overflow-hidden">
            <CardHeader 
              className="flex flex-row items-center justify-between space-y-0 pb-4 cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => toggleTable(table.linkId)}
            >
              <div className="flex items-center gap-3">
                {isExpanded ? (
                  <ChevronDown className="h-5 w-5 text-primary" />
                ) : (
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                )}
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Badge variant="outline" className="font-mono">{table.mcc}</Badge>
                    {table.categoryName}
                    <span className="text-muted-foreground font-normal">
                      ({table.fornecedorNome || 'Banco Prisma'} | {table.bandeiras.length} bandeiras)
                    </span>
                  </CardTitle>
                </div>
              </div>
              <Badge variant={table.status === 'validada' ? 'default' : 'secondary'}>
                {table.status === 'validada' ? 'Aprovada' : 'Pendente'}
              </Badge>
            </CardHeader>
            
            {isExpanded && (
              <CardContent className="pt-0">
                <Tabs 
                  value={channel} 
                  onValueChange={(v) => setActiveChannel(prev => ({ ...prev, [table.linkId]: v as Channel }))}
                  className="w-full"
                >
                  <div className="flex items-center justify-between mb-4">
                    <TabsList>
                      <TabsTrigger value="pos">POS</TabsTrigger>
                      <TabsTrigger value="online">Online</TabsTrigger>
                    </TabsList>
                    
                    <Button
                      size="sm"
                      onClick={(e) => { e.stopPropagation(); saveMargins(table, channel); }}
                      disabled={!hasChanges(table.linkId) || saving === table.linkId}
                    >
                      {saving === table.linkId ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Save className="h-4 w-4 mr-2" />
                      )}
                      Salvar {channel.toUpperCase()}
                    </Button>
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-4">
                    Configure sua <strong>margem</strong> para cada modalidade. A taxa final é o valor cobrado do estabelecimento.
                  </p>
                  
                  {(['pos', 'online'] as Channel[]).map(ch => (
                    <TabsContent key={ch} value={ch} className="mt-0">
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm border-collapse">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left py-3 px-2 font-medium text-muted-foreground">Bandeiras</th>
                              {MODALIDADES.map(mod => (
                                <th key={mod.key} className="text-center py-3 px-2 font-medium text-muted-foreground min-w-[140px]">
                                  {mod.label}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {table.data.map(bandeiraData => (
                              <tr key={bandeiraData.bandeira} className="border-b hover:bg-muted/30">
                                <td className="py-3 px-2 font-medium">{bandeiraData.bandeira}</td>
                                {MODALIDADES.map(mod => {
                                  const custoBase = getCustoBase(table, bandeiraData.bandeira, mod.key, ch);
                                  const marginIso = getDisplayMargin(table, bandeiraData.bandeira, mod.key, ch);
                                  const taxaFinal = getTaxaFinal(table, bandeiraData.bandeira, mod.key, ch);
                                  const hasCusto = parseFloat(custoBase) > 0;
                                  
                                  if (!hasCusto) {
                                    return (
                                      <td key={mod.key} className="py-3 px-2 text-center text-muted-foreground">
                                        -
                                      </td>
                                    );
                                  }
                                  
                                  return (
                                    <td key={mod.key} className="py-3 px-2">
                                      <div className="flex items-center justify-center gap-1 text-xs">
                                        <span className="text-muted-foreground">{custoBase}%</span>
                                        <span className="text-muted-foreground">+</span>
                                        <Input
                                          type="text"
                                          value={marginIso}
                                          onChange={(e) => handleMarginChange(table.linkId, bandeiraData.bandeira, mod.key, ch, e.target.value)}
                                          className="w-16 h-7 text-center text-xs px-1"
                                        />
                                        <span className="text-muted-foreground">%</span>
                                        <span className="text-muted-foreground">=</span>
                                        <span className="font-semibold text-primary">{taxaFinal}%</span>
                                      </div>
                                    </td>
                                  );
                                })}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 mt-6">
                        <div className="p-4 border rounded-lg">
                          <h4 className="font-medium mb-2">PIX</h4>
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-muted-foreground">Custo: {table.data[0]?.taxas[ch]?.pix?.custo_base || '0.00'}%</span>
                            <span>+</span>
                            <Input
                              type="text"
                              value={getDisplayMargin(table, table.data[0]?.bandeira || '', 'pix', ch)}
                              onChange={(e) => handleMarginChange(table.linkId, table.data[0]?.bandeira || '', 'pix', ch, e.target.value)}
                              className="w-20 h-8 text-center"
                            />
                            <span>%</span>
                            <span>=</span>
                            <span className="font-semibold text-primary">
                              {getTaxaFinal(table, table.data[0]?.bandeira || '', 'pix', ch)}%
                            </span>
                          </div>
                        </div>
                        
                        <div className="p-4 border rounded-lg">
                          <h4 className="font-medium mb-2">Antecipação</h4>
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-muted-foreground">
                              Custo: {table.antecipacao[ch]?.custo_base || '0.00'}%
                            </span>
                            <span>+</span>
                            <Input
                              type="text"
                              value={table.antecipacao[ch]?.margin_iso || '0.000'}
                              disabled
                              className="w-20 h-8 text-center bg-muted"
                            />
                            <span>%</span>
                            <span>=</span>
                            <span className="font-semibold text-primary">
                              {table.antecipacao[ch]?.taxa_final || '0.00'}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>
              </CardContent>
            )}
          </Card>
        );
      })}
    </div>
  );
}
