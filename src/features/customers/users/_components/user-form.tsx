"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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
import { User } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { SchemaUser } from "../schema/schema";
import { useParams } from "next/navigation";
import {
  InsertUser,
  updateUserWithClerk,
  UserDetailForm,
} from "@/features/customers/users/_actions/user-actions";

interface UserFormProps {
  user?: UserDetailForm;
  customerId?: number;
  onSuccess?: () => void;
  profiles?: { id: number; name: string }[];
}

// Definindo um tipo específico para o formulário que satisfaz os requisitos
type FormValues = {
  firstName: string;
  lastName: string;
  email: string;
  idCustomer: number | null;
  idProfile: number | null;
  idAddress: number | null;
  selectedMerchants: string[];
  active: boolean;
  idClerk: string | null;
  slug: string;
};

export default function UserCustomerForm({
  user,
  customerId,
  onSuccess,
}: UserFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const isEditing = !!user?.id;

  const params = useParams();
  const customerIdFromUrl = Number(params?.id); // pega o ID da URL

  const defaultValues: FormValues = {
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    email: user?.email || "",
    idCustomer: user?.idCustomer || customerIdFromUrl || null, // aqui está a modificação
    idProfile: user?.idProfile || null,
    idAddress: user?.idAddress || null,
    selectedMerchants: user?.selectedMerchants || [],
    active: user?.active !== undefined ? Boolean(user.active) : true,
    idClerk: user?.idClerk || null,
    slug: user?.slug || "",
  };

  const form = useForm<FormValues>({
    // @ts-expect-error - funciona, mas tipagem não tá legal
    resolver: zodResolver(SchemaUser),
    defaultValues,
  });

  useEffect(() => {
    // Quando o usuário for carregado ou alterado, atualizar os valores do formulário
    if (user) {
      form.reset({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || "",
        idCustomer: user.idCustomer || customerId || null,
        idAddress: user.idAddress || null,
        idProfile: user.idProfile || null,
        selectedMerchants: user.selectedMerchants || [],
        active: user.active !== undefined ? Boolean(user.active) : true,
        idClerk: user.idClerk || null,
        slug: user.slug || "",
      });
    }
  }, [user, customerId, form]);

  const onSubmit = async (data: FormValues) => {
    setIsLoading(true);
    try {
      if (isEditing && user?.id) {
        await updateUserWithClerk(user.id, {
          ...data,
        });
        toast.success("Usuário atualizado com sucesso");
        if (onSuccess) onSuccess();
      } else {
        await InsertUser({
          ...data,
        });
        toast.success("Usuário criado com sucesso");
        form.reset();
        if (onSuccess) onSuccess();
      }
    } catch (error) {
      console.error("Erro ao salvar usuário:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Ocorreu um erro ao processar a solicitação";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      {/* @ts-expect-error - Funcionalmente correto mas com tipos incompatíveis */}
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card className="border-border bg-card">
          <CardHeader className="border-b border-border">
            <CardTitle className="flex items-center gap-2 text-foreground">
              <User className="h-5 w-5" />
              Criação do Usuário
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                // @ts-expect-error - Funcionalmente correto mas com tipos incompatíveis
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground">
                      Primeiro Nome <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        maxLength={15}
                        placeholder="Digite o primeiro nome"
                        className="bg-background border-border text-foreground placeholder:text-muted-foreground"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                // @ts-expect-error - Funcionalmente correto mas com tipos incompatíveis
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground">
                      Último Nome <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        maxLength={15}
                        placeholder="Digite o último nome"
                        className="bg-background border-border text-foreground placeholder:text-muted-foreground"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                // @ts-expect-error - Funcionalmente correto mas com tipos incompatíveis
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground">
                      E-mail <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        maxLength={100}
                        type="email"
                        placeholder="Digite o e-mail"
                        className="bg-background border-border text-foreground placeholder:text-muted-foreground"
                        {...field}
                        disabled={isEditing}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              // @ts-expect-error - Funcionalmente correto mas com tipos incompatíveis
              control={form.control}
              name="active"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 mt-6">
                  <FormControl>
                    <Checkbox
                      checked={Boolean(field.value)}
                      onCheckedChange={field.onChange}
                      className="cursor-pointer"
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel className="text-foreground">
                      Usuário Ativo
                    </FormLabel>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <div className="flex justify-end space-x-2 mr-4 mt-2">
            <Button
              type="submit"
              className="cursor-pointer"
              disabled={isLoading}
            >
              {isLoading ? "Salvando..." : isEditing ? "Atualizar" : "Criar"}
            </Button>
          </div>
        </Card>
      </form>
    </Form>
  );
}
