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
import { User, Pencil } from "lucide-react";
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
import { canEditMerchant } from "../_utils/can-edit";

interface MerchantProps {
  Contact: any;
  Address: any;
  activeTab: string;
  idMerchant: number;
  setActiveTab: (tab: string) => void;
  permissions: string[];
  isSuperAdmin?: boolean;
}

export default function MerchantFormcontact({
  Contact,
  Address,
  idMerchant,
  activeTab,
  setActiveTab,
  permissions,
  isSuperAdmin = false,
}: MerchantProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const canEdit = canEditMerchant(permissions, isSuperAdmin);

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

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    // Restaurar dados originais
    setContactData({
      name: Contact?.name || "",
      idDocument: Contact?.idDocument || "",
      email: Contact?.email || "",
      areaCode: Contact?.areaCode || "",
      number: Contact?.number || "",
      birthDate: Contact?.birthDate || "",
      mothersName: Contact?.mothersName || "",
    });
    setAddressData({
      zipCode: Address?.zipCode || "",
      street: Address?.streetAddress || "",
      number: Address?.streetNumber || "",
      complement: Address?.complement || "",
      neighborhood: Address?.neighborhood || "",
      city: Address?.city || "",
      state: Address?.state || "",
      country: Address?.country || "Brasil",
    });
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
        setIsEditing(false);
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
      <Card className="w-full bg-[#1D1D1D] border border-[rgba(255,255,255,0.1)] rounded-[6px]">
        <CardHeader className="flex flex-row items-center justify-between border-b border-[rgba(255,255,255,0.1)]">
          <div className="flex flex-row items-center space-x-2">
            <User className="w-5 h-5 text-[#E0E0E0]" />
            <CardTitle className="text-[#E0E0E0]">Dados do Responsável</CardTitle>
          </div>
          {canEdit && !isEditing && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleEdit}
              className="text-[#E0E0E0] hover:bg-[#2E2E2E]"
            >
              <Pencil className="h-4 w-4" />
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-4 p-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-[#E0E0E0] mb-2">
                Nome <span className="text-red-500">*</span>
              </Label>
              <Input
                value={contactData.name}
                onChange={(e) =>
                  setContactData({ ...contactData, name: e.target.value })
                }
                disabled={!isEditing || !canEdit}
                className="bg-[#212121] border-[#2E2E2E] text-[#E0E0E0] disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>

            <div>
              <Label className="text-[#E0E0E0] mb-2">
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
                disabled={!isEditing || !canEdit}
                className="bg-[#212121] border-[#2E2E2E] text-[#E0E0E0] disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-[#E0E0E0] mb-2">
                Email <span className="text-red-500">*</span>
              </Label>
              <Input
                type="email"
                value={contactData.email}
                onChange={(e) =>
                  setContactData({ ...contactData, email: e.target.value })
                }
                disabled={!isEditing || !canEdit}
                className="bg-[#212121] border-[#2E2E2E] text-[#E0E0E0] disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>

            <div className="flex gap-2">
              <div className="w-1/6">
                <Label className="text-[#E0E0E0] mb-2">DDD</Label>
                <Input
                  value={contactData.areaCode}
                  onChange={(e) =>
                    setContactData({ ...contactData, areaCode: e.target.value })
                  }
                  maxLength={2}
                  onKeyDown={(e) => handleNumericInput(e, 2)}
                  disabled={!isEditing || !canEdit}
                  className="bg-[#212121] border-[#2E2E2E] text-[#E0E0E0] disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
              <div className="w-5/6">
                <Label className="text-[#E0E0E0] mb-2">Telefone</Label>
                <Input
                  value={contactData.number}
                  onChange={(e) =>
                    setContactData({ ...contactData, number: e.target.value })
                  }
                  maxLength={9}
                  onKeyDown={(e) => handleNumericInput(e, 9)}
                  disabled={!isEditing || !canEdit}
                  className="bg-[#212121] border-[#2E2E2E] text-[#E0E0E0] disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="w-full mt-4 bg-[#1D1D1D] border border-[rgba(255,255,255,0.1)] rounded-[6px]">
        <CardHeader className="flex flex-row items-center justify-between border-b border-[rgba(255,255,255,0.1)]">
          <CardTitle className="text-[#E0E0E0]">Endereço do Responsável</CardTitle>
          {canEdit && !isEditing && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleEdit}
              className="text-[#E0E0E0] hover:bg-[#2E2E2E]"
            >
              <Pencil className="h-4 w-4" />
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-4 p-6">
          <div>
            <Label className="text-[#E0E0E0] mb-2">CEP</Label>
            <Input
              value={formatCep(addressData.zipCode)}
              onChange={(e) =>
                setAddressData({
                  ...addressData,
                  zipCode: e.target.value.replace(/\D/g, "").slice(0, 8),
                })
              }
              disabled={!canEdit}
              className="bg-[#212121] border-[#2E2E2E] text-[#E0E0E0] disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          <div>
            <Label className="text-[#E0E0E0] mb-2">Rua</Label>
            <Input
              value={addressData.street}
              onChange={(e) =>
                setAddressData({ ...addressData, street: e.target.value })
              }
              disabled={!canEdit}
              className="bg-[#212121] border-[#2E2E2E] text-[#E0E0E0] disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-[#E0E0E0] mb-2">Número</Label>
              <Input
                value={addressData.number}
                onChange={(e) =>
                  setAddressData({ ...addressData, number: e.target.value })
                }
                disabled={!isEditing || !canEdit}
                className="bg-[#212121] border-[#2E2E2E] text-[#E0E0E0] disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>

            <div>
              <Label className="text-[#E0E0E0] mb-2">Complemento</Label>
              <Input
                value={addressData.complement}
                onChange={(e) =>
                  setAddressData({ ...addressData, complement: e.target.value })
                }
                disabled={!isEditing || !canEdit}
                className="bg-[#212121] border-[#2E2E2E] text-[#E0E0E0] disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          <div>
            <Label className="text-[#E0E0E0] mb-2">Bairro</Label>
            <Input
              value={addressData.neighborhood}
              onChange={(e) =>
                setAddressData({ ...addressData, neighborhood: e.target.value })
              }
              disabled={!canEdit}
              className="bg-[#212121] border-[#2E2E2E] text-[#E0E0E0] disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-[#E0E0E0] mb-2">Cidade</Label>
              <Input
                value={addressData.city}
                onChange={(e) =>
                  setAddressData({ ...addressData, city: e.target.value })
                }
                disabled={!isEditing || !canEdit}
                className="bg-[#212121] border-[#2E2E2E] text-[#E0E0E0] disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>

            <div>
              <Label className="text-[#E0E0E0] mb-2">Estado</Label>
              <Select
                value={addressData.state}
                onValueChange={(value) =>
                  setAddressData({ ...addressData, state: value })
                }
                disabled={!isEditing || !canEdit}
              >
                <SelectTrigger className="bg-[#212121] border-[#2E2E2E] text-[#E0E0E0] disabled:opacity-50 disabled:cursor-not-allowed">
                  <SelectValue placeholder="Selecione o estado" />
                </SelectTrigger>
                <SelectContent className="bg-[#212121] border-[#2E2E2E]">
                  {states.map((state) => (
                    <SelectItem key={state.value} value={state.value} className="text-[#E0E0E0] hover:bg-[#2E2E2E]">
                      {state.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {isEditing && canEdit && (
        <div className="flex justify-end gap-2 mt-4">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={isSubmitting}
            className="px-6 border-[#2E2E2E] hover:bg-[#2E2E2E] text-[#E0E0E0] rounded-[6px]"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="px-6 bg-[#212121] border border-[#2E2E2E] hover:bg-[#2E2E2E] text-[#E0E0E0] rounded-[6px]"
          >
            {isSubmitting ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      )}
    </form>
  );
}

