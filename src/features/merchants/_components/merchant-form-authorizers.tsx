"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CreditCard, Plus, Trash2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useRef, useState, useEffect } from "react";
import { toast } from "sonner";
import {
  saveAuthorizersFormAction,
  getAuthorizersFormAction,
} from "../_actions/authorizer-formActions";

// Tipos de autorizadores disponíveis
const AUTHORIZER_TYPES = [
  "GLOBAL PAYMENTS",
  "AUTORIZADOR DOCK PIX",
  "DOCK | POSTILION",
  "GLOBAL PAYMENTS ECOMMERCE",
];

// Interface para os dados do autorizador
interface AuthorizerData {
  id: number;
  type: string;
  conciliarTransacoes: string;
  merchantId?: string;
  tokenCnp?: string;
  terminalId?: string;
  idConta?: string;
  chavePix?: string;
}

// Props para o componente principal
interface MerchantFormAuthorizersProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  idMerchant?: number;
  permissions?: string[];
}

// Componente para um único autorizador
function AuthorizerFormItem({
  id,
  initialData,
  onDataChange,
}: {
  id: number;
  initialData: AuthorizerData;
  onDataChange?: (id: number, data: AuthorizerData) => void;
}) {
  const [formData, setFormData] = useState<AuthorizerData>(initialData);
  // Determinar quais campos mostrar com base no tipo de autorizador
  const showMerchantId = formData.type !== "AUTORIZADOR DOCK PIX";
  const showTokenCnp = formData.type !== "AUTORIZADOR DOCK PIX";
  const showTerminalId = true;
  const showIdConta = formData.type === "AUTORIZADOR DOCK PIX";
  const showChavePix = formData.type === "AUTORIZADOR DOCK PIX";

  const updateField = (field: keyof AuthorizerData, value: any) => {
    const updated = { ...formData, [field]: value };
    setFormData(updated);
    onDataChange?.(id, updated);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>
          Conciliar transações <span className="text-red-500">*</span>
        </Label>
        <RadioGroup
          value={formData.conciliarTransacoes || "nao"}
          onValueChange={(value) => updateField("conciliarTransacoes", value)}
          className="flex space-x-4"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="sim" id={`${id}-sim`} />
            <Label htmlFor={`${id}-sim`}>Sim</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="nao" id={`${id}-nao`} />
            <Label htmlFor={`${id}-nao`}>Não</Label>
          </div>
        </RadioGroup>
      </div>

      {showMerchantId && (
        <div className="space-y-2">
          <Label>Merchant ID:</Label>
          <Input
            value={formData.merchantId || ""}
            onChange={(e) => updateField("merchantId", e.target.value)}
          />
        </div>
      )}

      {showTokenCnp && (
        <div className="space-y-2">
          <Label>Token CNP no autorizador:</Label>
          <Input
            value={formData.tokenCnp || ""}
            onChange={(e) => updateField("tokenCnp", e.target.value)}
          />
        </div>
      )}

      {showIdConta && (
        <div className="space-y-2">
          <Label>ID Conta:</Label>
          <Input
            value={formData.idConta || ""}
            onChange={(e) => updateField("idConta", e.target.value)}
          />
        </div>
      )}

      {showChavePix && (
        <div className="space-y-2">
          <Label>Chave PIX:</Label>
          <Input
            value={formData.chavePix || ""}
            onChange={(e) => updateField("chavePix", e.target.value)}
          />
        </div>
      )}

      {showTerminalId && (
        <div className="space-y-2">
          <Label>Terminal ID:</Label>
          <Input
            value={formData.terminalId || ""}
            onChange={(e) => updateField("terminalId", e.target.value)}
          />
        </div>
      )}
    </div>
  );
}

export default function MerchantFormAuthorizers({
  activeTab,
  setActiveTab,
  idMerchant = 0,
  permissions = [],
}: MerchantFormAuthorizersProps) {
  const router = useRouter();

  // Estado para armazenar os autorizadores
  const [authorizers, setAuthorizers] = useState<AuthorizerData[]>([]);
  const [nextId, setNextId] = useState(1);
  const [selectedType, setSelectedType] = useState<string>("");
  const [showTypeSelector, setShowTypeSelector] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Referência para armazenar os dados dos formulários
  const formRefs = useRef<{
    [key: number]: AuthorizerData;
  }>({});

  // Carregar autorizadores existentes quando o componente montar ou idMerchant mudar
  useEffect(() => {
    if (idMerchant > 0) {
      loadAuthorizers();
    }
  }, [idMerchant]);

  const loadAuthorizers = async () => {
    try {
      setIsLoading(true);
      const result = await getAuthorizersFormAction(idMerchant);

      if (result.success && result.authorizers && result.authorizers.length > 0) {
        setAuthorizers(result.authorizers);
        // Inicializar formRefs com os dados existentes
        result.authorizers.forEach((auth) => {
          formRefs.current[auth.id] = auth;
        });
        // Atualizar nextId para evitar conflitos
        const maxId = Math.max(...result.authorizers.map((a) => a.id));
        setNextId(maxId + 1);
      }
    } catch (error) {
      console.error("Erro ao carregar autorizadores:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const searchParams = useSearchParams();
  const params = new URLSearchParams(searchParams || "");

  const refreshPage = (id: number) => {
    params.set("tab", activeTab);
    setActiveTab(activeTab);
    router.push(`/merchants/${id}?${params.toString()}`);
  };

  // Função para adicionar um novo autorizador
  const addNewAuthorizer = (type: string) => {
    const newAuthorizer: AuthorizerData = {
      id: nextId,
      type,
      conciliarTransacoes: "nao",
    };

    setAuthorizers([...authorizers, newAuthorizer]);
    setNextId(nextId + 1);
    setShowTypeSelector(false);
    setSelectedType("");
  };

  // Função para remover um autorizador
  const removeAuthorizer = (id: number) => {
    setAuthorizers(authorizers.filter((auth) => auth.id !== id));
    delete formRefs.current[id];
  };

  // Função para salvar os dados
  const onSubmit = async () => {
    try {
      if (idMerchant === 0) {
        toast.error("ID do merchant inválido");
        return;
      }

      if (authorizers.length === 0) {
        toast.info("Nenhum autorizador configurado");
        refreshPage(idMerchant);
        return;
      }

      setIsLoading(true);

      // Coletar dados de todos os formulários
      const authorizersData = authorizers.map((auth) => {
        const formData = formRefs.current[auth.id] || auth;
        return {
          id: formData.id,
          type: formData.type,
          conciliarTransacoes: formData.conciliarTransacoes,
          merchantId: formData.merchantId,
          tokenCnp: formData.tokenCnp,
          terminalId: formData.terminalId,
          idConta: formData.idConta,
          chavePix: formData.chavePix,
        };
      });

      const result = await saveAuthorizersFormAction(idMerchant, authorizersData);

      if (result.success) {
        toast.success("Autorizadores salvos com sucesso!");
        // Recarregar autorizadores para garantir sincronização
        await loadAuthorizers();
        refreshPage(idMerchant);
      } else {
        toast.error(result.error || "Erro ao salvar os autorizadores");
      }
    } catch (error) {
      console.error("Erro ao salvar autorizadores:", error);
      toast.error("Erro ao salvar os autorizadores");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <h2 className="text-xl font-semibold mb-4">Autorizadores</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {authorizers.map((authorizer) => (
          <Card
            key={authorizer.id}
            className="w-full shadow-sm hover:shadow-md transition-shadow"
          >
            <CardHeader className="flex flex-row items-center justify-between bg-gray-50 py-3">
              <div className="flex flex-row items-center space-x-2">
                <CreditCard className="w-5 h-5 text-primary" />
                <CardTitle className="text-lg">{authorizer.type}</CardTitle>
              </div>
              {authorizers.length > 1 && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeAuthorizer(authorizer.id)}
                  title="Remover autorizador"
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              )}
            </CardHeader>
            <CardContent className="p-4">
              <AuthorizerFormItem
                id={authorizer.id}
                initialData={authorizer}
                onDataChange={(id, data) => {
                  formRefs.current[id] = data;
                  setAuthorizers(
                    authorizers.map((auth) =>
                      auth.id === id ? { ...auth, ...data } : auth
                    )
                  );
                }}
              />
            </CardContent>
          </Card>
        ))}

        {showTypeSelector && (
          <Card className="w-full shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center bg-gray-50 py-3">
              <div className="flex flex-row items-center space-x-2">
                <Plus className="w-5 h-5 text-primary" />
                <CardTitle className="text-lg">Novo Autorizador</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Tipo de Autorizador</Label>
                  <Select value={selectedType} onValueChange={setSelectedType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um autorizador" />
                    </SelectTrigger>
                    <SelectContent>
                      {AUTHORIZER_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex justify-end space-x-2 pt-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowTypeSelector(false)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={() =>
                      selectedType && addNewAuthorizer(selectedType)
                    }
                    disabled={!selectedType}
                  >
                    Adicionar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {!showTypeSelector && (
        <div className="flex justify-center mt-6">
          <Button
            type="button"
            onClick={() => setShowTypeSelector(true)}
            className="flex items-center space-x-2"
            variant="outline"
          >
            <Plus className="w-4 h-4" />
            <span>Adicionar Autorizador</span>
          </Button>
        </div>
      )}

      {permissions?.includes("Atualizar") && (
        <div className="flex justify-end mt-8">
          <Button
            type="submit"
            onClick={onSubmit}
            className="px-6"
            disabled={isLoading}
          >
            {isLoading ? "Salvando..." : "Avançar"}
          </Button>
        </div>
      )}
    </div>
  );
}

