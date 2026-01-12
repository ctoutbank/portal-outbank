'use client';
import { Fornecedor } from "@/types/fornecedor";
import { Trash2, ChevronRight } from "lucide-react";
import { useRouter } from 'next/navigation';
import { ModuleBadge } from "@/components/ui/module-badge";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

interface FornecedorCardProps {
    fornecedor: Fornecedor;
    onEdit?: (fornecedor: Fornecedor) => void;
    onDelete: (id: string) => void;
    canEdit?: boolean;
    canDelete: boolean;
    categories?: Array<{id: string; label:string}>
}

export function FornecedorCard({ fornecedor, onDelete, canDelete }: FornecedorCardProps) {
    const router = useRouter();

    return (
        <Card 
            onClick={() => router.push(`/supplier/${fornecedor.id}`)}
            className="border border-[rgba(255,255,255,0.1)] rounded-[6px] shadow-sm hover:bg-[#2E2E2E] transition-colors cursor-pointer group bg-[#1D1D1D]"
        >
            <CardContent className="p-4">
                <div className="flex items-center justify-between gap-4 sm:gap-6 flex-wrap">
                    <div className="flex items-center gap-4 sm:gap-6 flex-1 min-w-0 flex-wrap">
                        <div className="text-[22px] font-semibold text-[#FFFFFF] truncate">
                            {fornecedor.nome}
                        </div>

                        <div className="text-sm text-[#5C5C5C] font-normal">
                            CNPJ: {fornecedor.cnpj}
                        </div>

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

                    <div className="flex items-center gap-2 flex-shrink-0">
                        {canDelete && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDelete(fornecedor.id);
                                }}
                                className="p-2 text-[#616161] hover:text-red-500 hover:bg-[#2E2E2E] rounded-[6px] transition-colors cursor-pointer"
                                title="Deletar fornecedor"
                            >
                                <Trash2 className="h-4 w-4" />
                            </button>
                        )}

                        <ChevronRight className="h-4 w-4 text-[#616161] group-hover:text-[#E0E0E0] group-hover:translate-x-1 transition-all flex-shrink-0" />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
