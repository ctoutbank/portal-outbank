'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Save, Loader2, Info } from 'lucide-react';
import { toast } from 'sonner';
import { SolicitationFeeProductTypeList } from '@/lib/lookuptables/lookuptables';
import { brandList } from '@/lib/lookuptables/lookuptables-transactions';

interface MdrTableData {
  linkId: string;
  fornecedorNome: string;
  mcc: string;
  categoryName: string;
  bandeiras: string;
  marginOutbank: string;
  marginExecutivo: string;
  marginCore: string;
  debitoPos: string;
  creditoPos: string;
  credito2xPos: string;
  credito7xPos: string;
  voucherPos: string;
  prePos: string;
  custoPixPos: string;
  debitoOnline: string;
  creditoOnline: string;
  credito2xOnline: string;
  credito7xOnline: string;
  voucherOnline: string;
  preOnline: string;
  custoPixOnline: string;
  isoMargins: Array<{
    bandeira: string;
    modalidade: string;
    marginIso: string;
  }>;
}

interface IsoMdrFormProps {
  customerId: number;
  tableData: MdrTableData;
  onSave?: () => void;
  readOnly?: boolean;
}

export default function IsoMdrForm({
  customerId,
  tableData,
  onSave,
  readOnly = false
}: IsoMdrFormProps) {
  const [loading, setLoading] = useState(false);
  const [marginChanges, setMarginChanges] = useState<Record<string, Record<string, string>>>({});

  const sanitizeNumericInput = (value: string): string => {
    let cleaned = value.replace(/[^0-9.,]/g, '');
    cleaned = cleaned.replace(/,/g, '.');
    const parts = cleaned.split('.');
    if (parts.length > 2) {
      cleaned = parts[0] + '.' + parts.slice(1).join('');
    }
    return cleaned;
  };

  const modalidadeMap: Record<string, string> = {
    'DEBIT': 'debito',
    'CREDIT': 'credito',
    'CREDIT_INSTALLMENTS_2_TO_6': 'credito2x',
    'CREDIT_INSTALLMENTS_7_TO_12': 'credito7x',
    'VOUCHER': 'voucher',
    'PREPAID_CREDIT': 'pre'
  };

  const getCostBase = (productType: string, channel: 'pos' | 'online'): number => {
    const modalidade = modalidadeMap[productType];
    let mdrValue = 0;

    if (channel === 'pos') {
      switch (modalidade) {
        case 'debito': mdrValue = parseFloat(tableData.debitoPos) || 0; break;
        case 'credito': mdrValue = parseFloat(tableData.creditoPos) || 0; break;
        case 'credito2x': mdrValue = parseFloat(tableData.credito2xPos) || 0; break;
        case 'credito7x': mdrValue = parseFloat(tableData.credito7xPos) || 0; break;
        case 'voucher': mdrValue = parseFloat(tableData.voucherPos) || 0; break;
        case 'pre': mdrValue = parseFloat(tableData.prePos) || 0; break;
      }
    } else {
      switch (modalidade) {
        case 'debito': mdrValue = parseFloat(tableData.debitoOnline) || 0; break;
        case 'credito': mdrValue = parseFloat(tableData.creditoOnline) || 0; break;
        case 'credito2x': mdrValue = parseFloat(tableData.credito2xOnline) || 0; break;
        case 'credito7x': mdrValue = parseFloat(tableData.credito7xOnline) || 0; break;
        case 'voucher': mdrValue = parseFloat(tableData.voucherOnline) || 0; break;
        case 'pre': mdrValue = parseFloat(tableData.preOnline) || 0; break;
      }
    }

    const outbank = parseFloat(tableData.marginOutbank) || 0;
    const executivo = parseFloat(tableData.marginExecutivo) || 0;
    const core = parseFloat(tableData.marginCore) || 0;

    return mdrValue + outbank + executivo + core;
  };

  const getMarginKey = (bandeira: string, modalidade: string, channel: 'pos' | 'online') => 
    `${bandeira}:${modalidade}:${channel}`;

  const getMarginValue = (bandeira: string, productType: string, channel: 'pos' | 'online'): string => {
    const modalidade = modalidadeMap[productType];
    const key = getMarginKey(bandeira, modalidade, channel);
    
    if (marginChanges[tableData.linkId]?.[key] !== undefined) {
      return marginChanges[tableData.linkId][key];
    }
    
    const margin = tableData.isoMargins.find(
      m => m.bandeira === bandeira && m.modalidade === `${modalidade}_${channel}`
    );
    return margin?.marginIso || '0';
  };

  const handleMarginChange = (bandeira: string, productType: string, channel: 'pos' | 'online', value: string) => {
    const modalidade = modalidadeMap[productType];
    const key = getMarginKey(bandeira, modalidade, channel);
    const cleanValue = sanitizeNumericInput(value);
    
    setMarginChanges(prev => ({
      ...prev,
      [tableData.linkId]: {
        ...(prev[tableData.linkId] || {}),
        [key]: cleanValue
      }
    }));
  };

  const getFinalRate = (bandeira: string, productType: string, channel: 'pos' | 'online'): number => {
    const costBase = getCostBase(productType, channel);
    const marginIso = parseFloat(getMarginValue(bandeira, productType, channel)) || 0;
    return costBase + marginIso;
  };

  const hasUnsavedChanges = useMemo(() => {
    return Object.keys(marginChanges).some(linkId => 
      Object.keys(marginChanges[linkId]).length > 0
    );
  }, [marginChanges]);

  const handleSave = async () => {
    if (!hasUnsavedChanges) {
      toast.info('Nenhuma alteração para salvar');
      return;
    }

    setLoading(true);
    try {
      const margins: Array<{ linkId: string; bandeira: string; modalidade: string; marginIso: string }> = [];
      
      for (const [linkId, changes] of Object.entries(marginChanges)) {
        for (const [key, value] of Object.entries(changes)) {
          const [bandeira, modalidade, channel] = key.split(':');
          margins.push({ 
            linkId, 
            bandeira, 
            modalidade: `${modalidade}_${channel}`, 
            marginIso: value 
          });
        }
      }

      const response = await fetch(`/api/margens/iso/${customerId}/margins`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ margins })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erro ao salvar margens');
      }

      toast.success('Margens ISO salvas com sucesso!');
      setMarginChanges({});
      onSave?.();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro ao salvar margens ISO';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const renderTaxaCell = (
    brand: typeof brandList[number],
    productType: typeof SolicitationFeeProductTypeList[number],
    channel: 'pos' | 'online'
  ) => {
    const costBase = getCostBase(productType.value, channel);
    const marginIso = getMarginValue(brand.value, productType.value, channel);
    const finalRate = getFinalRate(brand.value, productType.value, channel);

    return (
      <TableCell
        key={`${channel}-${brand.value}-${productType.value}`}
        className="text-center bg-[#121212] border-l border-[#1f1f1f] p-1"
      >
        <div className="flex items-center gap-1 justify-center">
          <div className="flex flex-col items-center min-w-[50px]">
            <span className="text-[10px] text-[#606060]">Custo</span>
            <span className="text-xs text-[#808080]">{costBase.toFixed(2)}%</span>
          </div>
          <span className="text-[#333]">+</span>
          <div className="flex flex-col items-center min-w-[50px]">
            <span className="text-[10px] text-[#606060]">Margem</span>
            {readOnly ? (
              <span className="text-xs text-[#ff9800]">{marginIso}%</span>
            ) : (
              <div className="relative">
                <input
                  type="text"
                  value={marginIso}
                  onChange={(e) => handleMarginChange(brand.value, productType.value, channel, e.target.value)}
                  placeholder="0.00"
                  className="w-12 text-center border border-[#2a2a2a] rounded bg-[#1a1a1a] placeholder:text-[#555] focus-visible:outline-none text-xs px-1 py-1 text-[#ff9800]"
                />
              </div>
            )}
          </div>
          <span className="text-[#333]">=</span>
          <div className="flex flex-col items-center min-w-[50px]">
            <span className="text-[10px] text-[#606060]">Final</span>
            <span className="text-xs text-[#478EF7] font-medium">{finalRate.toFixed(2)}%</span>
          </div>
        </div>
      </TableCell>
    );
  };

  return (
    <div className="w-full max-w-[1600px] mx-auto overflow-x-hidden bg-[#0a0a0a]">
      <Card className="w-full bg-[#0a0a0a] border border-[#1a1a1a] rounded-[12px]">
        <CardContent className="p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-semibold text-white">{tableData.fornecedorNome}</h2>
              <Badge variant="outline" className="text-xs">
                MCC: {tableData.mcc}
              </Badge>
              <Badge variant="success" className="text-xs">
                Aprovada
              </Badge>
            </div>
            {!readOnly && hasUnsavedChanges && (
              <Button
                onClick={handleSave}
                disabled={loading}
                className="bg-[#ff9800] hover:bg-[#ffb74d] text-black"
              >
                {loading ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Salvando...</>
                ) : (
                  <><Save className="h-4 w-4 mr-2" /> Salvar Margens</>
                )}
              </Button>
            )}
          </div>

          <div className="mb-4 p-3 bg-[#1a1a1a] rounded-lg border border-[#2a2a2a] flex items-start gap-2">
            <Info className="h-4 w-4 text-[#478EF7] mt-0.5 flex-shrink-0" />
            <div className="text-xs text-[#808080]">
              <p><strong className="text-white">Custo Base:</strong> Valor consolidado definido pelo Portal</p>
              <p className="mt-1"><strong className="text-white">Taxa Final:</strong> Custo Base + Sua Margem ISO</p>
            </div>
          </div>

          <div className="space-y-10">
            <div className="w-full overflow-x-auto">
              <div className="min-w-0">
                <h3 className="text-xl font-semibold mb-6 text-[#FFFFFF] border-b border-[#1f1f1f] pb-4">
                  Margens ISO - Transações POS
                </h3>
                <div className="overflow-x-auto mb-4">
                  <Table className="w-full min-w-[1200px] border-collapse border-spacing-0">
                    <TableHeader>
                      <TableRow className="h-[52px]">
                        <TableHead className="sticky left-0 z-10 bg-[#0a0a0a] text-sm font-medium text-[#FFFFFF] p-4 text-left border-b border-[#2a2a2a] min-w-[100px]">
                          Bandeiras
                        </TableHead>
                        {SolicitationFeeProductTypeList.map((productType) => (
                          <TableHead
                            key={`pos-header-${productType.value}`}
                            className="text-center min-w-[180px] text-sm font-medium text-[#FFFFFF] bg-transparent p-4 border-b border-[#2a2a2a] border-l border-[#2a2a2a]"
                          >
                            {productType.label}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {brandList.map((brand) => (
                        <TableRow 
                          key={`pos-${brand.value}`} 
                          className="border-b border-[#1f1f1f]"
                        >
                          <TableCell className="font-medium sticky left-0 z-10 bg-[#0a0a0a] text-[#FFFFFF] px-4 py-3 text-left border-r border-[#1f1f1f]">
                            <span className="font-medium text-[#FFFFFF]">{brand.label}</span>
                          </TableCell>
                          {SolicitationFeeProductTypeList.map((productType) => 
                            renderTaxaCell(brand, productType, 'pos')
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <h4 className="text-lg font-medium text-white mb-4">PIX POS</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-[#0f0f0f] rounded-[8px] p-6 border border-[#1a1a1a]">
                <div className="flex flex-col">
                  <label className="text-[13px] mb-2 font-normal text-[#5C5C5C]">Custo Base (R$)</label>
                  <div className="h-[48px] px-4 flex items-center text-sm border border-[#2a2a2a] rounded-[6px] bg-[#1a1a1a] text-[#808080]">
                    R$ {tableData.custoPixPos || '0.00'}
                  </div>
                </div>
                <div className="flex flex-col">
                  <label className="text-[13px] mb-2 font-normal text-[#ff9800]">Sua Margem (R$)</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={marginChanges[tableData.linkId]?.['pix:pos'] || '0'}
                      onChange={(e) => {
                        const cleanValue = sanitizeNumericInput(e.target.value);
                        setMarginChanges(prev => ({
                          ...prev,
                          [tableData.linkId]: {
                            ...(prev[tableData.linkId] || {}),
                            ['pix:pos']: cleanValue
                          }
                        }));
                      }}
                      placeholder="0.00"
                      disabled={readOnly}
                      className="w-full h-[48px] px-4 pr-10 text-sm border border-[#2a2a2a] rounded-[6px] bg-[#1a1a1a] placeholder:text-[#555] focus:border-[#ff9800] focus:outline-none text-[#ff9800] disabled:opacity-50"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#555] text-sm pointer-events-none">R$</span>
                  </div>
                </div>
                <div className="flex flex-col">
                  <label className="text-[13px] mb-2 font-normal text-[#478EF7]">Taxa Final (R$)</label>
                  <div className="h-[48px] px-4 flex items-center text-sm border border-[#2a2a2a] rounded-[6px] bg-[#1a1a1a] text-[#478EF7] font-medium">
                    R$ {(parseFloat(tableData.custoPixPos || '0') + parseFloat(marginChanges[tableData.linkId]?.['pix:pos'] || '0')).toFixed(2)}
                  </div>
                </div>
              </div>
            </div>

            <div className="w-full overflow-x-auto mt-10">
              <div className="min-w-0">
                <h3 className="text-xl font-semibold mb-6 text-[#FFFFFF] border-b border-[#1f1f1f] pb-4">
                  Margens ISO - Transações Online
                </h3>
                <div className="overflow-x-auto mb-4">
                  <Table className="w-full min-w-[1200px] border-collapse border-spacing-0">
                    <TableHeader>
                      <TableRow className="h-[52px]">
                        <TableHead className="sticky left-0 z-10 bg-[#0a0a0a] text-sm font-medium text-[#FFFFFF] p-4 text-left border-b border-[#2a2a2a] min-w-[100px]">
                          Bandeiras
                        </TableHead>
                        {SolicitationFeeProductTypeList.map((productType) => (
                          <TableHead
                            key={`online-header-${productType.value}`}
                            className="text-center min-w-[180px] text-sm font-medium text-[#FFFFFF] bg-transparent p-4 border-b border-[#2a2a2a] border-l border-[#2a2a2a]"
                          >
                            {productType.label}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {brandList.map((brand) => (
                        <TableRow 
                          key={`online-${brand.value}`} 
                          className="border-b border-[#1f1f1f]"
                        >
                          <TableCell className="font-medium sticky left-0 z-10 bg-[#0a0a0a] text-[#FFFFFF] px-4 py-3 text-left border-r border-[#1f1f1f]">
                            <span className="font-medium text-[#FFFFFF]">{brand.label}</span>
                          </TableCell>
                          {SolicitationFeeProductTypeList.map((productType) => 
                            renderTaxaCell(brand, productType, 'online')
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <h4 className="text-lg font-medium text-white mb-4">PIX Online</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-[#0f0f0f] rounded-[8px] p-6 border border-[#1a1a1a]">
                <div className="flex flex-col">
                  <label className="text-[13px] mb-2 font-normal text-[#5C5C5C]">Custo Base (R$)</label>
                  <div className="h-[48px] px-4 flex items-center text-sm border border-[#2a2a2a] rounded-[6px] bg-[#1a1a1a] text-[#808080]">
                    R$ {tableData.custoPixOnline || '0.00'}
                  </div>
                </div>
                <div className="flex flex-col">
                  <label className="text-[13px] mb-2 font-normal text-[#ff9800]">Sua Margem (R$)</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={marginChanges[tableData.linkId]?.['pix:online'] || '0'}
                      onChange={(e) => {
                        const cleanValue = sanitizeNumericInput(e.target.value);
                        setMarginChanges(prev => ({
                          ...prev,
                          [tableData.linkId]: {
                            ...(prev[tableData.linkId] || {}),
                            ['pix:online']: cleanValue
                          }
                        }));
                      }}
                      placeholder="0.00"
                      disabled={readOnly}
                      className="w-full h-[48px] px-4 pr-10 text-sm border border-[#2a2a2a] rounded-[6px] bg-[#1a1a1a] placeholder:text-[#555] focus:border-[#ff9800] focus:outline-none text-[#ff9800] disabled:opacity-50"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#555] text-sm pointer-events-none">R$</span>
                  </div>
                </div>
                <div className="flex flex-col">
                  <label className="text-[13px] mb-2 font-normal text-[#478EF7]">Taxa Final (R$)</label>
                  <div className="h-[48px] px-4 flex items-center text-sm border border-[#2a2a2a] rounded-[6px] bg-[#1a1a1a] text-[#478EF7] font-medium">
                    R$ {(parseFloat(tableData.custoPixOnline || '0') + parseFloat(marginChanges[tableData.linkId]?.['pix:online'] || '0')).toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {!readOnly && hasUnsavedChanges && (
        <div className="flex justify-end mt-8">
          <Button
            onClick={handleSave}
            disabled={loading}
            className="h-[48px] px-8 text-sm font-medium bg-[#ff9800] text-black rounded-[8px] hover:bg-[#ffb74d] transition-colors"
          >
            {loading ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Salvando...</>
            ) : (
              <><Save className="h-4 w-4 mr-2" /> Salvar Margens ISO</>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
