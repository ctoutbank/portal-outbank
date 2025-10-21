
'use client';
import { useState } from 'react';
import { Plus } from 'lucide-react';
import { FornecedoresList } from '@/components/supplier/FornecedoresList';
import { Fornecedor, FornecedorFormData } from '@/types/fornecedor'
import { FornecedorModal } from '@/components/supplier/FornecedorModal';
import { FornecedorForm } from '@/components/supplier/FornecedorForm';

export default function FornecedoresPage() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);
    const [loading, setLoading] = useState(false);

    const handleSave = async (formData: FornecedorFormData) => {
        try{
        setLoading(true);
        const response = await fetch('/api/supplier', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData),
        });

        if (response.ok) {
            // trigger list reload in child
            setRefreshKey((k) => k + 1);
            setIsModalOpen(false);
        }
    } catch (error) {
        console.error("Error saving fornecedor:", error);
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
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-semibold text-gray-900">Fornecedores</h1>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                >
                    <Plus className="w-5 h-5" />
                    Adicionar Fornecedor
                </button>
            </div>

            <div>
                <div>
                    <div className="space-y-6">
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
            </div>

            <div className="bg-gray-100 p-6 rounded-lg shadow-sm">
                <div className="bg-white p-6 rounded-lg shadow-sm">
                    <div className="space-y-6">
                        <FornecedoresList
                            role="admin"
                            refreshKey={refreshKey}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}


