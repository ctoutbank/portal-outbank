' use client ';

import { Category } from "@/types/fornecedor";
import {Building2, Edit, Trash2} from "lucide-react";

interface CnaeCardProps {
    cnae: Category;
    onEdit: (cnae: Category) => void;
    onDelete: (id: string) => void;
    
    canEdit: boolean;
    canDelete: boolean;
}

export function CnaeCard({ cnae, onEdit, onDelete, canEdit, canDelete }: CnaeCardProps) {
    return (
        <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                    <div className="bg-blue-100 p-3 rounded-lg">
                        <Building2 className="w-6 h-6 text-blue-600"/>
                    </div>
                    <div>
                        <h3 className="font-semibold text-lg text-gray-900">{cnae.cnae}</h3>
                        <p className="text-sm text-gray-500">Descricao: {cnae.name}</p>
                    </div>
                </div>

                <div className="flex gap-2">
                    {canEdit && (
                        <button onClick={() => onEdit(cnae)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition">
                            <Edit className="w-5 h-5"/>
                        </button>
                    )}

                    {canDelete && (
                        <button onClick={() => onDelete(cnae.id.toString())}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition">
                            <Trash2 className="w-5 h-5"/>
                        </button>
                    )}
                </div>
            </div>

        </div>

    )

}