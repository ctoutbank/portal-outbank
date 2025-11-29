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
import { Building2, MapPin, Pencil } from "lucide-react";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import {
  insertMerchantFormAction,
  updateMerchantFormAction,
  insertAddressFormAction,
  updateAddressFormAction,
} from "../_actions/merchant-formActions";
import { formatCNPJ, formatCep, handleNumericInput } from "@/lib/utils";
import { legalPersonTypes, states } from "@/lib/lookuptables/lookuptables";
import {
  CnaeMccDropdown,
  EstablishmentFormatDropdown,
  LegalNatureDropdown,
} from "../server/merchant-helpers";
import { canEditMerchant } from "../_utils/can-edit";

interface MerchantProps {
  merchant: any;
  address: any;
  Cnae: string;
  Mcc: string;
  DDLegalNature: LegalNatureDropdown[];
  DDCnaeMcc: CnaeMccDropdown[];
  DDEstablishmentFormat: EstablishmentFormatDropdown[];
  activeTab: string;
  setActiveTab: (tab: string) => void;
  permissions: string[];
  isSuperAdmin?: boolean;
}

export default function MerchantFormCompany({
  merchant,
  address,
  Mcc,
  DDLegalNature,
  DDEstablishmentFormat,
  DDCnaeMcc = [],
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

  const [formData, setFormData] = useState({
    name: merchant?.name || "",
    corporateName: merchant?.corporateName || "",
    email: merchant?.email || "",
    idDocument: merchant?.idDocument || "",
    areaCode: merchant?.areaCode || "",
    number: merchant?.number || "",
    openingDate: merchant?.openingDate || "",
    openingDays: merchant?.openingDays || "0000000",
    openingHour: merchant?.openingHour || "",
    closingHour: merchant?.closingHour || "",
    municipalRegistration: merchant?.municipalRegistration || "",
    stateSubcription: merchant?.stateSubcription || "",
    revenue: merchant?.revenue || "",
    establishmentFormat: merchant?.establishmentFormat || "",
    legalPerson: merchant?.legalPerson || "",
    cnae: String(merchant?.idCategory) || "",
    mcc: Mcc || "",
    idLegalNature: merchant?.idLegalNature || "",
  });

  const [addressData, setAddressData] = useState({
    zipCode: address?.zipCode || "",
    street: address?.streetAddress || "",
    number: address?.streetNumber || "",
    complement: address?.complement || "",
    neighborhood: address?.neighborhood || "",
    city: address?.city || "",
    state: address?.state || "",
    country: address?.country || "Brasil",
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
    setFormData({
      name: merchant?.name || "",
      corporateName: merchant?.corporateName || "",
      email: merchant?.email || "",
      idDocument: merchant?.idDocument || "",
      areaCode: merchant?.areaCode || "",
      number: merchant?.number || "",
      openingDate: merchant?.openingDate || "",
      openingDays: merchant?.openingDays || "0000000",
      openingHour: merchant?.openingHour || "",
      closingHour: merchant?.closingHour || "",
      municipalRegistration: merchant?.municipalRegistration || "",
      stateSubcription: merchant?.stateSubcription || "",
      revenue: merchant?.revenue || "",
      establishmentFormat: merchant?.establishmentFormat || "",
      legalPerson: merchant?.legalPerson || "",
      cnae: String(merchant?.idCategory) || "",
      mcc: Mcc || "",
      idLegalNature: merchant?.idLegalNature || "",
    });
    setAddressData({
      zipCode: address?.zipCode || "",
      street: address?.streetAddress || "",
      number: address?.streetNumber || "",
      complement: address?.complement || "",
      neighborhood: address?.neighborhood || "",
      city: address?.city || "",
      state: address?.state || "",
      country: address?.country || "Brasil",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Salvar endereço primeiro
      let addressId = address?.id;
      if (addressId) {
        await updateAddressFormAction({ ...addressData, id: addressId });
      } else {
        addressId = await insertAddressFormAction(addressData);
      }

      // Salvar merchant
      const merchantData = {
        ...formData,
        id: merchant?.id,
        idAddress: addressId,
        idCategory: formData.cnae ? Number(formData.cnae) : undefined,
        idLegalNature: formData.idLegalNature ? Number(formData.idLegalNature) : undefined,
        phoneType: formData.number?.startsWith("9") ? "C" : "P",
      };

      if (merchant?.id) {
        await updateMerchantFormAction(merchantData);
        toast.success("Dados atualizados com sucesso!");
        setIsEditing(false);
        router.refresh();
      } else {
        const newId = await insertMerchantFormAction(merchantData);
        toast.success("Estabelecimento criado com sucesso!");
        refreshPage(newId);
      }
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
            <Building2 className="w-5 h-5 text-[#E0E0E0]" />
            <CardTitle className="text-[#E0E0E0]">Empresa</CardTitle>
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
                CNPJ <span className="text-red-500">*</span>
              </Label>
              <Input
                value={formData.idDocument ? formatCNPJ(formData.idDocument) : ""}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, "");
                  setFormData({ ...formData, idDocument: value });
                }}
                maxLength={18}
                disabled={!isEditing || !canEdit}
                className="bg-[#212121] border-[#2E2E2E] text-[#E0E0E0] disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>

            <div>
              <Label className="text-[#E0E0E0] mb-2">
                Email <span className="text-red-500">*</span>
              </Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                disabled={!isEditing || !canEdit}
                className="bg-[#212121] border-[#2E2E2E] text-[#E0E0E0] disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-[#E0E0E0] mb-2">
                Razão Social <span className="text-red-500">*</span>
              </Label>
              <Input
                value={formData.corporateName}
                onChange={(e) =>
                  setFormData({ ...formData, corporateName: e.target.value })
                }
                disabled={!isEditing || !canEdit}
                className="bg-[#212121] border-[#2E2E2E] text-[#E0E0E0] disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>

            <div>
              <Label className="text-[#E0E0E0] mb-2">
                Nome Fantasia <span className="text-red-500">*</span>
              </Label>
              <Input
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                disabled={!isEditing || !canEdit}
                className="bg-[#212121] border-[#2E2E2E] text-[#E0E0E0] disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex gap-2">
              <div className="w-1/6">
                <Label className="text-[#E0E0E0] mb-2">
                  DDD <span className="text-red-500">*</span>
                </Label>
                <Input
                  value={formData.areaCode}
                  onChange={(e) =>
                    setFormData({ ...formData, areaCode: e.target.value })
                  }
                  maxLength={2}
                  onKeyDown={(e) => handleNumericInput(e, 2)}
                  disabled={!isEditing || !canEdit}
                  className="bg-[#212121] border-[#2E2E2E] text-[#E0E0E0] disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
              <div className="w-5/6">
                <Label className="text-[#E0E0E0] mb-2">
                  Telefone <span className="text-red-500">*</span>
                </Label>
                <Input
                  value={formData.number}
                  onChange={(e) =>
                    setFormData({ ...formData, number: e.target.value })
                  }
                  maxLength={9}
                  onKeyDown={(e) => handleNumericInput(e, 9)}
                  disabled={!isEditing || !canEdit}
                  className="bg-[#212121] border-[#2E2E2E] text-[#E0E0E0] disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            <div>
              <Label className="text-[#E0E0E0] mb-2">
                CNAE <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.cnae}
                onValueChange={(value) => {
                  const selected = DDCnaeMcc.find((item) => item.value === value);
                  if (selected) {
                    setFormData({
                      ...formData,
                      cnae: value,
                      mcc: selected.mcc || "",
                    });
                  }
                }}
                disabled={!isEditing || !canEdit}
              >
                <SelectTrigger className="bg-[#212121] border-[#2E2E2E] text-[#E0E0E0] disabled:opacity-50 disabled:cursor-not-allowed">
                  <SelectValue placeholder="Selecione o CNAE" />
                </SelectTrigger>
                <SelectContent className="bg-[#212121] border-[#2E2E2E]">
                  {DDCnaeMcc.map((item) => (
                    <SelectItem key={item.value} value={item.value} className="text-[#E0E0E0] hover:bg-[#2E2E2E]">
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-[#E0E0E0] mb-2">
                Natureza Jurídica <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.idLegalNature?.toString()}
                onValueChange={(value) =>
                  setFormData({ ...formData, idLegalNature: value })
                }
                disabled={!isEditing || !canEdit}
              >
                <SelectTrigger className="bg-[#212121] border-[#2E2E2E] text-[#E0E0E0] disabled:opacity-50 disabled:cursor-not-allowed">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent className="bg-[#212121] border-[#2E2E2E]">
                  {DDLegalNature.map((item) => (
                    <SelectItem
                      key={item.value}
                      value={item.value.toString()}
                      className="text-[#E0E0E0] hover:bg-[#2E2E2E]"
                    >
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-[#E0E0E0] mb-2">
                Tipo de Pessoa <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.legalPerson}
                onValueChange={(value) =>
                  setFormData({ ...formData, legalPerson: value })
                }
                disabled={!isEditing || !canEdit}
              >
                <SelectTrigger className="bg-[#212121] border-[#2E2E2E] text-[#E0E0E0] disabled:opacity-50 disabled:cursor-not-allowed">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent className="bg-[#212121] border-[#2E2E2E]">
                  {legalPersonTypes.map((item) => (
                    <SelectItem key={item.value} value={item.value} className="text-[#E0E0E0] hover:bg-[#2E2E2E]">
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="w-full mt-4 bg-[#1D1D1D] border border-[rgba(255,255,255,0.1)] rounded-[6px]">
        <CardHeader className="flex flex-row items-center justify-between border-b border-[rgba(255,255,255,0.1)]">
          <div className="flex flex-row items-center space-x-2">
            <MapPin className="w-5 h-5 text-[#E0E0E0]" />
            <CardTitle className="text-[#E0E0E0]">Endereço</CardTitle>
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
          <div>
            <Label className="text-[#E0E0E0] mb-2">
              CEP <span className="text-red-500">*</span>
            </Label>
            <Input
              placeholder="Digite o CEP"
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
            <Label className="text-[#E0E0E0] mb-2">
              Rua <span className="text-red-500">*</span>
            </Label>
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
              <Label className="text-[#E0E0E0] mb-2">
                Número <span className="text-red-500">*</span>
              </Label>
              <Input
                value={addressData.number}
                onChange={(e) =>
                  setAddressData({ ...addressData, number: e.target.value })
                }
                maxLength={10}
                onKeyDown={(e) => handleNumericInput(e, 10)}
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
            <Label className="text-[#E0E0E0] mb-2">
              Bairro <span className="text-red-500">*</span>
            </Label>
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
              <Label className="text-[#E0E0E0] mb-2">
                Cidade <span className="text-red-500">*</span>
              </Label>
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
              <Label className="text-[#E0E0E0] mb-2">
                Estado <span className="text-red-500">*</span>
              </Label>
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

          <div>
            <Label className="text-[#E0E0E0] mb-2">
              País <span className="text-red-500">*</span>
            </Label>
            <Input
              value={addressData.country}
              onChange={(e) =>
                setAddressData({ ...addressData, country: e.target.value })
              }
              disabled={!canEdit}
              className="bg-[#212121] border-[#2E2E2E] text-[#E0E0E0] disabled:opacity-50 disabled:cursor-not-allowed"
            />
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

