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
  profileHasMerchantsAccess,
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
  hasMerchantsAccess: z.boolean().optional(),
  password: z
    .union([
      z.string().min(8, "A senha deve ter pelo menos 8 caracteres"),
      z.literal(""),
    ])
    .optional(),
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
    (user && 'idProfile' in user) ? (user.idProfile as number | null) : null
  );
  const [isAdminProfile, setIsAdminProfile] = useState(false);
  const [selectedCustomerIds, setSelectedCustomerIds] = useState<number[]>(adminCustomers);
  const [hasMerchantsAccess, setHasMerchantsAccess] = useState(false);

  const isEditing = !!(user && 'id' in user && user.id);
  const isSuperAdmin = isSuperAdminProp;

  const form = useForm<UserPermissionsFormValues>({
    resolver: zodResolver(userPermissionsSchema),
    defaultValues: {
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      email: user?.email || "",
      idProfile: ((user && 'idProfile' in user) ? user.idProfile : null) as number | null,
      idCustomer: ((user && 'idCustomer' in user) ? user.idCustomer : null) as number | null,
      fullAccess: user?.fullAccess || false,
      customerIds: adminCustomers,
      hasMerchantsAccess: false,
      password: undefined,
    },
  });

  useEffect(() => {
    if (user && 'id' in user && user.id) {
      // Resetar o form apenas quando os dados do usuário mudarem
      const idProfile = ('idProfile' in user) ? (user.idProfile as number | null) : null;
      const idCustomer = ('idCustomer' in user) ? (user.idCustomer as number | null) : null;
      
      form.reset({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || "",
        idProfile: idProfile,
        idCustomer: idCustomer,
        fullAccess: user.fullAccess || false,
        customerIds: adminCustomers,
      });
      setSelectedProfile(idProfile);
      setSelectedCustomerIds(adminCustomers);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user && 'id' in user ? user.id : null]); // Apenas reagir a mudanças no ID do usuário

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

    // Verificar acesso a estabelecimentos do perfil
    if (selectedProfile) {
      profileHasMerchantsAccess(selectedProfile).then((hasAccess) => {
        setHasMerchantsAccess(hasAccess);
        form.setValue("hasMerchantsAccess", hasAccess);
      });
    } else {
      setHasMerchantsAccess(false);
      form.setValue("hasMerchantsAccess", false);
    }
  }, [selectedProfile, profiles, form]);

  const onSubmit = async (data: UserPermissionsFormValues) => {
    setIsLoading(true);
    
    try {
      // Validações básicas
      if (!data.email || !data.email.trim()) {
        toast.error("Email é obrigatório");
        setIsLoading(false);
        return;
      }

      if (!data.firstName || !data.firstName.trim()) {
        toast.error("Primeiro nome é obrigatório");
        setIsLoading(false);
        return;
      }

      if (!data.lastName || !data.lastName.trim()) {
        toast.error("Último nome é obrigatório");
        setIsLoading(false);
        return;
      }

      if (isEditing && user && 'id' in user && user.id) {
        // Atualizar usuário existente
        try {
          const updateData: {
            idProfile?: number;
            idCustomer?: number | null;
            fullAccess?: boolean;
            customerIds?: number[];
            password?: string;
            hasMerchantsAccess?: boolean;
          } = {
            fullAccess: data.fullAccess,
          };

          if (data.idProfile !== null && data.idProfile !== undefined) {
            updateData.idProfile = data.idProfile;
          }

          if (data.idCustomer !== undefined) {
            updateData.idCustomer = data.idCustomer;
          }

          if (isAdminProfile && data.customerIds) {
            updateData.customerIds = data.customerIds;
          }

          // Adicionar senha se fornecida (apenas se não estiver vazia ou apenas espaços)
          if (data.password && data.password.trim().length >= 8) {
            updateData.password = data.password.trim();
          } else if (data.password && data.password.trim().length > 0 && data.password.trim().length < 8) {
            toast.error("A senha deve ter pelo menos 8 caracteres");
            setIsLoading(false);
            return;
          }

          // Adicionar acesso a estabelecimentos se fornecido
          if (data.hasMerchantsAccess !== undefined) {
            updateData.hasMerchantsAccess = data.hasMerchantsAccess;
          }

          const userId = ('id' in user && user.id) ? (user.id as number) : null;
          if (!userId) {
            throw new Error("ID do usuário não encontrado");
          }
          await updateUserPermissions(userId, updateData);
          
          toast.success("Permissões atualizadas com sucesso");
          router.push("/config/users");
          router.refresh();
          return;
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

        if (!data.idProfile) {
          toast.error("Perfil é obrigatório");
          setIsLoading(false);
          return;
        }

        // Se for Admin, criar Admin e atribuir ISOs
        if (isAdminProfile) {
          try {
            await createAdminUser({
              firstName: data.firstName.trim(),
              lastName: data.lastName.trim(),
              email: data.email.trim().toLowerCase(),
              password: data.password?.trim() || undefined,
              customerIds: data.customerIds || [],
            });
            
            toast.success("Admin criado com sucesso");
            router.push("/config/users");
            router.refresh();
            return;
          } catch (error: any) {
            console.error("Erro ao criar Admin:", error);
            let errorMessage = "Erro ao criar Admin";
            
            if (error?.message) {
              errorMessage = error.message;
            } else if (error?.errors) {
              errorMessage = error.errors.map((e: any) => e.message || e.msg || e).join(", ");
            }
            
            toast.error(errorMessage);
            setIsLoading(false);
            return;
          }
        } else {
          // Criar usuário normal usando função existente
          try {
            const { InsertUser } = await import("@/features/customers/users/_actions/user-actions");
            
            // Se houver múltiplos ISOs selecionados via customerIds, usar o primeiro como idCustomer principal
            // Caso contrário, usar o idCustomer do campo
            const primaryCustomerId = (data.customerIds && data.customerIds.length > 0) 
              ? data.customerIds[0] 
              : (data.idCustomer || null);
            
            const userId = await InsertUser({
              firstName: data.firstName.trim(),
              lastName: data.lastName.trim(),
              email: data.email.trim().toLowerCase(),
              password: data.password?.trim() || undefined,
              idCustomer: primaryCustomerId,
              active: true,
              idProfile: data.idProfile,
              fullAccess: data.fullAccess || false,
            });
            
            // Se houver múltiplos ISOs selecionados, atribuir os demais após criar o usuário
            if (data.customerIds && data.customerIds.length > 1 && userId) {
              // TODO: Implementar lógica para atribuir ISOs adicionais ao usuário criado
              // Por enquanto, apenas o primeiro ISO será atribuído como idCustomer principal
              console.log("ISOs adicionais selecionados:", data.customerIds.slice(1));
            }

            if (userId && typeof userId === 'number' && userId > 0) {
              toast.success("Usuário criado com sucesso");
              router.push("/config/users");
              router.refresh();
              return;
            } else {
              throw new Error("Erro ao obter ID do usuário criado");
            }
          } catch (error: any) {
            console.error("Erro ao criar usuário:", error);
            let errorMessage = "Erro ao criar usuário";
            
            if (error?.message) {
              errorMessage = error.message;
            } else if (error?.errors) {
              errorMessage = error.errors.map((e: any) => e.message || e.msg || e).join(", ");
            }
            
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

            {/* Senha (na criação e na edição) */}
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {isEditing ? "Alterar Senha" : "Senha"}
                    {!isEditing && <span className="text-muted-foreground text-xs"> (opcional - será gerada automaticamente se não informada)</span>}
                    {isEditing && <span className="text-muted-foreground text-xs"> (opcional - deixe em branco para não alterar)</span>}
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder={isEditing ? "Digite a nova senha (deixe em branco para não alterar)" : "Digite a senha"}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    {isEditing 
                      ? "Mínimo de 8 caracteres. Deixe em branco para manter a senha atual."
                      : "Mínimo de 8 caracteres. Se não informada, será gerada automaticamente."
                    }
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                render={({ field }) => {
                  // Converter idCustomer (número ou null) para array de IDs para o componente de seleção múltipla
                  const selectedIds = field.value ? [field.value] : [];
                  
                  return (
                    <FormItem>
                      <FormLabel>ISOs</FormLabel>
                      <FormControl>
                        <AdminCustomerAssignment
                          customers={customerOptions}
                          selectedCustomerIds={selectedIds}
                          onSelectionChange={(customerIds) => {
                            // Armazenar todos os ISOs selecionados em customerIds
                            form.setValue("customerIds", customerIds);
                            // Usar o primeiro ISO como idCustomer principal (para compatibilidade com schema)
                            if (customerIds.length > 0) {
                              field.onChange(customerIds[0]);
                            } else {
                              field.onChange(null);
                            }
                          }}
                        />
                      </FormControl>
                      <FormDescription>
                        Selecione os ISOs aos quais o usuário pertence. Você pode selecionar múltiplos ISOs.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  );
                }}
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

            {/* Acesso a Estabelecimentos (apenas para Super Admin) */}
            {isSuperAdmin && (
              <FormField
                control={form.control}
                name="hasMerchantsAccess"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value || false}
                        onCheckedChange={(checked) => {
                          field.onChange(checked);
                          setHasMerchantsAccess(checked as boolean);
                        }}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Acesso a Estabelecimentos</FormLabel>
                      <FormDescription>
                        Quando marcado, o usuário poderá visualizar estabelecimentos de todos os ISOs aos quais tem vínculo na página de Estabelecimentos do Portal-Outbank.
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
            )}
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
