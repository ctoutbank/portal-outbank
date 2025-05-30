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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { zodResolver } from "@hookform/resolvers/zod";
import { Lock, Mail, User, UserCog } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { InsertUser, UserDetailForm, updateUserWithClerk } from "../_actions/user-actions";
import { SchemaUser } from "../schema/schema";

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
  password: string;
  idCustomer: number | null;
  idProfile: number | null;
  idAddress: number | null;
  selectedMerchants: string[];
  fullAccess: boolean;
  active: boolean;
  idClerk: string | null;
  slug: string;
};

export default function UserCustomerForm({ user, customerId, onSuccess, profiles = [] }: UserFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const isEditing = !!user?.id;

  // Definir valores padrão
  const defaultValues: FormValues = {
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    email: user?.email || "",
    password: "",
    idCustomer: user?.idCustomer || customerId || null,
    idProfile: user?.idProfile || null,
    idAddress: user?.idAddress || null,
    selectedMerchants: user?.selectedMerchants || [],
    fullAccess: user?.fullAccess || false,
    active: user?.active !== undefined ? Boolean(user.active) : true,
    idClerk: user?.idClerk || null,
    slug: user?.slug || "",
  };


  const form = useForm<FormValues>({
    // @ts-expect-error - O zodResolver funciona corretamente aqui, mas os tipos são incompatíveis
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
        password: "",
        idCustomer: user.idCustomer || customerId || null,
        idProfile: user.idProfile || null,
        idAddress: user.idAddress || null,
        selectedMerchants: user.selectedMerchants || [],
        fullAccess: user.fullAccess || false,
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
          password: data.password || "",
        });
        toast.success("Usuário atualizado com sucesso");
        if (onSuccess) onSuccess();
      } else {
        await InsertUser({
          ...data,
          password: data.password || "",
        });
        toast.success("Usuário criado com sucesso");
        form.reset();
        if (onSuccess) onSuccess();
      }
    } catch (error) {
      console.error("Erro ao salvar usuário:", error);
      const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro ao processar a solicitação";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      {/* @ts-expect-error - Funcionalmente correto mas com tipos incompatíveis */}
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-xl flex items-center">
              <User className="h-5 w-5 mr-2 text-primary" />
              Informações do Usuário
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                // @ts-expect-error - Funcionalmente correto mas com tipos incompatíveis
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center">
                      Primeiro Nome{" "}
                      <span className="text-destructive ml-1">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Digite o primeiro nome" {...field} />
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
                    <FormLabel className="flex items-center">
                      Último Nome{" "}
                      <span className="text-destructive ml-1">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Digite o último nome" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                // @ts-expect-error - Funcionalmente correto mas com tipos incompatíveis
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center">
                      <Mail className="h-4 w-4 mr-1" />
                      E-mail <span className="text-destructive ml-1">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Digite o e-mail" 
                        {...field} 
                        disabled={isEditing} // Email não pode ser alterado na edição
                      />
                    </FormControl>
                    <FormMessage />
                    {isEditing && (
                      <p className="text-xs text-muted-foreground">
                        O e-mail não pode ser alterado após a criação do usuário
                      </p>
                    )}
                  </FormItem>
                )}
              />

              <FormField
                // @ts-expect-error - Funcionalmente correto mas com tipos incompatíveis
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center">
                      <Lock className="h-4 w-4 mr-1" />
                      Senha{" "}
                      {!isEditing && (
                        <span className="text-destructive ml-1">*</span>
                      )}
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder={isEditing ? "Deixe em branco para manter a senha atual" : "Digite a senha"}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                    {isEditing && (
                      <p className="text-xs text-muted-foreground">
                        Deixe em branco para manter a senha atual
                      </p>
                    )}
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                // @ts-expect-error - Funcionalmente correto mas com tipos incompatíveis
                control={form.control}
                name="idProfile"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center">
                      <UserCog className="h-4 w-4 mr-1" />
                      Perfil <span className="text-destructive ml-1">*</span>
                    </FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(Number(value) || null)}
                      value={field.value?.toString() || ""}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o perfil" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {profiles.map((profile) => (
                          <SelectItem
                            key={profile.id}
                            value={profile.id.toString()}
                          >
                            {profile.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                // @ts-expect-error - Funcionalmente correto mas com tipos incompatíveis
                control={form.control}
                name="active"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 mt-6">
                    <FormControl>
                      <Checkbox
                        checked={Boolean(field.value)}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Usuário Ativo</FormLabel>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
          <div className="flex justify-end space-x-2 mr-4 mt-2">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Salvando..." : isEditing ? "Atualizar" : "Criar"}
          </Button>
        </div>
        </Card>

        
      </form>
    </Form>
  );
} 