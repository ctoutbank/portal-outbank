"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";




type CustomersFilterContentProps = {
    namein?: string;
    userNameIn?: string;
    onFilter: (namein: string, userName: string) => void;
    onClose: () => void;
}

export function CustomersFilterContent({namein, userNameIn, onFilter, onClose}: CustomersFilterContentProps) {
    const [name,setName] = useState(namein || "")
    
    const [userName,setUserName] = useState(userNameIn || "")

    // Atualizar valores quando props mudarem
    useEffect(() => {
        setName(namein || "")
    }, [namein])

    useEffect(() => {
        setUserName(userNameIn || "")
    }, [userNameIn])


    const applyFilters = () => {
        onFilter(name, userName)
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
          className="absolute left-0 mt-2 bg-background border rounded-lg p-4 shadow-md w-full max-w-md sm:max-w-lg md:max-w-xl z-50"
          onKeyDown={handleKeyDown}
          tabIndex={0}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="text-xs font-medium mb-1.5">Nome</div>
              <Input
                placeholder="Nome do ISO"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={handleKeyDown}
                className="h-9"
                maxLength={30}
              />
            </div>

            
            <div>
              <div className="text-xs font-medium mb-1.5">Usuário</div>
              <Input
                placeholder="Nome ou email do usuário"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                onKeyDown={handleKeyDown}
                className="h-9 w-full"
                maxLength={30}
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