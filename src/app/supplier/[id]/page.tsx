'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Fornecedor } from '@/types/fornecedor';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface CnaeData {
  id: number | string;
  name: string | undefined;
  cnae: string | undefined;
  mcc: string;
  codigo: string;
  nome: string;
}

export default function FornecedorDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [fornecedor, setFornecedor] = useState<Fornecedor | null>(null);
  const [categories, setCategories] = useState<CnaeData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        
        console.log('🔄 Buscando fornecedor ID:', params.id);
        
        const supplierRes = await fetch(`/api/supplier/${params.id}`);
        if (!supplierRes.ok) {
          toast.error('Fornecedor não encontrado');
          router.push('/supplier');
          return;
        }
        const supplierData = await supplierRes.json();
        console.log('📦 Dados do fornecedor:', supplierData);
        console.log('📦 MCCs do fornecedor:', supplierData.mccs);
        console.log('📦 Tipo de mccs:', typeof supplierData.mccs);
        console.log('📦 É array?:', Array.isArray(supplierData.mccs));
        setFornecedor(supplierData);

        const categoriesRes = await fetch('/api/cnaes');
        if (categoriesRes.ok) {
          const categoriesData = await categoriesRes.json();
          console.log('📚 Categories carregadas:', categoriesData);
          console.log('📚 Total de categories:', categoriesData.length);
          console.log('📚 Exemplo de category:', categoriesData[0]);
          setCategories(categoriesData);
        }
      } catch (error) {
        console.error('❌ Erro ao carregar dados:', error);
        toast.error('Erro ao carregar fornecedor');
      } finally {
        setLoading(false);
      }
    }

    if (params.id) {
      fetchData();
    }
  }, [params.id, router]);

  const getCnaes = (): CnaeData[] => {
    console.log('🔍 Iniciando getCnaes()');
    
    if (!fornecedor?.mccs || !Array.isArray(fornecedor.mccs) || fornecedor.mccs.length === 0) {
      console.log('⚠️ Nenhum MCC encontrado');
      return [];
    }
    
    console.log('🔍 Procurando MCCs:', fornecedor.mccs);
    console.log('🔍 Total de categories disponíveis:', categories.length);
    
    const result = fornecedor.mccs
      .map((mccId, index) => {
        console.log(`🔍 [${index}] Procurando MCC: "${mccId}" (tipo: ${typeof mccId})`);
        
        // ✅ COMPARAR ID COMO NÚMERO (API retorna id como número)
        const mccIdNum = Number(mccId);
        let cnae = categories.find(c => Number(c.id) === mccIdNum);
        
        console.log(`🔍 [${index}] Category encontrada:`, cnae);
        
        if (!cnae) {
          console.log(`❌ [${index}] CNAE NÃO encontrado para: ${mccId}`);
          return null;
        }
        
        console.log(`✅ [${index}] CNAE encontrado:`, cnae);
        
        return {
          id: cnae.id,
          codigo: cnae.cnae || '',
          nome: cnae.name || '',
          mcc: cnae.mcc || String(cnae.id),
          cnae: cnae.cnae,
          name: cnae.name,
        };
      })
      .filter((cnae): cnae is CnaeData => cnae !== null);
    
    console.log('✅ CNAEs processados:', result);
    console.log('✅ Total encontrado:', result.length);
    
    return result;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="ml-2">Carregando...</span>
      </div>
    );
  }

  if (!fornecedor) {
    return null;
  }

  const cnaes = getCnaes();
  console.log('📋 Renderizando tabela com', cnaes.length, 'CNAEs');

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a]">
      {/* Header */}
      <div className="bg-white dark:bg-[#171717] border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
          {fornecedor.nome}
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          CNPJ: {fornecedor.cnpj}
        </p>
      </div>

      <div className="container p-6">
        {/* Botão voltar */}
        <button
          onClick={() => router.push('/supplier')}
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 mb-6 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para lista
        </button>

        {/* Tabela de CNAEs */}
        <div className="bg-white dark:bg-[#171717] rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    CNAE ↑
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    MCC
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Nome
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Ativo
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {cnaes.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                      Nenhum CNAE associado a este fornecedor
                    </td>
                  </tr>
                ) : (
                  cnaes.map((cnae) => (
                    <tr key={cnae.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => router.push(`/supplier/${params.id}/cnae/${cnae.id}`)}
                            className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline transition"
                          >
                            {cnae.codigo || '-'}
                          </button>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {cnae.mcc || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                        {cnae.nome || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                          ATIVO
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
