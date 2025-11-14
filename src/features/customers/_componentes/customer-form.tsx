"use client";

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
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { CustomerSchema, SchemaCustomer } from "../schema/schema";
import { updateCustomer } from "../server/customers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { generateSlug } from "@/lib/utils";
import { insertCustomerFormAction } from "../_actions/customers-formActions";
import { Building2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface CustomerFormProps {
  customer?: CustomerSchema;
  onSuccess?: (id: number) => void;
  hideWrapper?: boolean;
  subdomain?: string;
  onSubdomainChange?: (subdomain: string) => void;
  nameValue?: string;
  onNameChange?: (name: string) => void;
  subdomainValue?: string;
  slugValue?: string;
  onSlugChange?: (slug: string) => void;
  showSubmitButton?: boolean;
}

export default function CustomerFormm({
  customer,
  onSuccess,
  hideWrapper = false,
  subdomain = "",
  onSubdomainChange,
  nameValue,
  onNameChange,
  subdomainValue,
  slugValue,
  onSlugChange,
  showSubmitButton = true,
}: CustomerFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const isEditing = !!customer?.id;
  const router = useRouter();

  const form = useForm<CustomerSchema>({
    resolver: zodResolver(SchemaCustomer),
    defaultValues: {
      id: customer?.id,
      slug: customer?.slug || "",
      name: customer?.name || "",
      customerId: customer?.customerId || "",
      settlementManagementType: customer?.settlementManagementType || "",
    },
  });

  const onSubmit = async (data: CustomerSchema) => {
    setIsLoading(true);
    try {
      if (isEditing && customer?.id) {
        const updatedId = await updateCustomer(data);
        toast.success("Cliente atualizado com sucesso");

        if (onSuccess) onSuccess(updatedId);
        if (!hideWrapper) {
          router.push(`/customers/${updatedId}`);
        }
      } else {
        const slug = generateSlug();

        const customerDataFixed = {
          slug: slug || "",
          name: data.name,
          customerId: data.customerId || undefined,
          settlementManagementType: data.settlementManagementType || undefined,
          idParent: customer?.idParent || undefined,
          id: customer?.id || undefined,
        };

        const newId = await insertCustomerFormAction(customerDataFixed);
        toast.success("Cliente criado com sucesso");

        if (newId !== null && newId !== undefined) {
          if (onSuccess) onSuccess(newId);
          if (!hideWrapper) {
            router.push(`/customers/${newId}?step=step2`);
          }
        }
      }
    } catch (error) {
      console.error("Erro ao salvar cliente:", error);
      toast.error("Ocorreu um erro ao processar a solicitação");
    } finally {
      setIsLoading(false);
    }
  };

  const effectiveSlugValue = slugValue !== undefined ? slugValue : subdomainValue;
  const effectiveOnSlugChange = onSlugChange || onSubdomainChange;

  const formFields = (
    <div className="grid grid-cols-1 gap-4">
      {hideWrapper && nameValue !== undefined && onNameChange ? (
        <div>
          <FormLabel>
            Nome do ISO <span className="text-destructive">*</span>
          </FormLabel>
          <Input
            value={nameValue}
            onChange={(e) => {
              const sanitized = e.target.value.replace(
                /[^a-zA-Z0-9À-ÿ\s]/g,
                ""
              );
              onNameChange(sanitized);
            }}
            placeholder="Nome do cliente"
            maxLength={200}
            className="w-full"
          />
        </div>
      ) : (
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Nome do ISO <span className="text-destructive">*</span>
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="Nome do cliente"
                  maxLength={200}
                  {...field}
                  onChange={(e) => {
                    const sanitized = e.target.value.replace(
                      /[^a-zA-Z0-9À-ÿ\s]/g,
                      ""
                    );
                    field.onChange(sanitized);
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      {hideWrapper && effectiveSlugValue !== undefined && effectiveOnSlugChange ? (
        <div>
          <FormLabel>
            Domínio do ISO <span className="text-destructive">*</span>
          </FormLabel>
          <Input
            value={effectiveSlugValue}
            onChange={(e) => {
              const sanitized = e.target.value
                .toLowerCase()
                .replace(/[^a-z0-9-]/g, "");
              effectiveOnSlugChange(sanitized);
            }}
            placeholder="meudominio"
            maxLength={63}
            className="w-full"
          />
          <p className="text-xs text-muted-foreground mt-1">
            {effectiveSlugValue || "meudominio"}.consolle.one
          </p>
        </div>
      ) : hideWrapper && (
        <div>
          <FormLabel>
            Domínio do ISO <span className="text-destructive">*</span>
          </FormLabel>
          <Input
            value={subdomain}
            onChange={(e) => {
              const sanitized = e.target.value
                .toLowerCase()
                .replace(/[^a-z0-9-]/g, "");
              if (onSubdomainChange) {
                onSubdomainChange(sanitized);
              }
            }}
            placeholder="meudominio"
            maxLength={63}
            className="w-full"
          />
          <p className="text-xs text-muted-foreground mt-1">
            {subdomain || "meudominio"}.consolle.one
          </p>
        </div>
      )}
    </div>
  );

  if (hideWrapper) {
    if (!showSubmitButton) {
      return <div className="space-y-4">{formFields}</div>;
    }
    
    return (
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {formFields}
          <div className="flex justify-end space-x-2 mt-4">
            <Button
              type="submit"
              disabled={isLoading}
              className="cursor-pointer"
            >
              {isLoading ? "Salvando..." : isEditing ? "Atualizar" : "Criar"}
            </Button>
          </div>
        </form>
      </Form>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <Card className="shadow-sm">
          <CardHeader className="border-b border-border">
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Building2 className="h-5 w-5" />
              Criação do ISO
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            {formFields}

            <div className="flex justify-end space-x-2 mt-4">
              <Button
                type="submit"
                disabled={isLoading}
                className="cursor-pointer"
              >
                {isLoading ? "Salvando..." : isEditing ? "Atualizar" : "Criar"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </Form>
  );
}
