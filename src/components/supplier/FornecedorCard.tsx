'use client';
import { Fornecedor } from "@/types/fornecedor";
import { Edit, Trash2, Eye, X, ChevronRight } from "lucide-react";
import { useState } from "react";
import { FornecedorForm } from "./FornecedorForm";
import { useRouter } from 'next/navigation';
import { ModuleBadge } from "@/components/ui/module-badge";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

interface FornecedorCardProps {
    fornecedor: Fornecedor;
    onEdit: (fornecedor: Fornecedor) => void;
    onDelete: (id: string) => void;
    canEdit: boolean;
    canDelete: boolean;
    categories: Array<{id: string; label:string}>
}

export function FornecedorCard({ fornecedor, onEdit, onDelete, canEdit, canDelete, categories }: FornecedorCardProps) {
    const router = useRouter();
    const [showEditModal, setShowEditModal] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);

    const handleEdit = () => {
        setShowEditModal(true);
    };

    const handleView = () => {
        setShowViewModal(true);
    };

    const getCnaeCodes = () => {
        if(!Array.isArray(fornecedor.mccs) || fornecedor.mccs.length === 0){
            return 'Nenhum CNAE Informado';
        }
        return fornecedor.mccs.map(mccId => {
            const cnae = categories.find(c => c.id === mccId);
            return cnae ? cnae.label : mccId;
        }).join(', ');
    }

    return (
        <>
            <Card 
                onClick={() => router.push(`/supplier/${fornecedor.id}`)}
                className="border border-[rgba(255,255,255,0.1)] rounded-[6px] shadow-sm hover:bg-[#2E2E2E] transition-colors cursor-pointer group bg-[#1D1D1D]"
            >
                <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-4 sm:gap-6 flex-wrap">
                        <div className="flex items-center gap-4 sm:gap-6 flex-1 min-w-0 flex-wrap">
                            {/* Nome/Razão Social */}
                            <div className="text-[22px] font-semibold text-[#FFFFFF] truncate">
                                {fornecedor.nome}
                            </div>

                            {/* CNPJ */}
                            <div className="text-sm text-[#5C5C5C] font-normal">
                                CNPJ: {fornecedor.cnpj}
                            </div>

                            {/* Badges - Status e Módulos */}
                            <div className="flex items-center gap-2 flex-shrink-0">
                                <ModuleBadge
                                    moduleSlug="adq"
                                    showIcon={true}
                                    variant="outline"
                                />
                                <Badge
                                    variant={fornecedor.ativo ? "success" : "destructive"}
                                    className="rounded-[6px]"
                                >
                                    {fornecedor.ativo ? "ATIVO" : "INATIVO"}
                                </Badge>
                            </div>
                        </div>

                        {/* Ações */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleView();
                                }}
                                className="p-2 text-[#616161] hover:text-[#E0E0E0] hover:bg-[#2E2E2E] rounded-[6px] transition-colors"
                                title="Visualizar detalhes"
                            >
                                <Eye className="h-4 w-4" />
                            </button>
                            
                            {canEdit && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleEdit();
                                    }}
                                    className="p-2 text-[#616161] hover:text-[#E0E0E0] hover:bg-[#2E2E2E] rounded-[6px] transition-colors"
                                    title="Editar fornecedor"
                                >
                                    <Edit className="h-4 w-4" />
                                </button>
                            )}

                            {canDelete && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onDelete(fornecedor.id);
                                    }}
                                    className="p-2 text-[#616161] hover:text-red-500 hover:bg-[#2E2E2E] rounded-[6px] transition-colors"
                                    title="Deletar fornecedor"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            )}

                            {/* Indicador de clique */}
                            <ChevronRight className="h-4 w-4 text-[#616161] group-hover:text-[#E0E0E0] group-hover:translate-x-1 transition-all flex-shrink-0" />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* MODAL DE EDIÇÃO */}
            {showEditModal && (
                <div 
                    onClick={(e) => e.stopPropagation()}
                    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
                >
                    <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                            <h2 className="text-xl font-semibold text-gray-900">Editar Fornecedor</h2>
                            <button 
                                onClick={() => setShowEditModal(false)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                <X className="w-6 h-6"/>
                            </button>
                        </div>
                        <div className="p-6">
                            <FornecedorForm
                                initialData={{...fornecedor, mcc: fornecedor.mccs || []}}
                                onSubmit={async (data) => {
                                    await onEdit({ ...fornecedor, ...data });
                                    setShowEditModal(false);
                                }}
                                onCancel={() => setShowEditModal(false)}
                                isEditing={true}
                                categories={categories}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL DE VISUALIZAÇÃO */}
            {showViewModal && (
                <div 
                    onClick={(e) => e.stopPropagation()}
                    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
                >
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
        </>
    );
}
