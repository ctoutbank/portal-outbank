'use client';
import { Fornecedor } from "@/types/fornecedor";
import { Building2, Edit, Trash2, Copy, Eye, X, Calendar, Table } from "lucide-react";
import { useState } from "react";
import { FornecedorForm } from "./FornecedorForm";


interface FornecedorCardProps {
    fornecedor: Fornecedor;
    onEdit: (fornecedor: Fornecedor) => void;
    onDelete: (id: string) => void;
    canEdit: boolean;
    canDelete: boolean;
    categories: Array<{id: string; label:string}>
}

export function FornecedorCard({ fornecedor, onEdit, onDelete, canEdit, canDelete, categories }: FornecedorCardProps) {
    const [showEditModal, setShowEditModal] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);
    const [copied, setCopied] = useState(false);

    // Contabiliza a quantidade de MCCs
    const mccCount = Array.isArray(fornecedor.mccs) ? fornecedor.mccs.length : 0;

    // Função para copiar dados
    const handleCopy = () => {
        const dados = `
            Nome: ${fornecedor.nome}
            CNPJ: ${fornecedor.cnpj}
            Email: ${fornecedor.email}
            Telefone: ${fornecedor.telefone}
            Endereço: ${fornecedor.endereco || 'N/A'}
            Cidade: ${fornecedor.cidade || 'N/A'}
            Estado: ${fornecedor.estado || 'N/A'}
            CEP: ${fornecedor.cep || 'N/A'}
            Contato Principal: ${fornecedor.contato_principal || 'N/A'}
            CNAEs: ${mccCount}
            Status: ${fornecedor.ativo ? 'Ativo' : 'Inativo'}
            Observações: ${fornecedor.observacoes || 'N/A'}
        `.trim();

        navigator.clipboard.writeText(dados);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    console.log('Fornecedor:', fornecedor);
    console.log('updatedAt:', fornecedor.updatedAt);
    console.log('Tipo:', typeof fornecedor.updatedAt);

    const getTabelasCount = () => {
        // Ajuste conforme a estrutura do seu fornecedor
        return fornecedor.tabelasMDR?.length || 0;
    };


   const formatDate = (date: string | Date | undefined): string => {
    if (!date) return '-';
    try {
        const dateObj = date instanceof Date ? date : new Date(date);
        if (isNaN(dateObj.getTime())) return '-';
        
        return dateObj.toLocaleDateString('pt-BR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
    } catch {
        return '-';
    }
};
    // Função para abrir modal de edição
    const handleEdit = () => {
           console.log('📋 Dados do fornecedor:', fornecedor);
        console.log('🏷️ MCCs:', fornecedor.mccs);
        console.log('📚 Categories disponíveis:', categories);
        setShowEditModal(true);
    };

    // Função para abrir modal de visualização
    const handleView = () => {
        setShowViewModal(true);
    };

    const getCnaeCodes = () => {
        if(!Array.isArray(fornecedor.mccs) || fornecedor.mccs.length === 0){
            return 'Nenhum CNAE Informado';
        }
        return fornecedor.mccs.map(mccId => {
            const cnae = categories.find(c => c.id === mccId);
            return cnae ? cnae.label : mccId

        }).join(', ')
    }

    return (
        
            <div className="bg-white dark:bg-[#171717] border border-gray-200 dark:border-gray-700 rounded-lg shadow-md p-5 hover:shadow-lg transition-shadow min-w-0">
                <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-lg flex-shrink-0">
                            <Building2 className="w-6 h-6 text-blue-600 dark:text-blue-400"/>
                        </div>
                        <div>
                            <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100 mb-1 truncate">{fornecedor.nome}</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 truncate">CNPJ: {fornecedor.cnpj}</p>
                        </div>
                    </div>
                    <span className={`flex px-2 py-1 rounded-full text-xs font-medium ${
                        fornecedor.ativo
                        ? 'bg-green-200 text-green-700'
                        : 'bg-gray-200 text-gray-500'
                    }`}>
                        {fornecedor.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                </div>

                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <Calendar className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">
                        Atualizado em {formatDate(fornecedor.updated_at)}
                    </span>
                </div>


                    <span className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <Table className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">Tabelas MDR: {mccCount}</span>
                    </span>
                

                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-start items-center">
                    <div className="flex gap-2">
                        {/* Botão Visualizar */}
                        <button 
                            onClick={handleView}
                            className="p-2 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition cursor-pointer"
                            title="Visualizar detalhes"
                        >
                            <Eye className="w-5 h-5 text-gray-600 dark:text-gray-400"/>
                        </button>

                        {/* Botão Copiar */}
                        <button 
                            onClick={handleCopy}
                            className="p-2 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition cursor-pointer relative"
                            title="Copiar dados"
                        >
                            <Copy className="w-5 h-5 text-gray-600 dark:text-gray-400"/>
                            {copied && (
                                <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                                    Copiado!
                                </span>
                            )}
                        </button>

                        {/* Botão Editar */}
                        {canEdit && (
                            <button 
                                onClick={handleEdit}
                                className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-gray-700 rounded-lg transition cursor-pointer"
                                title="Editar fornecedor"
                            >
                                <Edit className="w-5 h-5 "/>
                            </button>
                        )}

                        {/* Botão Deletar */}
                        {canDelete && (
                            <button 
                                onClick={() => onDelete(fornecedor.id)}
                                className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition cursor-pointer"
                                title="Deletar fornecedor"
                            >
                                <Trash2 className="w-5 h-5 "/>
                            </button>
                        )}
                    </div>
                </div>
            

            {/* Modal de Edição */}
            {showEditModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                            <h2 className="text-xl font-semibold text-gray-900 dark:hover:bg-gray-700">Editar Fornecedor</h2>
                            <button 
                                onClick={() => setShowEditModal(false)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                <X className="w-6 h-6"/>
                            </button>
                        </div>
                        <div className="p-6">
                            <FornecedorForm
                                initialData={{...fornecedor, mcc: fornecedor.cnaes?.map(cnaeCode => {
                                    const category = categories.find(c => c.label.includes(cnaeCode));
                                    return category?.id;
                                }).filter(Boolean) as string[] || []}}
                                categories={categories}
                                onSubmit={async (data) => {
                                    console.log("dados sendo salvos: ", data)
                                    await onEdit({ ...fornecedor, ...data });
                                    setShowEditModal(false);
                                }}
                                onCancel={() => setShowEditModal(false)}
                                isEditing={true}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Visualização (Read-only) */}
            {showViewModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                            <h2 className="text-xl font-semibold text-gray-900">Detalhes do Fornecedor</h2>
                            <button 
                                onClick={() => setShowViewModal(false)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                <X className="w-6 h-6"/>
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                                    <p className="text-gray-900">{fornecedor.nome}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">CNPJ</label>
                                    <p className="text-gray-900">{fornecedor.cnpj}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                    <p className="text-gray-900">{fornecedor.email}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
                                    <p className="text-gray-900">{fornecedor.telefone}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Endereço</label>
                                    <p className="text-gray-900">{fornecedor.endereco || 'N/A'}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">CEP</label>
                                    <p className="text-gray-900">{fornecedor.cep || 'N/A'}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Cidade</label>
                                    <p className="text-gray-900">{fornecedor.cidade || 'N/A'}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                                    <p className="text-gray-900">{fornecedor.estado || 'N/A'}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Contato Principal</label>
                                    <p className="text-gray-900">{fornecedor.contato_principal || 'N/A'}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">CNAEs</label>
                                    <p className="text-gray-900">{getCnaeCodes()}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                                        fornecedor.ativo
                                        ? 'bg-green-100 text-green-700'
                                        : 'bg-gray-100 text-gray-700'
                                    }`}>
                                        {fornecedor.ativo ? 'Ativo' : 'Inativo'}
                                    </span>
                                </div>
                            </div>
                            {fornecedor.observacoes && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
                                    <p className="text-gray-900 whitespace-pre-wrap">{fornecedor.observacoes}</p>
                                </div>
                            )}
                        </div>
                        <div className="border-t border-gray-200 px-6 py-4 flex justify-end">
                            <button
                                onClick={() => setShowViewModal(false)}
                                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg"
                            >
                                Fechar
                            </button>
                        </div>
                    </div>
                </div>
                
            )}
            </div>
        
    );
}

