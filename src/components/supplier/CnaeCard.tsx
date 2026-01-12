'use client';

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
        <div className="bg-[#1a1a1a] rounded-lg shadow-md p-6 hover:bg-[#2a2a2a] transition-all border border-[#2a2a2a]">
            <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                    <div className="bg-blue-500/10 p-3 rounded-lg">
                        <Building2 className="w-6 h-6 text-blue-400"/>
                    </div>
                    <div>
                        <h3 className="font-semibold text-lg text-white">{cnae.cnae}</h3>
                        <p className="text-sm text-[#808080]">Descricao: {cnae.name}</p>
                    </div>
                </div>

                <div className="flex gap-2">
                    {canEdit && (
                        <button onClick={() => onEdit(cnae)}
                        className="p-2 text-blue-400 hover:bg-blue-500/10 rounded-lg transition cursor-pointer">
                            <Edit className="w-5 h-5"/>
                        </button>
                    )}

                    {canDelete && (
                        <button onClick={() => onDelete(cnae.id.toString())}
                        className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition cursor-pointer">
                            <Trash2 className="w-5 h-5"/>
                        </button>
                    )}
                </div>
            </div>

        </div>

    )

}