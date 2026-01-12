'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import MdrForm from '@/components/supplier/MdrForm';
import { FornecedorMDRForm } from '@/types/fornecedor';
import BaseHeader from '@/components/layout/base-header';
import BaseBody from '@/components/layout/base-body';

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
    suporta_pos?: boolean;
    suporta_online?: boolean;
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

  const handleSaveAndRedirect = async (formData: FornecedorMDRForm) => {
    try {
      setSaving(true);
      console.log('📤 Enviando dados (redirect):', formData);

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

      toast.success('Taxas MDR salvas com sucesso!');
      
      router.push(`/supplier/${params.id}`);

    } catch (error: any) {
      console.error('❌ Erro ao salvar:', error);
      toast.error(error.message || 'Erro ao salvar taxas MDR');
    } finally {
      setSaving(false);
    }
  };

  const handleChannelChange = async (channel: 'pos' | 'online', value: boolean) => {
    if (!data) return;
    
    const updatedData = {
      suporta_pos: channel === 'pos' ? value : (data.cnae.suporta_pos ?? true),
      suporta_online: channel === 'online' ? value : (data.cnae.suporta_online ?? true),
    };

    try {
      await fetch(`/api/supplier/${params.id}/cnae/${params.cnaeId}/channels`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData),
      });

      setData({
        ...data,
        cnae: {
          ...data.cnae,
          ...updatedData,
        },
      });
    } catch (error) {
      console.error('Erro ao atualizar canal:', error);
      toast.error('Erro ao atualizar configuração de canal');
    }
  };

  const handleClear = async () => {
    try {
      console.log('🗑️ Limpando taxas MDR...');

      const res = await fetch(`/api/supplier/${params.id}/cnae/${params.cnaeId}/mdr`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Erro ao limpar taxas');
      }

      toast.success('Taxas limpas com sucesso!');
      
      router.push(`/supplier/${params.id}`);

    } catch (error: any) {
      console.error('❌ Erro ao limpar:', error);
      toast.error(error.message || 'Erro ao limpar taxas MDR');
      throw error;
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

  const transformMdrToForm = (mdr: any): Partial<FornecedorMDRForm> => {
    if (!mdr) {
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
      mcc: mdr.mcc || [data.cnae.mcc],
      custo_pix_pos: mdr.custo_pix_pos || '',
      custo_pix_online: mdr.custo_pix_online || '',
    };
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <BaseHeader 
        breadcrumbItems={[
          { title: 'Fornecedores', url: '/supplier' },
          { title: data.fornecedor.nome, url: `/supplier/${params.id}` },
          { title: 'Taxas MDR' }
        ]}
        showBackButton={true}
        backHref={`/supplier/${params.id}`}
      />
      <BaseBody
        title={`${data.mdr ? "Editar" : "Cadastrar"} Custo Dock (MDR)`}
        subtitle={`${data.cnae.name} | CNAE: ${data.cnae.cnae} | MCC: ${data.cnae.mcc}`}
      >
        <MdrForm
          mdrData={transformMdrToForm(data.mdr)}
          onSubmit={handleSubmit}
          onSaveAndRedirect={handleSaveAndRedirect}
          isEditing={!!data.mdr}
          onCancel={() => router.push(`/supplier/${params.id}`)}
          onClear={handleClear}
          isOpen={true}
          suportaPos={data.cnae.suporta_pos ?? true}
          suportaOnline={data.cnae.suporta_online ?? true}
          onChannelChange={handleChannelChange}
        />

        {saving && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
            <div className="bg-[#171717] border border-[#2E2E2E] rounded-lg px-8 py-6 flex flex-col items-center gap-4 shadow-2xl">
              <Loader2 className="w-10 h-10 animate-spin text-[#ff9800]" />
              <span className="text-white text-lg font-medium">Salvando...</span>
              <p className="text-[#616161] text-sm">Aguarde enquanto salvamos as taxas MDR</p>
            </div>
          </div>
        )}
      </BaseBody>
    </div>
  );
}
