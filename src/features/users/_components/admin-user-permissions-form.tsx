"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { zodResolver } from "@hookform/resolvers/zod";
import { Shield, UserPlus } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { useRouter } from "next/navigation";
import {
  createAdminUser,
  updateUserPermissions,
} from "@/features/users/server/admin-users";
import { AdminCustomerAssignment } from "./admin-customer-assignment";
import type { UserDetailForm } from "@/features/customers/users/_actions/user-actions";

const userPermissionsSchema = z.object({
  firstName: z.string().min(1, "O primeiro nome é obrigatório"),
  lastName: z.string().min(1, "O último nome é obrigatório"),
  email: z.string().email("Email inválido").min(1, "O email é obrigatório"),
  idProfile: z.number().nullable(),
  idCustomer: z.number().nullable(),
  fullAccess: z.boolean(),
  customerIds: z.array(z.number()).optional(),
  password: z.string().min(8, "A senha deve ter pelo menos 8 caracteres").optional(),
});

type UserPermissionsFormValues = z.infer<typeof userPermissionsSchema>;

interface AdminUserPermissionsFormProps {
  user?: UserDetailForm;
  profiles: Array<{ id: number; name: string | null; description?: string | null }>;
  customers: Array<{ id: number; name: string | null; slug?: string | null }>;
  adminCustomers?: number[]; // ISOs autorizados para o Admin
  isSuperAdmin?: boolean; // Se o usuário logado é Super Admin
}

export function AdminUserPermissionsForm({
  user,
  profiles,
  customers,
  adminCustomers = [],
  isSuperAdmin: isSuperAdminProp = false,
}: AdminUserPermissionsFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<number | null>(
    user?.idProfile || null
  );
  const [isAdminProfile, setIsAdminProfile] = useState(false);
  const [selectedCustomerIds, setSelectedCustomerIds] = useState<number[]>(adminCustomers);

  const isEditing = !!user?.id;
  const isSuperAdmin = isSuperAdminProp;

  const form = useForm<UserPermissionsFormValues>({
    resolver: zodResolver(userPermissionsSchema),
    defaultValues: {
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      email: user?.email || "",
      idProfile: user?.idProfile || null,
      idCustomer: user?.idCustomer || null,
      fullAccess: user?.fullAccess || false,
      customerIds: adminCustomers,
      password: undefined,
    },
  });

  useEffect(() => {

    if (user) {
      form.reset({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || "",
        idProfile: user.idProfile || null,
        idCustomer: user.idCustomer || null,
        fullAccess: user.fullAccess || false,
        customerIds: adminCustomers,
      });
      setSelectedProfile(user.idProfile || null);
    }
  }, [user, adminCustomers, form]);

  useEffect(() => {
    // Verificar se o perfil selecionado é Admin
    const profile = profiles.find((p) => p.id === selectedProfile);
    if (profile && profile.name) {
      const profileName = profile.name.toUpperCase();
      const isAdmin = profileName.includes("ADMIN") && !profileName.includes("SUPER");
      setIsAdminProfile(isAdmin);
    } else {
      setIsAdminProfile(false);
    }
  }, [selectedProfile, profiles]);

  const onSubmit = async (data: UserPermissionsFormValues) => {
    setIsLoading(true);
    try {
      if (isEditing && user?.id) {
        // Atualizar usuário existente
        try {
          await updateUserPermissions(user.id, {
            idProfile: data.idProfile || undefined,
            idCustomer: data.idCustomer !== undefined ? data.idCustomer : undefined,
            fullAccess: data.fullAccess,
            customerIds: isAdminProfile ? data.customerIds : undefined,
          });
          toast.success("Permissões atualizadas com sucesso");
          router.push("/config/users");
          router.refresh();
        } catch (error: any) {
          console.error("Erro ao atualizar usuário:", error);
          const errorMessage = error?.message || "Erro ao atualizar permissões do usuário";
          toast.error(errorMessage);
          setIsLoading(false);
          return;
        }
      } else {
        // Criar novo usuário
        if (!isSuperAdmin) {
          toast.error("Apenas Super Admin pode criar novos usuários");
          setIsLoading(false);
          return;
        }

        // Se for Admin, criar Admin e atribuir ISOs
        if (isAdminProfile) {
          try {
            await createAdminUser({
              firstName: data.firstName,
              lastName: data.lastName,
              email: data.email,
              password: data.password,
              customerIds: data.customerIds || [],
            });
            toast.success("Admin criado com sucesso");
            router.push("/config/users");
            router.refresh();
          } catch (error: any) {
            console.error("Erro ao criar Admin:", error);
            const errorMessage = error?.message || "Erro ao criar Admin";
            toast.error(errorMessage);
            setIsLoading(false);
            return;
          }
        } else {
          // Criar usuário normal usando função existente
          try {
            const { InsertUser } = await import("@/features/customers/users/_actions/user-actions");
            const userId = await InsertUser({
              firstName: data.firstName,
              lastName: data.lastName,
              email: data.email,
              password: data.password,
              idCustomer: data.idCustomer,
              active: true,
              idProfile: data.idProfile || undefined,  // Passar idProfile diretamente
              fullAccess: data.fullAccess || false,    // Passar fullAccess diretamente
            });

            if (userId) {
              toast.success("Usuário criado com sucesso");
              router.push("/config/users");
              router.refresh();
            } else {
              throw new Error("Erro ao obter ID do usuário criado");
            }
          } catch (error: any) {
            console.error("Erro ao criar usuário:", error);
            const errorMessage = error?.message || "Erro ao criar usuário";
            toast.error(errorMessage);
            setIsLoading(false);
            return;
          }
        }
      }
    } catch (error) {
      console.error("Erro inesperado ao salvar usuário:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Ocorreu um erro ao processar a solicitação";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const profileOptions = isSuperAdmin
    ? profiles.filter((p) => p.name !== null)
    : profiles.filter((p) => {
        if (!p.name) return false;
        const profileName = p.name.toUpperCase();
        return !profileName.includes("ADMIN") && !profileName.includes("SUPER");
      });

  const customerOptions = isSuperAdmin
    ? customers
    : customers.filter((c) => {
        // Admin só pode atribuir ISOs autorizados
        // Isso será filtrado pelo getAvailableCustomers()
        return true;
      });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card className="border-border bg-card">
          <CardHeader className="border-b border-border">
            <CardTitle className="flex items-center gap-2 text-foreground">
              {isAdminProfile ? (
                <Shield className="h-5 w-5" />
              ) : (
                <UserPlus className="h-5 w-5" />
              )}
              {isEditing ? "Editar Permissões" : "Criar Usuário"}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            {/* Informações Básicas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Primeiro Nome <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Digite o primeiro nome" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Último Nome <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Digite o último nome" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Email <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="Digite o email"
                        {...field}
                        disabled={isEditing}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Senha (apenas na criação) */}
            {!isEditing && (
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Senha {!isEditing && <span className="text-muted-foreground text-xs">(opcional - será gerada automaticamente se não informada)</span>}
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Digite a senha"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Mínimo de 8 caracteres. Se não informada, será gerada automaticamente.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Perfil */}
            <FormField
              control={form.control}
              name="idProfile"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Perfil <span className="text-destructive">*</span>
                  </FormLabel>
                  <Select
                    value={field.value?.toString() || ""}
                    onValueChange={(value) => {
                      const idProfile = value ? Number(value) : null;
                      field.onChange(idProfile);
                      setSelectedProfile(idProfile);
                    }}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o perfil" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {profileOptions.map((profile) => (
                        <SelectItem key={profile.id} value={profile.id.toString()}>
                          {profile.name || "Sem nome"}
                          {profile.description && (
                            <span className="text-muted-foreground text-xs ml-2">
                              - {profile.description}
                            </span>
                          )}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* ISO (apenas para usuários normais, não para Admin) */}
            {!isAdminProfile && (
              <FormField
                control={form.control}
                name="idCustomer"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ISO</FormLabel>
                    <Select
                      value={field.value?.toString() || ""}
                      onValueChange={(value) => {
                        field.onChange(value ? Number(value) : null);
                      }}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o ISO (opcional)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">Nenhum ISO</SelectItem>
                        {customerOptions.map((customer) => (
                          <SelectItem key={customer.id} value={customer.id.toString()}>
                            {customer.name || "Sem nome"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      ISO ao qual o usuário pertence. Deixe em branco para usuários sem ISO específico.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* ISOs Autorizados (apenas para Admin e Super Admin pode editar) */}
            {isAdminProfile && isSuperAdmin && (
              <div className="space-y-2">
                <FormLabel>ISOs Autorizados</FormLabel>
                <FormDescription>
                  Selecione quais ISOs este Admin poderá gerenciar. O Admin poderá visualizar, editar, deletar e alterar apenas nestes ISOs.
                </FormDescription>
                <AdminCustomerAssignment
                  customers={customerOptions}
                  selectedCustomerIds={selectedCustomerIds}
                  onSelectionChange={(customerIds) => {
                    setSelectedCustomerIds(customerIds);
                    form.setValue("customerIds", customerIds);
                  }}
                />
              </div>
            )}

            {/* Full Access */}
            <FormField
              control={form.control}
              name="fullAccess"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Acesso Total</FormLabel>
                    <FormDescription>
                      Quando marcado, o usuário terá acesso a todos os merchants do ISO, sem necessidade de atribuição específica.
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />
          </CardContent>
          <div className="flex justify-end space-x-2 p-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Salvando..." : isEditing ? "Atualizar" : "Criar"}
            </Button>
          </div>
        </Card>
      </form>
    </Form>
  );
}
