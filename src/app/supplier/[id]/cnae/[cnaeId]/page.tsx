'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import MdrForm from '@/components/supplier/MdrForm';
import { FornecedorMDRForm } from '@/types/fornecedor';

interface MdrPageData {
  fornecedor: {
    id: string;
    nome: string;
    cnpj: string;
  };
  cnae: {
    id: number;
    name: string;
    cnae: string;
    mcc: string;
  };
  mdr: any | null;
}

export default function SupplierCnaeMdrPage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<MdrPageData | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const res = await fetch(`/api/supplier/${params.id}/cnae/${params.cnaeId}/mdr`);
        
        if (!res.ok) {
          toast.error('Erro ao carregar dados');
          router.push(`/supplier/${params.id}`);
          return;
        }

        const result = await res.json();
        console.log('📦 Dados carregados:', result);
        setData(result);
      } catch (error) {
        console.error('❌ Erro:', error);
        toast.error('Erro ao carregar taxas MDR');
      } finally {
        setLoading(false);
      }
    }

    if (params.id && params.cnaeId) {
      fetchData();
    }
  }, [params.id, params.cnaeId, router]);

  const handleSubmit = async (formData: FornecedorMDRForm) => {
    try {
      setSaving(true);
      console.log('📤 Enviando dados:', formData);

      const res = await fetch(`/api/supplier/${params.id}/cnae/${params.cnaeId}/mdr`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const errorData = await res.json();
        console.error('❌ Erro na resposta:', errorData);
        throw new Error(errorData.error || 'Erro ao salvar');
      }

      const result = await res.json();
      console.log('✅ Resposta do servidor:', result);

      toast.success('Taxas MDR salvas com sucesso!');
      
      // Recarregar dados para garantir persistência
      const refreshRes = await fetch(`/api/supplier/${params.id}/cnae/${params.cnaeId}/mdr`);
      
      if (refreshRes.ok) {
        const refreshedData = await refreshRes.json();
        console.log('🔄 Dados atualizados:', refreshedData);
        setData(refreshedData);
      }

    } catch (error: any) {
      console.error('❌ Erro ao salvar:', error);
      toast.error(error.message || 'Erro ao salvar taxas MDR');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="ml-2">Carregando...</span>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  // 🔥 TRANSFORMAR DADOS DO BACKEND PARA O FORMATO DO MDRFORM
  const transformMdrToForm = (mdr: any): Partial<FornecedorMDRForm> => {
    if (!mdr) {
      // Se não tem MDR, retorna valores vazios com o MCC do CNAE
      return {
        mcc: [data.cnae.mcc],
      };
    }

    return {
      bandeiras: mdr.bandeiras || '',
      debitopos: mdr.debitopos || '',
      creditopos: mdr.creditopos || '',
      credito2xpos: mdr.credito2xpos || '',
      credito7xpos: mdr.credito7xpos || '',
      voucherpos: mdr.voucherpos || '',
      prepos: mdr.prepos || '',
      mdrpos: mdr.mdrpos || '',
      cminpos: mdr.cminpos || '',
      cmaxpos: mdr.cmaxpos || '',
      antecipacao: mdr.antecipacao || '',
      debitoonline: mdr.debitoonline || '',
      creditoonline: mdr.creditoonline || '',
      credito2xonline: mdr.credito2xonline || '',
      credito7xonline: mdr.credito7xonline || '',
      voucheronline: mdr.voucheronline || '',
      preonline: mdr.preonline || '',
      mdronline: mdr.mdronline || '',
      cminonline: mdr.cminonline || '',
      cmaxonline: mdr.cmaxonline || '',
      antecipacaoonline: mdr.antecipacaoonline || '',
      mcc: mdr.mcc || [data.cnae.mcc], // Usa MCC do MDR ou do CNAE
    };
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a]">
      {/* Header */}
      <div className="bg-white dark:bg-[#171717] border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
              Taxas MDR - {data.cnae.name}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Fornecedor: {data.fornecedor.nome} | CNAE: {data.cnae.cnae} | MCC: {data.cnae.mcc}
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto p-6">
        {/* Botão voltar */}
        <button
          onClick={() => router.push(`/supplier/${params.id}`)}
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 mb-6 transition"
          disabled={saving}
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para CNAEs do Fornecedor
        </button>

        {/* Formulário MDR - SEMPRE VISÍVEL */}
        <MdrForm
          mdrData={transformMdrToForm(data.mdr)}
          onSubmit={handleSubmit}
          isEditing={!!data.mdr}
          onCancel={() => router.push(`/supplier/${params.id}`)}
          isOpen={true}
        />

        {/* Indicador de salvamento */}
        {saving && (
          <div className="fixed bottom-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Salvando...</span>
          </div>
        )}
      </div>
    </div>
  );
}
