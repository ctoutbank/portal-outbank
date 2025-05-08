import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";




type CustomersFilterContentProps = {
    namein?: string;
   
    settlementManagementTypein?: string;
    onFilter: (namein: string, settlementManagementType: string) => void;
    onClose: () => void;
}

export function CustomersFilterContent({namein, settlementManagementTypein, onFilter, onClose}: CustomersFilterContentProps) {
    const [name,setName] = useState(namein || "")
    
    const [settlementManagementType,setSettlementManagementType] = useState(settlementManagementTypein || "")


    const applyFilters = () => {
        onFilter(name,  settlementManagementType)
        onClose()
    }


    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
          e.preventDefault();
          applyFilters();
        }
      };

     
    
    return (
        <div
          className="absolute left-0 mt-2 bg-background border rounded-lg p-4 shadow-md w-[900px]"
          onKeyDown={handleKeyDown}
          tabIndex={0}
        >
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs font-medium mb-1.5">Nome</div>
              <Input
                placeholder="Nome do cliente"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={handleKeyDown}
                className="h-9"
              />
            </div>

            
            <div>
              <div className="text-xs font-medium mb-1.5">Tipo de Gestão</div>
              <Input
                placeholder="Tipo de gestão de liquidação"
                value={settlementManagementType}
                onChange={(e) => setSettlementManagementType(e.target.value)}
                onKeyDown={handleKeyDown}
                className="h-9 w-full"
              />
            </div>
          </div>

          <div className="flex justify-end pt-4 mt-4 border-t">
            <Button
              onClick={applyFilters}
              className="flex items-center gap-2"
              size="sm"
            >
              Filtrar
            </Button>
          </div>
        </div>
    )
}