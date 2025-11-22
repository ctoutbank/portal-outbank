'use client';
import { FornecedorMDRForm } from "@/types/fornecedor";
import { X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Card, CardContent } from "../ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";

// Tipos locais para corrigir erros de tipagem sem alterar lógica
const BANDEIRAS = ["Visa", "Mastercard", "Elo", "Amex", "Hipercard"] as const;
type Bandeira = (typeof BANDEIRAS)[number];

type TaxaFields = {
  debito: string;
  credito: string;
  credito2x: string;
  credito7x: string;
  voucher: string;
};

type TaxasPorBandeira = Record<Bandeira, TaxaFields>;

interface MdrFormState {
  mcc: string[];
  taxasPos: TaxasPorBandeira;
  taxasOnline: TaxasPorBandeira;
  prepos: string;
  mdrpos: string;
  cminpos: string;
  cmaxpos: string;
  antecipacao: string;
  preonline: string;
  mdronline: string;
  cminonline: string;
  cmaxonline: string;
  antecipacaoonline: string;
}

interface MdrProps {
  onSubmit: (data: FornecedorMDRForm) => Promise<void>;
  isOpen: boolean;
  mdrData?: Partial<FornecedorMDRForm>;
  categories?: Array<{ id: string; label: string }>;
  onCancel: () => void;
  isEditing: boolean;
}

export default function MdrForm({
  mdrData,
  onSubmit,
  isEditing = false,
  onCancel,
  categories: categoriesProp,
}: MdrProps) {

  const [loading, setLoading] = useState(false);

  
  const [mdrForm, setMdrForm] = useState<MdrFormState>({
    mcc: mdrData?.mcc || [],
    
    // Taxas POS por bandeira
    taxasPos: {
      Visa: { debito: "", credito: "", credito2x: "", credito7x: "", voucher: "" },
      Mastercard: { debito: "", credito: "", credito2x: "", credito7x: "", voucher: "" },
      Elo: { debito: "", credito: "", credito2x: "", credito7x: "", voucher: "" },
      Amex: { debito: "", credito: "", credito2x: "", credito7x: "", voucher: "" },
      Hipercard: { debito: "", credito: "", credito2x: "", credito7x: "", voucher: "" },
    },
    
    // Taxas Online por bandeira
    taxasOnline: {
      Visa: { debito: "", credito: "", credito2x: "", credito7x: "", voucher: "" },
      Mastercard: { debito: "", credito: "", credito2x: "", credito7x: "", voucher: "" },
      Elo: { debito: "", credito: "", credito2x: "", credito7x: "", voucher: "" },
      Amex: { debito: "", credito: "", credito2x: "", credito7x: "", voucher: "" },
      Hipercard: { debito: "", credito: "", credito2x: "", credito7x: "", voucher: "" },
    },
    
    // Outras taxas
    prepos: mdrData?.prepos || "",
    mdrpos: mdrData?.mdrpos || "",
    cminpos: mdrData?.cminpos || "",
    cmaxpos: mdrData?.cmaxpos || "",
    antecipacao: mdrData?.antecipacao || "",
    preonline: mdrData?.preonline || "",
    mdronline: mdrData?.mdronline || "",
    cminonline: mdrData?.cminonline || "",
    cmaxonline: mdrData?.cmaxonline || "",
    antecipacaoonline: mdrData?.antecipacaoonline || "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setMdrForm((prev) => {
      if (
        name === 'prepos' ||
        name === 'mdrpos' ||
        name === 'cminpos' ||
        name === 'cmaxpos' ||
        name === 'antecipacao' ||
        name === 'preonline' ||
        name === 'mdronline' ||
        name === 'cminonline' ||
        name === 'cmaxonline' ||
        name === 'antecipacaoonline'
      ) {
        return { ...prev, [name]: value } as MdrFormState;
      }
      return prev;
    });
  };

  const handleTaxaChange = (
    tipo: 'taxasPos' | 'taxasOnline',
    bandeira: Bandeira,
    campo: keyof TaxaFields,
    value: string
  ) => {
    setMdrForm(prev => ({
      ...prev,
      [tipo]: {
        ...prev[tipo],
        [bandeira]: {
          ...prev[tipo][bandeira],
          [campo]: value
        }
      }
    } as MdrFormState));
  };

  // 🔥 FUNÇÃO QUE TRANSFORMA OS DADOS POR BANDEIRA EM DADOS POR TIPO
  const transformToApiFormat = (): FornecedorMDRForm => {
    const bandeiras = BANDEIRAS.join(',');
    
    // Concatenar valores de todas as bandeiras separados por vírgula
    const debitopos = BANDEIRAS.map(b => mdrForm.taxasPos[b].debito || "0").join(',');
    const creditopos = BANDEIRAS.map(b => mdrForm.taxasPos[b].credito || "0").join(',');
    const credito2xpos = BANDEIRAS.map(b => mdrForm.taxasPos[b].credito2x || "0").join(',');
    const credito7xpos = BANDEIRAS.map(b => mdrForm.taxasPos[b].credito7x || "0").join(',');
    const voucherpos = BANDEIRAS.map(b => mdrForm.taxasPos[b].voucher || "0").join(',');
    
    const debitoonline = BANDEIRAS.map(b => mdrForm.taxasOnline[b].debito || "0").join(',');
    const creditoonline = BANDEIRAS.map(b => mdrForm.taxasOnline[b].credito || "0").join(',');
    const credito2xonline = BANDEIRAS.map(b => mdrForm.taxasOnline[b].credito2x || "0").join(',');
    const credito7xonline = BANDEIRAS.map(b => mdrForm.taxasOnline[b].credito7x || "0").join(',');
    const voucheronline = BANDEIRAS.map(b => mdrForm.taxasOnline[b].voucher || "0").join(',');

    return {
      bandeiras,
      debitopos,
      creditopos,
      credito2xpos,
      credito7xpos,
      voucherpos,
      prepos: mdrForm.prepos,
      mdrpos: mdrForm.mdrpos,
      cminpos: mdrForm.cminpos,
      cmaxpos: mdrForm.cmaxpos,
      antecipacao: mdrForm.antecipacao,
      debitoonline,
      creditoonline,
      credito2xonline,
      credito7xonline,
      voucheronline,
      preonline: mdrForm.preonline,
      mdronline: mdrForm.mdronline,
      cminonline: mdrForm.cminonline,
      cmaxonline: mdrForm.cmaxonline,
      antecipacaoonline: mdrForm.antecipacaoonline,
      mcc: mdrForm.mcc,
    };
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const payload = transformToApiFormat();
      console.log("Payload transformado:", payload);
      await onSubmit(payload);
      console.log("MDR salvo com sucesso!");
    } catch (error) {
      console.error("Erro ao submeter MDR:", error);
    } finally {
      setLoading(false);
    }
  };

  



  return (
    <div className="w-full max-w-[1600px] mx-auto p-4">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-6 w-6 bg-black rounded flex items-center justify-center text-white text-sm">
          $
        </div>
        <h1 className="text-xl font-semibold">
          {isEditing ? "Editar" : "Cadastrar"} MDR do Fornecedor
        </h1>
      </div>

      <Card className="w-full">
        <CardContent className="p-6">
          <div className="space-y-6">
            {/* Taxas POS */}
            <div className="w-full overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
              <div className="min-w-0">
                <h3 className="text-lg font-medium mb-4 text-foreground border-b border-border pb-2">
                  Taxas Transações na POS
                </h3>
                <Table className="w-full min-w-[600px] border border-border rounded-none">
                  <TableHeader>
                    <TableRow className="border-b border-border">
                      <TableHead className="sticky left-0 z-10 bg-background text-sm font-medium text-foreground border-r border-border">
                        Bandeiras
                      </TableHead>
                      <TableHead className="text-center min-w-[100px] text-sm font-medium text-foreground border-r border-border">
                        Débito
                      </TableHead>
                      <TableHead className="text-center min-w-[100px] text-sm font-medium text-foreground border-r border-border">
                        Créd. Vista
                      </TableHead>
                      <TableHead className="text-center min-w-[100px] text-sm font-medium text-foreground border-r border-border">
                        Créd. 2x
                      </TableHead>
                      <TableHead className="text-center min-w-[100px] text-sm font-medium text-foreground border-r border-border">
                        Créd. 7x
                      </TableHead>
                      <TableHead className="text-center min-w-[100px] text-sm font-medium text-foreground border-r border-border">
                        Voucher
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {BANDEIRAS.map((bandeira) => (
                      <TableRow key={bandeira} className="border-b border-border">
                        <TableCell className="font-medium sticky left-0 z-10 bg-background text-foreground border-r border-border">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-foreground">{bandeira}</span>
                          </div>
                        </TableCell>
                        <TableCell className="p-1 text-center border-r border-border">
                          <input
                            type="text"
                            value={mdrForm.taxasPos[bandeira].debito}
                            onChange={(e) => handleTaxaChange('taxasPos', bandeira, 'debito', e.target.value)}
                            placeholder="0.00"
                            className="w-full px-2 py-1 text-center border border-border rounded-none bg-muted text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-transparent text-sm"
                          />
                        </TableCell>
                        <TableCell className="p-1 text-center border-r border-border">
                          <input
                            type="text"
                            value={mdrForm.taxasPos[bandeira].credito}
                            onChange={(e) => handleTaxaChange('taxasPos', bandeira, 'credito', e.target.value)}
                            placeholder="0.00"
                            className="w-full px-2 py-1 text-center border border-border rounded-none bg-muted text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-transparent text-sm"
                          />
                        </TableCell>
                        <TableCell className="p-1 text-center border-r border-border">
                          <input
                            type="text"
                            value={mdrForm.taxasPos[bandeira].credito2x}
                            onChange={(e) => handleTaxaChange('taxasPos', bandeira, 'credito2x', e.target.value)}
                            placeholder="0.00"
                            className="w-full px-2 py-1 text-center border border-border rounded-none bg-muted text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-transparent text-sm"
                          />
                        </TableCell>
                        <TableCell className="p-1 text-center border-r border-border">
                          <input
                            type="text"
                            value={mdrForm.taxasPos[bandeira].credito7x}
                            onChange={(e) => handleTaxaChange('taxasPos', bandeira, 'credito7x', e.target.value)}
                            placeholder="0.00"
                            className="w-full px-2 py-1 text-center border border-border rounded-none bg-muted text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-transparent text-sm"
                          />
                        </TableCell>
                        <TableCell className="p-1 text-center border-r border-border">
                          <input
                            type="text"
                            value={mdrForm.taxasPos[bandeira].voucher}
                            onChange={(e) => handleTaxaChange('taxasPos', bandeira, 'voucher', e.target.value)}
                            placeholder="0.00"
                            className="w-full px-2 py-1 text-center border border-border rounded-none bg-muted text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-transparent text-sm"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Outras Taxas POS */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 bg-muted/50 p-4 rounded-none border border-border">
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Pré-Pago (%)</label>
                <input type="text" name="prepos" value={mdrForm.prepos} onChange={handleInputChange} placeholder="0.00" className="w-full px-3 py-2 text-sm border border-border rounded-none bg-background text-foreground focus-visible:ring-2 focus-visible:ring-ring" />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">MDR (%)</label>
                <input type="text" name="mdrpos" value={mdrForm.mdrpos} onChange={handleInputChange} placeholder="0.00" className="w-full px-3 py-2 text-sm border border-border rounded-none bg-background text-foreground focus-visible:ring-2 focus-visible:ring-ring" />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Custo Mín (R$)</label>
                <input type="text" name="cminpos" value={mdrForm.cminpos} onChange={handleInputChange} placeholder="0.00" className="w-full px-3 py-2 text-sm border border-border rounded-none bg-background text-foreground focus-visible:ring-2 focus-visible:ring-ring" />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Custo Máx (R$)</label>
                <input type="text" name="cmaxpos" value={mdrForm.cmaxpos} onChange={handleInputChange} placeholder="0.00" className="w-full px-3 py-2 text-sm border border-border rounded-none bg-background text-foreground focus-visible:ring-2 focus-visible:ring-ring" />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Antecipação (%)</label>
                <input type="text" name="antecipacao" value={mdrForm.antecipacao} onChange={handleInputChange} placeholder="0.00" className="w-full px-3 py-2 text-sm border border-border rounded-none bg-background text-foreground focus-visible:ring-2 focus-visible:ring-ring" />
              </div>
            </div>

            {/* Taxas Online */}
            <div className="w-full overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
              <div className="min-w-0">
                <h3 className="text-lg font-medium mb-4 text-foreground border-b border-border pb-2">
                  Taxas Transações Online
                </h3>
                <Table className="w-full min-w-[600px] border border-border rounded-none">
                  <TableHeader>
                    <TableRow className="border-b border-border">
                      <TableHead className="sticky left-0 z-10 bg-background text-sm font-medium text-foreground border-r border-border">
                        Bandeiras
                      </TableHead>
                      <TableHead className="text-center min-w-[100px] text-sm font-medium text-foreground border-r border-border">
                        Débito
                      </TableHead>
                      <TableHead className="text-center min-w-[100px] text-sm font-medium text-foreground border-r border-border">
                        Créd. Vista
                      </TableHead>
                      <TableHead className="text-center min-w-[100px] text-sm font-medium text-foreground border-r border-border">
                        Créd. 2x
                      </TableHead>
                      <TableHead className="text-center min-w-[100px] text-sm font-medium text-foreground border-r border-border">
                        Créd. 7x
                      </TableHead>
                      <TableHead className="text-center min-w-[100px] text-sm font-medium text-foreground border-r border-border">
                        Voucher
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {BANDEIRAS.map((bandeira) => (
                      <TableRow key={bandeira} className="border-b border-border">
                        <TableCell className="font-medium sticky left-0 z-10 bg-background text-foreground border-r border-border">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-foreground">{bandeira}</span>
                          </div>
                        </TableCell>
                        <TableCell className="p-1 text-center border-r border-border">
                          <input
                            type="text"
                            value={mdrForm.taxasOnline[bandeira].debito}
                            onChange={(e) => handleTaxaChange('taxasOnline', bandeira, 'debito', e.target.value)}
                            placeholder="0.00"
                            className="w-full px-2 py-1 text-center border border-border rounded-none bg-muted text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-transparent text-sm"
                          />
                        </TableCell>
                        <TableCell className="p-1 text-center border-r border-border">
                          <input
                            type="text"
                            value={mdrForm.taxasOnline[bandeira].credito}
                            onChange={(e) => handleTaxaChange('taxasOnline', bandeira, 'credito', e.target.value)}
                            placeholder="0.00"
                            className="w-full px-2 py-1 text-center border border-border rounded-none bg-muted text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-transparent text-sm"
                          />
                        </TableCell>
                        <TableCell className="p-1 text-center border-r border-border">
                          <input
                            type="text"
                            value={mdrForm.taxasOnline[bandeira].credito2x}
                            onChange={(e) => handleTaxaChange('taxasOnline', bandeira, 'credito2x', e.target.value)}
                            placeholder="0.00"
                            className="w-full px-2 py-1 text-center border border-border rounded-none bg-muted text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-transparent text-sm"
                          />
                        </TableCell>
                        <TableCell className="p-1 text-center border-r border-border">
                          <input
                            type="text"
                            value={mdrForm.taxasOnline[bandeira].credito7x}
                            onChange={(e) => handleTaxaChange('taxasOnline', bandeira, 'credito7x', e.target.value)}
                            placeholder="0.00"
                            className="w-full px-2 py-1 text-center border border-border rounded-none bg-muted text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-transparent text-sm"
                          />
                        </TableCell>
                        <TableCell className="p-1 text-center border-r border-border">
                          <input
                            type="text"
                            value={mdrForm.taxasOnline[bandeira].voucher}
                            onChange={(e) => handleTaxaChange('taxasOnline', bandeira, 'voucher', e.target.value)}
                            placeholder="0.00"
                            className="w-full px-2 py-1 text-center border border-border rounded-none bg-muted text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-transparent text-sm"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Outras Taxas Online */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 bg-muted/50 p-4 rounded-none border border-border">
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Pré-Pago (%)</label>
                <input type="text" name="preonline" value={mdrForm.preonline} onChange={handleInputChange} placeholder="0.00" className="w-full px-3 py-2 text-sm border border-border rounded-none bg-background text-foreground focus-visible:ring-2 focus-visible:ring-ring" />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">MDR (%)</label>
                <input type="text" name="mdronline" value={mdrForm.mdronline} onChange={handleInputChange} placeholder="0.00" className="w-full px-3 py-2 text-sm border border-border rounded-none bg-background text-foreground focus-visible:ring-2 focus-visible:ring-ring" />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Custo Mín (R$)</label>
                <input type="text" name="cminonline" value={mdrForm.cminonline} onChange={handleInputChange} placeholder="0.00" className="w-full px-3 py-2 text-sm border border-border rounded-none bg-background text-foreground focus-visible:ring-2 focus-visible:ring-ring" />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Custo Máx (R$)</label>
                <input type="text" name="cmaxonline" value={mdrForm.cmaxonline} onChange={handleInputChange} placeholder="0.00" className="w-full px-3 py-2 text-sm border border-border rounded-none bg-background text-foreground focus-visible:ring-2 focus-visible:ring-ring" />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Antecipação (%)</label>
                <input type="text" name="antecipacaoonline" value={mdrForm.antecipacaoonline} onChange={handleInputChange} placeholder="0.00" className="w-full px-3 py-2 text-sm border border-border rounded-none bg-background text-foreground focus-visible:ring-2 focus-visible:ring-ring" />
              </div>
            </div>
            
            {/* Buttons */}
            <div className="flex justify-end gap-3 pt-6 border-t border-border">
              <button
                type="button"
                onClick={onCancel}
                className="px-6 py-2.5 bg-muted hover:bg-muted/80 text-foreground font-medium rounded-none transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="px-6 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-none transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Salvando..." : isEditing ? "Atualizar" : "Salvar MDR"}
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
