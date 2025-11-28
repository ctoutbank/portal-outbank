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
import { Landmark } from "lucide-react";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { accountTypes } from "@/lib/lookuptables/lookuptables";
import { handleNumericInput } from "@/lib/utils";
import { banckDropdown, accountTypeDropdown } from "../server/merchant-pix-account";
import {
  insertMerchantBankAccountFormAction,
  updateMerchantBankAccountFormAction,
} from "../_actions/merchantBankAccount-formActions";
import {
  insertMerchantPixAccountFormAction,
  updateMerchantPixAccountFormAction,
} from "../_actions/merchantPixAccount-formActions";

interface MerchantProps {
  merchantBankAccount: any;
  merchantcorporateName: string;
  merchantdocumentId: string;
  activeTab: string;
  idMerchant: number;
  DDBank: banckDropdown[];
  setActiveTab: (tab: string) => void;
  permissions: string[];
  accountTypeDD: accountTypeDropdown[];
  hasPix?: boolean;
  merchantpixaccount?: any;
}

export default function MerchantFormBankAccount({
  merchantBankAccount,
  idMerchant,
  setActiveTab,
  activeTab,
  DDBank,
  permissions,
  merchantcorporateName,
  merchantdocumentId,
  accountTypeDD,
  hasPix = false,
  merchantpixaccount,
}: MerchantProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    documentId: merchantBankAccount?.documentId || merchantdocumentId || "",
    corporateName: merchantBankAccount?.corporateName || merchantcorporateName || "",
    legalPerson: merchantBankAccount?.legalPerson || "JURIDICAL",
    bankBranchNumber: merchantBankAccount?.bankBranchNumber || "",
    bankBranchCheckDigit: merchantBankAccount?.bankBranchCheckDigit || "",
    accountNumber: merchantBankAccount?.accountNumber || "",
    accountNumberCheckDigit: merchantBankAccount?.accountNumberCheckDigit || "",
    accountType: merchantBankAccount?.accountType || "CHECKING",
    compeCode: merchantBankAccount?.compeCode || "",
  });

  const [pixData, setPixData] = useState({
    bankNumber: merchantpixaccount?.bankNumber || "",
    bankBranchNumber: merchantpixaccount?.bankBranchNumber || "",
    bankBranchDigit: merchantpixaccount?.bankBranchDigit || "",
    bankAccountNumber: merchantpixaccount?.bankAccountNumber || "",
    bankAccountDigit: merchantpixaccount?.bankAccountDigit || "",
    bankAccountType: merchantpixaccount?.bankAccountType || "",
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
      // Salvar conta bancária
      const bankAccountData = {
        ...formData,
        id: merchantBankAccount?.id,
        idMerchant: idMerchant,
        dtinsert: merchantBankAccount?.dtinsert
          ? new Date(merchantBankAccount.dtinsert)
          : undefined,
        dtupdate: merchantBankAccount?.dtupdate
          ? new Date(merchantBankAccount.dtupdate)
          : undefined,
        active: merchantBankAccount?.active ?? true,
        slug: merchantBankAccount?.slug || "",
      };

      if (merchantBankAccount?.id) {
        await updateMerchantBankAccountFormAction(bankAccountData);
      } else {
        await insertMerchantBankAccountFormAction(bankAccountData);
      }

      // Se tem PIX, salvar conta PIX
      if (hasPix) {
        const pixAccountData = {
          ...pixData,
          id: merchantpixaccount?.id,
          idMerchant: idMerchant,
          dtinsert: merchantpixaccount?.dtinsert
            ? new Date(merchantpixaccount.dtinsert)
            : undefined,
          dtupdate: merchantpixaccount?.dtupdate
            ? new Date(merchantpixaccount.dtupdate)
            : undefined,
          active: merchantpixaccount?.active ?? true,
          slug: merchantpixaccount?.slug || "",
        };

        if (merchantpixaccount?.id) {
          await updateMerchantPixAccountFormAction(pixAccountData);
        } else {
          await insertMerchantPixAccountFormAction(pixAccountData);
        }
      }

      toast.success("Dados bancários salvos com sucesso!");
      refreshPage(idMerchant);
    } catch (error) {
      console.error("Erro ao salvar:", error);
      toast.error("Erro ao salvar os dados bancários");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card className="w-full">
        <CardHeader className="flex flex-row items-center space-x-2">
          <Landmark className="w-5 h-5" />
          <CardTitle>Dados Bancários</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Banco</Label>
              <Select
                value={formData.compeCode}
                onValueChange={(value) =>
                  setFormData({ ...formData, compeCode: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o banco" />
                </SelectTrigger>
                <SelectContent>
                  {DDBank.map((bank) => (
                    <SelectItem key={bank.value} value={bank.value}>
                      {bank.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Tipo de Conta</Label>
              <Select
                value={formData.accountType}
                onValueChange={(value) =>
                  setFormData({ ...formData, accountType: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  {accountTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex gap-2">
              <div className="w-4/5">
                <Label>Agência</Label>
                <Input
                  value={formData.bankBranchNumber}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      bankBranchNumber: e.target.value,
                    })
                  }
                  maxLength={10}
                  onKeyDown={(e) => handleNumericInput(e, 10)}
                />
              </div>
              <div className="w-1/5">
                <Label>DV</Label>
                <Input
                  value={formData.bankBranchCheckDigit}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      bankBranchCheckDigit: e.target.value,
                    })
                  }
                  maxLength={1}
                  onKeyDown={(e) => handleNumericInput(e, 1)}
                />
              </div>
            </div>

            <div className="flex gap-2">
              <div className="w-4/5">
                <Label>Conta</Label>
                <Input
                  value={formData.accountNumber}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      accountNumber: e.target.value,
                    })
                  }
                  maxLength={10}
                  onKeyDown={(e) => handleNumericInput(e, 10)}
                />
              </div>
              <div className="w-1/5">
                <Label>DV</Label>
                <Input
                  value={formData.accountNumberCheckDigit}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      accountNumberCheckDigit: e.target.value,
                    })
                  }
                  maxLength={1}
                  onKeyDown={(e) => handleNumericInput(e, 1)}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {hasPix && (
        <Card className="w-full mt-4">
          <CardHeader>
            <CardTitle>Conta PIX</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Banco</Label>
                <Select
                  value={pixData.bankNumber}
                  onValueChange={(value) =>
                    setPixData({ ...pixData, bankNumber: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o banco" />
                  </SelectTrigger>
                  <SelectContent>
                    {DDBank.map((bank) => (
                      <SelectItem key={bank.value} value={bank.value}>
                        {bank.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Tipo de Conta</Label>
                <Select
                  value={pixData.bankAccountType}
                  onValueChange={(value) =>
                    setPixData({ ...pixData, bankAccountType: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {accountTypeDD.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex gap-2">
                <div className="w-4/5">
                  <Label>Agência</Label>
                  <Input
                    value={pixData.bankBranchNumber}
                    onChange={(e) =>
                      setPixData({
                        ...pixData,
                        bankBranchNumber: e.target.value,
                      })
                    }
                    maxLength={10}
                    onKeyDown={(e) => handleNumericInput(e, 10)}
                  />
                </div>
                <div className="w-1/5">
                  <Label>DV</Label>
                  <Input
                    value={pixData.bankBranchDigit}
                    onChange={(e) =>
                      setPixData({ ...pixData, bankBranchDigit: e.target.value })
                    }
                    maxLength={1}
                    onKeyDown={(e) => handleNumericInput(e, 1)}
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <div className="w-4/5">
                  <Label>Conta</Label>
                  <Input
                    value={pixData.bankAccountNumber}
                    onChange={(e) =>
                      setPixData({
                        ...pixData,
                        bankAccountNumber: e.target.value,
                      })
                    }
                    maxLength={10}
                    onKeyDown={(e) => handleNumericInput(e, 10)}
                  />
                </div>
                <div className="w-1/5">
                  <Label>DV</Label>
                  <Input
                    value={pixData.bankAccountDigit}
                    onChange={(e) =>
                      setPixData({ ...pixData, bankAccountDigit: e.target.value })
                    }
                    maxLength={1}
                    onKeyDown={(e) => handleNumericInput(e, 1)}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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

