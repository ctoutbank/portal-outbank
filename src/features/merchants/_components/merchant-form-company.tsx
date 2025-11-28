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
import { Building2, MapPin } from "lucide-react";
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
}: MerchantProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      <Card className="w-full">
        <CardHeader className="flex flex-row items-center space-x-2">
          <Building2 className="w-5 h-5" />
          <CardTitle>Empresa</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>
                CNPJ <span className="text-red-500">*</span>
              </Label>
              <Input
                value={formData.idDocument ? formatCNPJ(formData.idDocument) : ""}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, "");
                  setFormData({ ...formData, idDocument: value });
                }}
                maxLength={18}
              />
            </div>

            <div>
              <Label>
                Email <span className="text-red-500">*</span>
              </Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>
                Razão Social <span className="text-red-500">*</span>
              </Label>
              <Input
                value={formData.corporateName}
                onChange={(e) =>
                  setFormData({ ...formData, corporateName: e.target.value })
                }
              />
            </div>

            <div>
              <Label>
                Nome Fantasia <span className="text-red-500">*</span>
              </Label>
              <Input
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex gap-2">
              <div className="w-1/6">
                <Label>
                  DDD <span className="text-red-500">*</span>
                </Label>
                <Input
                  value={formData.areaCode}
                  onChange={(e) =>
                    setFormData({ ...formData, areaCode: e.target.value })
                  }
                  maxLength={2}
                  onKeyDown={(e) => handleNumericInput(e, 2)}
                />
              </div>
              <div className="w-5/6">
                <Label>
                  Telefone <span className="text-red-500">*</span>
                </Label>
                <Input
                  value={formData.number}
                  onChange={(e) =>
                    setFormData({ ...formData, number: e.target.value })
                  }
                  maxLength={9}
                  onKeyDown={(e) => handleNumericInput(e, 9)}
                />
              </div>
            </div>

            <div>
              <Label>
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
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o CNAE" />
                </SelectTrigger>
                <SelectContent>
                  {DDCnaeMcc.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>
                Natureza Jurídica <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.idLegalNature?.toString()}
                onValueChange={(value) =>
                  setFormData({ ...formData, idLegalNature: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {DDLegalNature.map((item) => (
                    <SelectItem
                      key={item.value}
                      value={item.value.toString()}
                    >
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>
                Tipo de Pessoa <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.legalPerson}
                onValueChange={(value) =>
                  setFormData({ ...formData, legalPerson: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {legalPersonTypes.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="w-full mt-4">
        <CardHeader className="flex flex-row items-center space-x-2">
          <MapPin className="w-5 h-5" />
          <CardTitle>Endereço</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>
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
            />
          </div>

          <div>
            <Label>
              Rua <span className="text-red-500">*</span>
            </Label>
            <Input
              value={addressData.street}
              onChange={(e) =>
                setAddressData({ ...addressData, street: e.target.value })
              }
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>
                Número <span className="text-red-500">*</span>
              </Label>
              <Input
                value={addressData.number}
                onChange={(e) =>
                  setAddressData({ ...addressData, number: e.target.value })
                }
                maxLength={10}
                onKeyDown={(e) => handleNumericInput(e, 10)}
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
            <Label>
              Bairro <span className="text-red-500">*</span>
            </Label>
            <Input
              value={addressData.neighborhood}
              onChange={(e) =>
                setAddressData({ ...addressData, neighborhood: e.target.value })
              }
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>
                Cidade <span className="text-red-500">*</span>
              </Label>
              <Input
                value={addressData.city}
                onChange={(e) =>
                  setAddressData({ ...addressData, city: e.target.value })
                }
              />
            </div>

            <div>
              <Label>
                Estado <span className="text-red-500">*</span>
              </Label>
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

          <div>
            <Label>
              País <span className="text-red-500">*</span>
            </Label>
            <Input
              value={addressData.country}
              onChange={(e) =>
                setAddressData({ ...addressData, country: e.target.value })
              }
            />
          </div>
        </CardContent>
      </Card>

      {permissions?.includes("Atualizar") && (
        <div className="flex justify-end mt-4">
          <Button type="submit" disabled={isSubmitting} className="px-6">
            {isSubmitting ? "Salvando..." : merchant?.id ? "Atualizar" : "Avançar"}
          </Button>
        </div>
      )}
    </form>
  );
}

