
'use client';
import { useState } from 'react';

import { FornecedoresList } from '@/components/supplier/FornecedoresList';
import { Fornecedor, FornecedorFormData } from '@/types/fornecedor'
import { FornecedorModal } from '@/components/supplier/FornecedorModal';
import { FornecedorForm } from '@/components/supplier/FornecedorForm';
import BaseHeader from '@/components/layout/base-header';

import { toast } from 'sonner';

export default function FornecedoresPage() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);
    const [loading, setLoading] = useState(false);
    const [editingFornecedor, setEditingFornecedor] = useState<Fornecedor | null>(null)


    const handleAdd = async () => {
        setEditingFornecedor(null);
        setIsModalOpen(true);
        };

    const handleSave = async (formData: FornecedorFormData) => {
        try{
        setLoading(true);
        const response = await fetch('/api/supplier', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData),
        });
        const result = await response.json();
        if (!response.ok){
            toast.error(result.error || 'Erro ao salvar o fornecedor');
            return;
        }

        if (response.ok) {
            // trigger list reload in child
            toast.success('Fornecedor cadastrado com sucesso!')
            setRefreshKey((k) => k + 1);
            setIsModalOpen(false);
        }
    } catch (error) {
        console.error("Error saving fornecedor:", error);
        toast.error('Erro de conexão. Tente novamente')
    }   finally {
        setLoading(false);
    }
}
    

    const handleDelete = async (id: string) => {
        try {
        setLoading(true);
        const response = await fetch(`/api/supplier/${id}`, {
            method: 'DELETE',
        });

            if (response.ok) setRefreshKey((k) => k + 1);
        } catch (error) {
            console.error("Error deleting fornecedor:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = async (fornecedor: Fornecedor) => {
        try {
         setLoading(true);
         
        const response = await fetch(`/api/supplier/${fornecedor.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(fornecedor),
        });

        if (response.ok) setRefreshKey((k) => k + 1);
    } catch (error) {
        console.error("Error editing fornecedor:", error);
    } finally {
        setLoading(false);
    }
}

    return (
        <>
        <BaseHeader
                breadcrumbItems={[{ title: <h1 className="text-2xl font-bold text-gray-900 dark:text-white px-5">Gestão de Fornecedores</h1>, 
                                    subtitle: <p className="text-gray-600 dark:text-white px-5">
                                    Configuração custos, taxas e parcerias com fornecedores de serviços financeiros
                                    </p>,                 
                                        url: "/supplier" }]}
                
            />
            
            <div>
                <div>
                    
                        <FornecedorModal
                            isOpen={isModalOpen}
                            onClose={() => setIsModalOpen(false)}
                            title={'Adicionar Fornecedor'}
                            
                        >
                            {loading ? ( 
                                <div> Carregando...</div>
                            ) : (
                            <FornecedorForm
                                onSubmit={async (data) => {
                                    await handleSave(data);
                                }}
                                onCancel={() => setIsModalOpen(false)}
                                isEditing={false}
                            />
                        
                        )}
                            
                        </FornecedorModal>
                    
                </div>
            </div>

            <div className="bg-gray-100 dark:bg-[#171717] p-6 rounded-lg shadow-sm">
                <div className="min-h-screen dark:bg-[#171717] bg-gray-100 p-6">
                    <div className="space-y-6">
                        <FornecedoresList
                            onAdd={handleAdd}
                            role="admin"
                            refreshKey={refreshKey}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                        />
                    </div>
                </div>
            </div>
       
        </>
    );
}


