' use client ';

import { Fornecedor } from "@/types/fornecedor";
import {Building2, Mail, Phone, MapPin, Edit, Trash2} from "lucide-react";

interface FornecedorCardProps {
    fornecedor: Fornecedor;
    onEdit: (fornecedor: Fornecedor) => void;
    onDelete: (id: string) => void;
    
    canEdit: boolean;
    canDelete: boolean;
}

export function FornecedorCard({ fornecedor, onEdit, onDelete, canEdit, canDelete }: FornecedorCardProps) {
    return (
        <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                    <div className="bg-blue-100 p-3 rounded-lg">
                        <Building2 className="w-6 h-6 text-blue-600"/>
                    </div>
                    <div>
                        <h3 className="font-semibold text-lg text-gray-900">{fornecedor.nome}</h3>
                        <p className="text-sm text-gray-500">CNPJ: {fornecedor.cnpj}</p>
                    </div>
                </div>

                <div className="flex gap-2">
                    {canEdit && (
                        <button onClick={() => onEdit(fornecedor)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition">
                            <Edit className="w-5 h-5"/>
                        </button>
                    )}

                    {canDelete && (
                        <button onClick={() => onDelete(fornecedor.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition">
                            <Trash2 className="w-5 h-5"/>
                        </button>
                    )}
                </div>
            </div>

            <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                    <Mail className="w-4 h-4"/>
                    <span>{fornecedor.email}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                    <Phone className="w-4 h-4"/>
                    <span>{fornecedor.telefone}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                    <MapPin className="w-4 h-4"/>
                    <span>{fornecedor.cidade} - {fornecedor.estado}</span>
                </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between items-center">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    fornecedor.ativo
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-700'
                }`}>
                    {fornecedor.ativo ? 'Ativo' : 'Inativo'}</span>
                <span className="text-xs text-gray-500">
                    Contato: {fornecedor.contato_principal}
                </span>
            </div>
        </div>

    )

}