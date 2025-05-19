"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { SchemaSolicitationFee, SolicitationFeeSchema } from "../schema/schema";
import { insertSolicitationFeeFormAction, updateSolicitationFeeFormAction } from "../_actions/solicitationfee-formActions";
import { SolicitationFeeDetail } from "../server/solicitationfee";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useEffect, useState } from "react";
import { getCustomers } from "@/features/customers/server/customers";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import SolicitationFeeCard from "@/features/solicitationfee/_componentes/solicitationfee-card";

interface SolicitationFeeProps {
  solicitationFee?: SolicitationFeeDetail;
}

export default function SolicitationFeeForm({ solicitationFee }: SolicitationFeeProps) {
  const router = useRouter();
  const [customers, setCustomers] = useState<{ id: number; name: string }[]>([]);

  useEffect(() => {
    const fetchCustomers = async () => {
      const result = await getCustomers();
      setCustomers(result.customers);
    };
    fetchCustomers();
  }, []);

  const form = useForm<SolicitationFeeSchema>({
    resolver: zodResolver(SchemaSolicitationFee),
    defaultValues: {
      id: solicitationFee?.id,
      slug: solicitationFee?.slug || "",
      cnae: solicitationFee?.cnae || "",
      idCustomers: solicitationFee?.idCustomers || undefined,
      mcc: solicitationFee?.mcc || "",
      cnpjQuantity: solicitationFee?.cnpjQuantity || undefined,
      monthlyPosFee: solicitationFee?.monthlyPosFee ? Number(solicitationFee.monthlyPosFee) : undefined,
      averageTicket: solicitationFee?.averageTicket ? Number(solicitationFee.averageTicket) : undefined,
      description: solicitationFee?.description || "",
      cnaeInUse: solicitationFee?.cnaeInUse || false,
      status: solicitationFee?.status || "Pendente",
    },
  });

  async function onSubmit(values: SolicitationFeeSchema) {
    try {
      if (solicitationFee?.id) {
        await updateSolicitationFeeFormAction(values);
      } else {
        await insertSolicitationFeeFormAction(values);
      }
      router.push("/solicitationfee");
      router.refresh();
    } catch (error) {
      console.error("Erro ao enviar formulário:", error);
    }
  }

  return (
    <div className="w-full max-w-4xl">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="cnae"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>CNAE</FormLabel>
                  <FormControl>
                    <Input placeholder="CNAE" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="idCustomers"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cliente</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(Number(value))}
                    value={field.value?.toString()}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um cliente" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {customers.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id.toString()}>
                          {customer.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="mcc"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>MCC</FormLabel>
                  <FormControl>
                    <Input placeholder="MCC" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="cnpjQuantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quantidade de CNPJ</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      placeholder="Quantidade de CNPJ" 
                      {...field}
                      onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="monthlyPosFee"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tarifa Mensal POS</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      step="0.01"
                      placeholder="Tarifa Mensal POS" 
                      {...field}
                      onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="averageTicket"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ticket Médio</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      step="0.01"
                      placeholder="Ticket Médio" 
                      {...field}
                      onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Pendente">Pendente</SelectItem>
                      <SelectItem value="Aprovado">Aprovado</SelectItem>
                      <SelectItem value="Rejeitado">Rejeitado</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="cnaeInUse"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">CNAE em Uso</FormLabel>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Descrição</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Descrição"
                    className="resize-none"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit">
            {solicitationFee?.id ? "Atualizar" : "Cadastrar"}
          </Button>
        </form>
      </Form>
    </div>
  );
} 