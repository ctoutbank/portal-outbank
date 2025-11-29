"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Settings } from "lucide-react";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { SalesAgentDropdown } from "../server/merchant-helpers";
import { timezones } from "@/lib/lookuptables/lookuptables";
import {
  insertConfigurationFormAction,
  updateConfigurationFormAction,
} from "../_actions/configuration-formActions";
import { db } from "@/lib/db";
import { eq } from "drizzle-orm";
import { merchants } from "../../../../drizzle/schema";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { canEditMerchant } from "../_utils/can-edit";

interface MerchantProps {
  Configuration: any;
  hasTaf: boolean;
  hastop: boolean;
  hasPix: boolean;
  merhcnatSlug: string;
  timezone: string;
  idMerchant: number;
  idSalesAgent: number | null;
  setActiveTab: (tab: string) => void;
  activeTab: string;
  permissions: string[];
  idConfiguration?: number;
  DDSalesAgent: SalesAgentDropdown[];
  isSuperAdmin?: boolean;
}

export default function MerchantFormOperations({
  Configuration,
  hasTaf,
  hastop,
  hasPix,
  timezone,
  idMerchant,
  setActiveTab,
  activeTab,
  permissions,
  idConfiguration,
  DDSalesAgent,
  idSalesAgent,
  isSuperAdmin = false,
}: MerchantProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const canEdit = canEditMerchant(permissions, isSuperAdmin);

  const [formData, setFormData] = useState({
    hasTef: hasTaf,
    hasTop: hastop,
    hasPix: hasPix,
    timezone: timezone || "-0300",
    idSalesAgent: idSalesAgent || null,
    url: Configuration?.url || "",
    lockCpAnticipationOrder: Configuration?.lockCpAnticipationOrder || false,
    lockCnpAnticipationOrder: Configuration?.lockCnpAnticipationOrder || false,
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
      // Salvar configuração
      const configData = {
        id: idConfiguration,
        slug: Configuration?.slug || "",
        active: Configuration?.active ?? true,
        lockCpAnticipationOrder: formData.lockCpAnticipationOrder,
        lockCnpAnticipationOrder: formData.lockCnpAnticipationOrder,
        url: formData.url,
        anticipationRiskFactorCp: "0",
        anticipationRiskFactorCnp: "0",
        waitingPeriodCp: "0",
        waitingPeriodCnp: "0",
      };

      let configId = idConfiguration;
      if (configId) {
        await updateConfigurationFormAction(configData);
      } else {
        configId = await insertConfigurationFormAction(configData);
      }

      // Atualizar merchant com hasTef, hasTop, hasPix, timezone, idSalesAgent, idConfiguration
      await db
        .update(merchants)
        .set({
          hasTef: formData.hasTef,
          hasTop: formData.hasTop,
          hasPix: formData.hasPix,
          timezone: formData.timezone,
          idSalesAgent: formData.idSalesAgent,
          idConfiguration: configId,
        })
        .where(eq(merchants.id, idMerchant));

      toast.success("Configurações salvas com sucesso!");
      refreshPage(idMerchant);
    } catch (error) {
      console.error("Erro ao salvar:", error);
      toast.error("Erro ao salvar as configurações");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card className="w-full bg-[#1D1D1D] border border-[rgba(255,255,255,0.1)] rounded-[6px]">
        <CardHeader className="flex flex-row items-center space-x-2 border-b border-[rgba(255,255,255,0.1)]">
          <Settings className="w-5 h-5 text-[#E0E0E0]" />
          <CardTitle className="text-[#E0E0E0]">Dados de Operação</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 p-6">
          <div className="grid grid-cols-3 gap-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="hasTef"
                checked={formData.hasTef}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, hasTef: checked as boolean })
                }
                disabled={!canEdit}
                className="disabled:opacity-50"
              />
              <Label htmlFor="hasTef" className="text-[#E0E0E0]">Terminal TEF</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="hasTop"
                checked={formData.hasTop}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, hasTop: checked as boolean })
                }
                disabled={!canEdit}
                className="disabled:opacity-50"
              />
              <Label htmlFor="hasTop" className="text-[#E0E0E0]">Terminal Tap On Phone</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="hasPix"
                checked={formData.hasPix}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, hasPix: checked as boolean })
                }
                disabled={!canEdit}
                className="disabled:opacity-50"
              />
              <Label htmlFor="hasPix" className="text-[#E0E0E0]">Pix</Label>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-[#E0E0E0]">Timezone</Label>
              <Select
                value={formData.timezone}
                onValueChange={(value) =>
                  setFormData({ ...formData, timezone: value })
                }
                disabled={!canEdit}
              >
                <SelectTrigger className="bg-[#212121] border-[#2E2E2E] text-[#E0E0E0] disabled:opacity-50 disabled:cursor-not-allowed">
                  <SelectValue placeholder="Selecione o timezone" />
                </SelectTrigger>
                <SelectContent className="bg-[#212121] border-[#2E2E2E]">
                  {timezones.map((tz) => (
                    <SelectItem key={tz.value} value={tz.value} className="text-[#E0E0E0] hover:bg-[#2E2E2E]">
                      {tz.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-[#E0E0E0]">Consultor de Vendas</Label>
              <Select
                value={formData.idSalesAgent?.toString() || ""}
                onValueChange={(value) =>
                  setFormData({ ...formData, idSalesAgent: Number(value) || null })
                }
                disabled={!canEdit}
              >
                <SelectTrigger className="bg-[#212121] border-[#2E2E2E] text-[#E0E0E0] disabled:opacity-50 disabled:cursor-not-allowed">
                  <SelectValue placeholder="Selecione o consultor" />
                </SelectTrigger>
                <SelectContent className="bg-[#212121] border-[#2E2E2E]">
                  {DDSalesAgent.map((agent) => (
                    <SelectItem
                      key={agent.value}
                      value={agent.value.toString()}
                      className="text-[#E0E0E0] hover:bg-[#2E2E2E]"
                    >
                      {agent.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label className="text-[#E0E0E0]">URL</Label>
            <Input
              value={formData.url}
              onChange={(e) =>
                setFormData({ ...formData, url: e.target.value })
              }
              placeholder="https://exemplo.com"
              disabled={!canEdit}
              className="bg-[#212121] border-[#2E2E2E] text-[#E0E0E0] disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
        </CardContent>
      </Card>

      {canEdit && (
        <div className="flex justify-end mt-4">
          <Button 
            type="submit" 
            disabled={isSubmitting} 
            className="px-6 bg-[#212121] border border-[#2E2E2E] hover:bg-[#2E2E2E] text-[#E0E0E0] rounded-[6px]"
          >
            {isSubmitting ? "Salvando..." : "Avançar"}
          </Button>
        </div>
      )}
    </form>
  );
}

