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
import { Badge } from "@/components/ui/badge";
import { zodResolver } from "@hookform/resolvers/zod";
import { User, Building2, Calendar, Mail, Shield } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import {
  InsertUser,
} from "../_actions/users-actions";
import { SchemaUser } from "../schema/schema";
import {useParams} from "next/navigation";
import {updateUser, UserDetailForm} from "@/features/customers/users/_actions/user-actions";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface UserFormProps {
  user?: UserDetailForm;
  customerId?: number;
  onSuccess?: () => void;
  profiles?: { id: number; name: string }[];
  hideWrapper?: boolean;
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
  canViewSensitiveData: boolean;
  idClerk: string | null;
  slug: string;
};

export default function UserCustomerForm({
                                           user,
                                           customerId,
                                           onSuccess,
                                           hideWrapper = false,
                                         }: UserFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const isEditing = !!user?.id;

  const params = useParams();
  const customerIdFromUrl = Number(params?.id); // pega o ID da URL

  const defaultValues: FormValues = {
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    email: user?.email || "",
    idCustomer: user?.idCustomer || customerIdFromUrl || null,
    idProfile: user?.idProfile || null,
    idAddress: user?.idAddress || null,
    selectedMerchants: user?.selectedMerchants || [],
    active: user?.active !== undefined ? Boolean(user.active) : true,
    canViewSensitiveData: user?.canViewSensitiveData !== undefined ? Boolean(user.canViewSensitiveData) : true,
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
        canViewSensitiveData: user.canViewSensitiveData !== undefined ? Boolean(user.canViewSensitiveData) : true,
        idClerk: user.idClerk || null,
        slug: user.slug || "",
      });
    }
  }, [user, customerId, form]);


  const onSubmit = async (data: FormValues) => {
    setIsLoading(true);
    try {
      if (isEditing && user?.id) {
        await updateUser(user.id, {
          ...data,
        });
        toast.success("Usuário atualizado com sucesso");
        if (onSuccess) onSuccess();
      } else {
        const result = await InsertUser({
          ...data,
        });
        
        if (!result) {
          toast.error("Erro ao criar usuário. Tente novamente.");
          return;
        }
        
        if (result.ok) {
          if (result.reused) {
            toast.success("Usuário vinculado com sucesso ao ISO");
          } else {
            toast.success("Usuário criado com sucesso");
          }
          form.reset();
          if (onSuccess) onSuccess();
        } else {
          toast.error(result.message);
        }
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

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "-";
    try {
      return format(new Date(dateString), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
    } catch {
      return "-";
    }
  };

  const formFields = (
    <>
      {isEditing && user && (
        <div className="p-4 bg-black rounded-lg border border-[#2E2E2E] mb-6">
          <h3 className="text-sm font-medium text-[#E0E0E0] mb-3">Informações do Usuário</h3>
          <div className="grid grid-cols-2 gap-y-3 gap-x-6 text-sm">
            <div>
              <span className="text-[#A0A0A0] block text-xs mb-1">Email</span>
              <span className="text-[#E0E0E0]">{user.email || "-"}</span>
            </div>
            <div>
              <span className="text-[#A0A0A0] block text-xs mb-1">Categoria</span>
              <Badge variant="outline" className="border-[#2E2E2E] text-[#E0E0E0] bg-[#2E2E2E]">
                <Building2 className="h-3 w-3 mr-1" />
                ISO Admin
              </Badge>
            </div>
            <div>
              <span className="text-[#A0A0A0] block text-xs mb-1">ISO Vinculado</span>
              <span className="text-[#E0E0E0]">{user.customerName || "-"}</span>
            </div>
            <div>
              <span className="text-[#A0A0A0] block text-xs mb-1">Criado em</span>
              <span className="text-[#E0E0E0]">{formatDate(user.dtinsert)}</span>
            </div>
            {user.dtupdate && user.dtupdate !== user.dtinsert && (
              <div>
                <span className="text-[#A0A0A0] block text-xs mb-1">Atualizado em</span>
                <span className="text-[#E0E0E0]">{formatDate(user.dtupdate)}</span>
              </div>
            )}
          </div>
        </div>
      )}
      
      <div className="space-y-4">
        {isEditing && <h3 className="text-sm font-medium text-[#E0E0E0]">Dados do Usuário</h3>}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <FormField
          // @ts-expect-error - Funcionalmente correto mas com tipos incompatíveis
          control={form.control}
          name="firstName"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[#E0E0E0]">
                Primeiro Nome <span className="text-[#A0A0A0]">*</span>
              </FormLabel>
              <FormControl>
                <Input
                  maxLength={15}
                  placeholder="Digite o primeiro nome"
                  className="bg-[#212121] border-[#2E2E2E] text-[#E0E0E0] placeholder:text-[#707070] focus:border-[#404040] focus-visible:ring-[#404040]/50"
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
              <FormLabel className="text-[#E0E0E0]">
                Último Nome <span className="text-[#A0A0A0]">*</span>
              </FormLabel>
              <FormControl>
                <Input
                  maxLength={15}
                  placeholder="Digite o último nome"
                  className="bg-[#212121] border-[#2E2E2E] text-[#E0E0E0] placeholder:text-[#707070] focus:border-[#404040] focus-visible:ring-[#404040]/50"
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
              <FormLabel className="text-[#E0E0E0]">
                E-mail <span className="text-[#A0A0A0]">*</span>
              </FormLabel>
              <FormControl>
                <Input
                  maxLength={100}
                  type="email"
                  placeholder="Digite o e-mail"
                  className="bg-[#212121] border-[#2E2E2E] text-[#E0E0E0] placeholder:text-[#707070] focus:border-[#404040] focus-visible:ring-[#404040]/50 disabled:opacity-60 disabled:bg-[#1A1A1A]"
                  {...field}
                  disabled={isEditing}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        </div>
      </div>

      <div className="space-y-4 pt-2">
        <h3 className="text-sm font-medium text-[#E0E0E0]">Permissões e Status</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            // @ts-expect-error - Funcionalmente correto mas com tipos incompatíveis
            control={form.control}
            name="active"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center space-x-3">
                <FormControl>
                  <Checkbox
                    checked={Boolean(field.value)}
                    onCheckedChange={field.onChange}
                    className="cursor-pointer border-[#404040] data-[state=checked]:bg-[#404040]"
                  />
                </FormControl>
                <FormLabel className="text-[#E0E0E0] font-normal">
                  Usuário Ativo
                </FormLabel>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            // @ts-expect-error - Funcionalmente correto mas com tipos incompatíveis
            control={form.control}
            name="canViewSensitiveData"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center space-x-3">
                <FormControl>
                  <Checkbox
                    checked={Boolean(field.value)}
                    onCheckedChange={field.onChange}
                    className="cursor-pointer border-[#404040] data-[state=checked]:bg-[#404040]"
                  />
                </FormControl>
                <FormLabel className="text-[#E0E0E0] font-normal">
                  Visualizar Dados Sensíveis
                </FormLabel>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>
    </>
  );

  if (hideWrapper) {
    return (
      <Form {...form}>
        {/* @ts-expect-error - Funcionalmente correto mas com tipos incompatíveis */}
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {formFields}
          <div className="flex justify-end pt-4 border-t border-[#2E2E2E]">
            <Button 
              type="submit" 
              variant="outline"
              className="cursor-pointer border-[#2E2E2E] text-[#E0E0E0] hover:bg-[#2E2E2E]" 
              disabled={isLoading}
            >
              {isLoading ? "Salvando..." : isEditing ? "Atualizar" : "Criar Usuário"}
            </Button>
          </div>
        </form>
      </Form>
    );
  }

  return (
    <Form {...form}>
      {/* @ts-expect-error - Funcionalmente correto mas com tipos incompatíveis */}
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card className="border-border bg-card">
          <CardHeader className="border-b border-border">
            <CardTitle className="flex items-center gap-2 text-foreground">
              <User className="h-5 w-5 text-muted-foreground" />
              {isEditing ? "Editar Usuário" : "Novo Usuário"}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            {formFields}
          </CardContent>
          <div className="flex justify-end space-x-2 mr-4 mt-2 pb-4">
            <Button 
              type="submit" 
              variant="outline"
              className="cursor-pointer" 
              disabled={isLoading}
            >
              {isLoading ? "Salvando..." : isEditing ? "Atualizar" : "Criar Usuário"}
            </Button>
          </div>
        </Card>
      </form>
    </Form>
  );
}
