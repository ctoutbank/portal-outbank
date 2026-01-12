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
import { PasswordInput } from "@/components/ui/password-input";
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
import { IsoCommissionAssignment, type IsoCommissionLink } from "./iso-commission-assignment";
import type { UserDetailForm } from "@/features/customers/users/_actions/user-actions";

const isoCommissionLinkSchema = z.object({
  customerId: z.number(),
  customerName: z.string(),
  commissionType: z.string(),
});

const userPermissionsSchema = z.object({
  firstName: z.string().min(1, "O primeiro nome é obrigatório"),
  lastName: z.string().min(1, "O último nome é obrigatório"),
  email: z.string().email("Email inválido").min(1, "O email é obrigatório"),
  idProfile: z.number().nullable(),
  idCustomer: z.number().nullable(),
  fullAccess: z.boolean(),
  customerIds: z.array(z.number()).optional(),
  isoCommissionLinks: z.array(isoCommissionLinkSchema).optional(),
  hasMerchantsAccess: z.boolean().optional(),
  isInvisible: z.boolean().optional(),
  canViewSensitiveData: z.boolean().optional(),
  canValidateMdr: z.boolean().optional(),
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
  profiles: Array<{ id: number; name: string | null; description?: string | null; categoryType?: string | null }>;
  customers: Array<{ id: number; name: string | null; slug?: string | null }>;
  adminCustomers?: number[]; // ISOs autorizados para o Admin
  isoCommissionLinks?: IsoCommissionLink[]; // Vínculos ISO com tipo de comissão
  isSuperAdmin?: boolean; // Se o usuário logado é Super Admin
}

export function AdminUserPermissionsForm({
  user,
  profiles,
  customers,
  adminCustomers = [],
  isoCommissionLinks: initialIsoCommissionLinks = [],
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
  const [isoCommissionLinks, setIsoCommissionLinks] = useState<IsoCommissionLink[]>(initialIsoCommissionLinks);

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
      isoCommissionLinks: initialIsoCommissionLinks,
      hasMerchantsAccess: false,
      isInvisible: (user && 'isInvisible' in user) ? Boolean(user.isInvisible) : false,
      canViewSensitiveData: (user && 'canViewSensitiveData' in user) ? Boolean(user.canViewSensitiveData) : false,
      canValidateMdr: (user && 'canValidateMdr' in user) ? Boolean(user.canValidateMdr) : false,
      password: "",
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
        isInvisible: ('isInvisible' in user) ? Boolean(user.isInvisible) : false,
        canViewSensitiveData: ('canViewSensitiveData' in user) ? Boolean(user.canViewSensitiveData) : false,
        canValidateMdr: ('canValidateMdr' in user) ? Boolean(user.canValidateMdr) : false,
      });
      setSelectedProfile(idProfile);
      setSelectedCustomerIds(adminCustomers);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user && 'id' in user ? user.id : null]); // Apenas reagir a mudanças no ID do usuário

  const [isCoreProfileSelected, setIsCoreProfileSelected] = useState(false);
  const [previousWasCore, setPreviousWasCore] = useState(false);

  useEffect(() => {
    // Verificar se a categoria selecionada é Admin ou CORE usando categoryType
    const profile = profiles.find((p) => p.id === selectedProfile);
    if (profile) {
      const categoryType = profile.categoryType?.toUpperCase() || "";
      const profileName = profile.name?.toUpperCase() || "";
      
      // Usar categoryType (preferencial) ou fallback para nome
      const isCore = categoryType === "CORE" || profileName.includes("CORE");
      const isAdmin = categoryType === "ADMIN" || (profileName.includes("ADMIN") && !profileName.includes("SUPER"));
      
      setIsAdminProfile(isAdmin);
      setIsCoreProfileSelected(isCore);
      
      // Se for CORE, marcar automaticamente fullAccess e hasMerchantsAccess
      if (isCore) {
        form.setValue("fullAccess", true);
        form.setValue("hasMerchantsAccess", true);
        setHasMerchantsAccess(true);
        setPreviousWasCore(true);
      } else if (previousWasCore) {
        // Se estava CORE e mudou para outra categoria, resetar para valores padrão
        form.setValue("fullAccess", false);
        setPreviousWasCore(false);
      }
    } else {
      setIsAdminProfile(false);
      setIsCoreProfileSelected(false);
      if (previousWasCore) {
        form.setValue("fullAccess", false);
        setPreviousWasCore(false);
      }
    }

    // Verificar acesso a estabelecimentos da categoria
    if (selectedProfile) {
      profileHasMerchantsAccess(selectedProfile).then((hasAccess) => {
        // CORE sempre tem acesso a estabelecimentos
        const profile = profiles.find((p) => p.id === selectedProfile);
        const categoryType = profile?.categoryType?.toUpperCase() || "";
        const profileName = profile?.name?.toUpperCase() || "";
        const isCore = categoryType === "CORE" || profileName.includes("CORE");
        const finalAccess = hasAccess || isCore;
        setHasMerchantsAccess(finalAccess);
        form.setValue("hasMerchantsAccess", finalAccess);
      });
    } else {
      setHasMerchantsAccess(false);
      form.setValue("hasMerchantsAccess", false);
    }
  }, [selectedProfile, profiles, form, previousWasCore]);

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

      // Validação: Categoria Executivo requer mínimo 1 ISO como EXECUTIVO
      // Validação: Categoria Core requer mínimo 1 ISO como CORE
      if (!isAdminProfile && data.idProfile) {
        const profile = profiles.find((p) => p.id === data.idProfile);
        if (profile) {
          const categoryType = profile.categoryType?.toUpperCase() || "";
          const profileName = profile.name?.toUpperCase() || "";
          
          const isExecutivo = categoryType === "EXECUTIVO" || profileName.includes("EXECUTIVO");
          const isCore = categoryType === "CORE" || profileName.includes("CORE");
          
          const links = data.isoCommissionLinks || isoCommissionLinks || [];
          
          if (isExecutivo) {
            const hasExecutivoLink = links.some(l => l.commissionType === "EXECUTIVO");
            if (!hasExecutivoLink) {
              toast.error("Usuários da categoria Executivo precisam ter pelo menos 1 ISO vinculado como EXECUTIVO");
              setIsLoading(false);
              return;
            }
          }
          
          if (isCore) {
            const hasCoreLink = links.some(l => l.commissionType === "CORE");
            if (!hasCoreLink) {
              toast.error("Usuários da categoria Core precisam ter pelo menos 1 ISO vinculado como CORE");
              setIsLoading(false);
              return;
            }
          }
        }
      }

      if (isEditing && user && 'id' in user && user.id) {
        // Atualizar usuário existente
        try {
          const updateData: {
            idProfile?: number;
            idCustomer?: number | null;
            fullAccess?: boolean;
            customerIds?: number[];
            isoCommissionLinks?: Array<{ customerId: number; commissionType: string }>;
            password?: string;
            hasMerchantsAccess?: boolean;
            canViewSensitiveData?: boolean;
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

          if (!isAdminProfile && data.isoCommissionLinks) {
            updateData.isoCommissionLinks = data.isoCommissionLinks.map(l => ({
              customerId: l.customerId,
              commissionType: l.commissionType,
            }));
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

          // Adicionar permissão para visualizar dados sensíveis se fornecido
          if (data.canViewSensitiveData !== undefined) {
            updateData.canViewSensitiveData = data.canViewSensitiveData;
          }

          // Adicionar permissão para aprovar tabelas de taxas
          if (data.canValidateMdr !== undefined) {
            (updateData as any).canValidateMdr = data.canValidateMdr;
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
          toast.error("Categoria é obrigatória");
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
              isInvisible: data.isInvisible || false,
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
          // Criar usuário portal (não-ISO) usando server action
          try {
            const { createPortalUser } = await import("@/features/users/server/admin-users");
            
            // Se houver isoCommissionLinks, usar o primeiro como idCustomer principal
            const primaryCustomerId = (data.isoCommissionLinks && data.isoCommissionLinks.length > 0) 
              ? data.isoCommissionLinks[0].customerId 
              : (data.idCustomer || null);
            
            const result = await createPortalUser({
              firstName: data.firstName.trim(),
              lastName: data.lastName.trim(),
              email: data.email.trim().toLowerCase(),
              password: data.password?.trim() || undefined,
              idProfile: data.idProfile,
              idCustomer: primaryCustomerId,
              fullAccess: data.fullAccess || false,
              isoCommissionLinks: data.isoCommissionLinks?.map(l => ({
                customerId: l.customerId,
                commissionType: l.commissionType,
              })),
            });
            
            const userId = result?.userId;

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

            {/* Senha e Categoria - na mesma linha */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {isEditing ? "Alterar Senha" : "Senha"}
                      {!isEditing && <span className="text-muted-foreground text-xs"> (opcional)</span>}
                      {isEditing && <span className="text-muted-foreground text-xs"> (opcional)</span>}
                    </FormLabel>
                    <FormControl>
                      <PasswordInput
                        placeholder={isEditing ? "Nova senha (mín. 8 caracteres)" : "Senha (mín. 8 caracteres)"}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="idProfile"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Categoria <span className="text-destructive">*</span>
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
                          <SelectValue placeholder="Selecione a categoria" />
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
            </div>

            {/* Estrutura de Comissões - ISO com tipo (apenas para Executivo, oculto para Admin e CORE) */}
            {!isAdminProfile && !isCoreProfileSelected && (
              <div className="space-y-2">
                <IsoCommissionAssignment
                  customers={customerOptions}
                  initialLinks={isoCommissionLinks}
                  onChange={(links) => {
                    setIsoCommissionLinks(links);
                    form.setValue("isoCommissionLinks", links);
                    form.setValue("customerIds", links.map(l => l.customerId));
                    if (links.length > 0) {
                      form.setValue("idCustomer", links[0].customerId);
                    } else {
                      form.setValue("idCustomer", null);
                    }
                  }}
                />
              </div>
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

            {/* Permissões - Grid 2 colunas para otimizar espaço */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Visualizar Todos os Estabelecimentos */}
              <FormField
                control={form.control}
                name="fullAccess"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-3 border rounded-lg">
                    <FormControl>
                      <Checkbox
                        checked={isCoreProfileSelected ? true : field.value}
                        onCheckedChange={isCoreProfileSelected ? undefined : field.onChange}
                        disabled={isCoreProfileSelected}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="text-sm">
                        Visualizar Todos os Estabelecimentos
                        {isCoreProfileSelected && <span className="ml-1 text-xs text-muted-foreground">(auto)</span>}
                      </FormLabel>
                      <FormDescription className="text-xs">
                        Visualiza todos os estabelecimentos dos ISOs vinculados.
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />

              {/* Acesso à Página de Estabelecimentos (apenas para Super Admin) */}
              {isSuperAdmin && (
                <FormField
                  control={form.control}
                  name="hasMerchantsAccess"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-3 border rounded-lg">
                      <FormControl>
                        <Checkbox
                          checked={isCoreProfileSelected ? true : (field.value || false)}
                          onCheckedChange={isCoreProfileSelected ? undefined : (checked) => {
                            field.onChange(checked);
                            setHasMerchantsAccess(checked as boolean);
                          }}
                          disabled={isCoreProfileSelected}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="text-sm">
                          Acesso à Página de Estabelecimentos
                          {isCoreProfileSelected && <span className="ml-1 text-xs text-muted-foreground">(auto)</span>}
                        </FormLabel>
                        <FormDescription className="text-xs">
                          Habilita o menu "Estabelecimentos" no portal.
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              )}

              {/* Invisibilidade nos ISOs (apenas para Super Admin) */}
              {isSuperAdmin && (
                <FormField
                  control={form.control}
                  name="isInvisible"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-3 border rounded-lg">
                      <FormControl>
                        <Checkbox
                          checked={field.value || false}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="text-sm">Invisível nos ISOs</FormLabel>
                        <FormDescription className="text-xs">
                          Não aparece na área de gerenciamento de usuários dos ISOs.
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              )}

              {/* Visualizar Dados Sensíveis (apenas para Super Admin) */}
              {isSuperAdmin && (
                <FormField
                  control={form.control}
                  name="canViewSensitiveData"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-3 border rounded-lg">
                      <FormControl>
                        <Checkbox
                          checked={field.value || false}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="text-sm">Visualizar Dados Sensíveis</FormLabel>
                        <FormDescription className="text-xs">
                          Visualiza CNPJ, CPF, telefone, endereço dos clientes.
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              )}

              {/* Pode Aprovar Tabelas de Taxas (apenas para Super Admin) */}
              {isSuperAdmin && (
                <FormField
                  control={form.control}
                  name="canValidateMdr"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-3 border rounded-lg">
                      <FormControl>
                        <Checkbox
                          checked={field.value || false}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="text-sm">Pode Aprovar Tabelas de Taxas</FormLabel>
                        <FormDescription className="text-xs">
                          Permite aprovar, desativar e reativar tabelas MDR nos ISOs.
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              )}
            </div>
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
