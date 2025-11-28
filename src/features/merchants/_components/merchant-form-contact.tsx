"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { User } from "lucide-react";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { formatCep, handleNumericInput } from "@/lib/utils";
import { states } from "@/lib/lookuptables/lookuptables";
import {
  insertContactFormAction,
  updateContactFormAction,
} from "../_actions/contact-formActions";
import {
  insertAddressFormAction,
  updateAddressFormAction,
} from "../_actions/merchant-formActions";

interface MerchantProps {
  Contact: any;
  Address: any;
  activeTab: string;
  idMerchant: number;
  setActiveTab: (tab: string) => void;
  permissions: string[];
}

export default function MerchantFormcontact({
  Contact,
  Address,
  idMerchant,
  activeTab,
  setActiveTab,
  permissions,
}: MerchantProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [contactData, setContactData] = useState({
    name: Contact?.name || "",
    idDocument: Contact?.idDocument || "",
    email: Contact?.email || "",
    areaCode: Contact?.areaCode || "",
    number: Contact?.number || "",
    birthDate: Contact?.birthDate || "",
    mothersName: Contact?.mothersName || "",
  });

  const [addressData, setAddressData] = useState({
    zipCode: Address?.zipCode || "",
    street: Address?.streetAddress || "",
    number: Address?.streetNumber || "",
    complement: Address?.complement || "",
    neighborhood: Address?.neighborhood || "",
    city: Address?.city || "",
    state: Address?.state || "",
    country: Address?.country || "Brasil",
  });

  const params = new URLSearchParams(searchParams || "");

  const refreshPage = (id: number) => {
    params.set("tab", activeTab);
    setActiveTab(activeTab);
    router.push(`/merchants/${id}?${params.toString()}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Salvar endereço primeiro
      let addressId = Address?.id;
      if (addressId) {
        await updateAddressFormAction({ ...addressData, id: addressId });
      } else {
        addressId = await insertAddressFormAction(addressData);
      }

      // Salvar contato
      const contactDataToSave = {
        ...contactData,
        id: Contact?.id,
        idMerchant: idMerchant,
        idAddress: addressId,
        phoneType: contactData.number?.startsWith("9") ? "C" : "P",
      };

      if (Contact?.id) {
        await updateContactFormAction(contactDataToSave);
        toast.success("Dados do responsável atualizados com sucesso!");
      } else {
        await insertContactFormAction(contactDataToSave);
        toast.success("Dados do responsável salvos com sucesso!");
      }
      refreshPage(idMerchant);
    } catch (error) {
      console.error("Erro ao salvar:", error);
      toast.error("Erro ao salvar os dados");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card className="w-full">
        <CardHeader className="flex flex-row items-center space-x-2">
          <User className="w-5 h-5" />
          <CardTitle>Dados do Responsável</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>
                Nome <span className="text-red-500">*</span>
              </Label>
              <Input
                value={contactData.name}
                onChange={(e) =>
                  setContactData({ ...contactData, name: e.target.value })
                }
              />
            </div>

            <div>
              <Label>
                CPF <span className="text-red-500">*</span>
              </Label>
              <Input
                value={contactData.idDocument}
                onChange={(e) =>
                  setContactData({
                    ...contactData,
                    idDocument: e.target.value.replace(/\D/g, "").slice(0, 11),
                  })
                }
                maxLength={14}
                onKeyDown={(e) => handleNumericInput(e, 14)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>
                Email <span className="text-red-500">*</span>
              </Label>
              <Input
                type="email"
                value={contactData.email}
                onChange={(e) =>
                  setContactData({ ...contactData, email: e.target.value })
                }
              />
            </div>

            <div className="flex gap-2">
              <div className="w-1/6">
                <Label>DDD</Label>
                <Input
                  value={contactData.areaCode}
                  onChange={(e) =>
                    setContactData({ ...contactData, areaCode: e.target.value })
                  }
                  maxLength={2}
                  onKeyDown={(e) => handleNumericInput(e, 2)}
                />
              </div>
              <div className="w-5/6">
                <Label>Telefone</Label>
                <Input
                  value={contactData.number}
                  onChange={(e) =>
                    setContactData({ ...contactData, number: e.target.value })
                  }
                  maxLength={9}
                  onKeyDown={(e) => handleNumericInput(e, 9)}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="w-full mt-4">
        <CardHeader>
          <CardTitle>Endereço do Responsável</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>CEP</Label>
            <Input
              value={formatCep(addressData.zipCode)}
              onChange={(e) =>
                setAddressData({
                  ...addressData,
                  zipCode: e.target.value.replace(/\D/g, "").slice(0, 8),
                })
              }
            />
          </div>

          <div>
            <Label>Rua</Label>
            <Input
              value={addressData.street}
              onChange={(e) =>
                setAddressData({ ...addressData, street: e.target.value })
              }
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Número</Label>
              <Input
                value={addressData.number}
                onChange={(e) =>
                  setAddressData({ ...addressData, number: e.target.value })
                }
              />
            </div>

            <div>
              <Label>Complemento</Label>
              <Input
                value={addressData.complement}
                onChange={(e) =>
                  setAddressData({ ...addressData, complement: e.target.value })
                }
              />
            </div>
          </div>

          <div>
            <Label>Bairro</Label>
            <Input
              value={addressData.neighborhood}
              onChange={(e) =>
                setAddressData({ ...addressData, neighborhood: e.target.value })
              }
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Cidade</Label>
              <Input
                value={addressData.city}
                onChange={(e) =>
                  setAddressData({ ...addressData, city: e.target.value })
                }
              />
            </div>

            <div>
              <Label>Estado</Label>
              <Select
                value={addressData.state}
                onValueChange={(value) =>
                  setAddressData({ ...addressData, state: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o estado" />
                </SelectTrigger>
                <SelectContent>
                  {states.map((state) => (
                    <SelectItem key={state.value} value={state.value}>
                      {state.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {permissions?.includes("Atualizar") && (
        <div className="flex justify-end mt-4">
          <Button type="submit" disabled={isSubmitting} className="px-6">
            {isSubmitting ? "Salvando..." : "Avançar"}
          </Button>
        </div>
      )}
    </form>
  );
}

