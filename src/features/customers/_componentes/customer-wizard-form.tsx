"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import CustomerForm from "./customer-form";
import { CustomerSchema } from "../schema/schema";
import { CustomizationSchema } from "../schema/customizationSchema";
import UserCustomerForm from "../users/_components/user-form";
import UsersCustomerList from "../users/_components/user-table-updated";
import { useSearchParams, useRouter } from "next/navigation";
import {
  ProfileDD,
  UserDetailForm,
  getUserDetailWithClerk,
  UserDetail,
  getUsersWithClerk,
} from "../users/_actions/user-actions";
import {
  getCustomizationByCustomerId,
  saveCustomization,
  updateCustomization,
} from "@/utils/serverActions";
import Image from "next/image";
import { Info, Palette } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
} from "@radix-ui/react-tooltip";
import { TooltipTrigger } from "@/components/ui/tooltip";
import { generateSlug } from "@/lib/utils";
import { insertCustomerFormAction } from "../_actions/customers-formActions";
import { updateCustomer } from "../server/customers";

interface CustomerWizardFormProps {
  customer: CustomerSchema;
  profiles: ProfileDD[];
  permissions?: string[];
  activeTabDefault?: string;
}

export default function CustomerWizardForm({
  customer,
  profiles,
  activeTabDefault = "step1",
}: CustomerWizardFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Lê o step da URL ou usa o default
  const stepFromUrl = searchParams.get("step") || activeTabDefault;

  const [activeTab, setActiveTab] = useState(stepFromUrl);
  const [newCustomerId, setNewCustomerId] = useState<number | null>(
    customer.id || null
  );
  const [isFirstStepComplete, setIsFirstStepComplete] = useState(!!customer.id);
  const [users, setUsers] = useState<UserDetail[]>([]);
  const [isLoadingUsers] = useState(false);
  const [selectedUser, setSelectedUser] = useState<number | null>(null);
  const [userToEdit, setUserToEdit] = useState<UserDetailForm | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(false);
  const [customizationData, setCustomizationData] = useState<{
    imageUrl?: string;
    id: number;
    subdomain?: string;
    primaryColor?: string;
    secondaryColor?: string;
    loginImageUrl?: string;
  } | null>(null);

  useEffect(() => {
    // Sincroniza o activeTab com a URL se ela mudar externamente
    if (stepFromUrl !== activeTab) {
      setActiveTab(stepFromUrl);
    }
  }, [stepFromUrl, activeTab]);

  useEffect(() => {
    const loadCustomization = async () => {
      console.log("newCustomerId", newCustomerId);
      if (newCustomerId) {
        const response = await getCustomizationByCustomerId(newCustomerId);
        if (response) {
          console.log("response", response);
          setCustomizationData({
            imageUrl: response.imageUrl ?? undefined,
            id: response.id ?? 0,
            subdomain: response.slug ?? undefined,
            primaryColor: response.primaryColor ?? undefined,
            secondaryColor: response.secondaryColor ?? undefined,
            loginImageUrl: response.loginImageUrl ?? undefined,
          });
        }
      }
    };

    loadCustomization();
  }, [newCustomerId]);

  function hslToHex(hsl: string): string {
    const [h, s, l] = hsl
      .split(" ")
      .map((value, index) =>
        index === 0 ? parseFloat(value) : parseFloat(value) / 100
      );

    const a = s * Math.min(l, 1 - l);
    const f = (n: number) => {
      const k = (n + h / 30) % 12;
      const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
      return Math.round(255 * color)
        .toString(16)
        .padStart(2, "0");
    };

    return `#${f(0)}${f(8)}${f(4)}`;
  }

  // Ao mudar o step, atualiza o estado e a URL sem reload
  const handleStepChange = (value: string) => {
    if (value === "step2" && !isFirstStepComplete) {
      toast.error(
        "É necessário criar o cliente antes de configurar os usuários"
      );
      return;
    }
    setActiveTab(value);
    if (newCustomerId) {
      router.replace(`/customers/${newCustomerId}?step=${value}`, {
        scroll: false,
      });
    }
  };

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [loginImagePreview, setLoginImagePreview] = useState<string | null>(null);
  const [loginImageError, setLoginImageError] = useState<string | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setImageError(null);

    if (file) {
      const allowedExtensions = ["jpg", "jpeg", "png"];
      const fileExtension = file.name.split(".").pop()?.toLowerCase();

      if (!fileExtension || !allowedExtensions.includes(fileExtension)) {
        setImageError("Apenas arquivos JPG, JPEG e PNG são aceitos");
        setImagePreview(null);
        e.target.value = "";
        return;
      }

      const allowedMimeTypes = ["image/jpeg", "image/jpg", "image/png"];
      if (!allowedMimeTypes.includes(file.type)) {
        setImageError(
          "Formato de arquivo inválido. Apenas JPG, JPEG e PNG são aceitos"
        );
        setImagePreview(null);
        e.target.value = "";
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setImagePreview(null);
    }
  };

  const handleLoginImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setLoginImageError(null);

    if (file) {
      const allowedExtensions = ["jpg", "jpeg", "png"];
      const fileExtension = file.name.split(".").pop()?.toLowerCase();

      if (!fileExtension || !allowedExtensions.includes(fileExtension)) {
        setLoginImageError("Apenas arquivos JPG, JPEG e PNG são aceitos");
        setLoginImagePreview(null);
        e.target.value = "";
        return;
      }

      const allowedMimeTypes = ["image/jpeg", "image/jpg", "image/png"];
      if (!allowedMimeTypes.includes(file.type)) {
        setLoginImageError(
          "Formato de arquivo inválido. Apenas JPG, JPEG e PNG são aceitos"
        );
        setLoginImagePreview(null);
        e.target.value = "";
        return;
      }

      const MAX_SIZE = 5 * 1024 * 1024;
      if (file.size > MAX_SIZE) {
        setLoginImageError("Arquivo muito grande. Tamanho máximo: 5MB");
        setLoginImagePreview(null);
        e.target.value = "";
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setLoginImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setLoginImagePreview(null);
    }
  };

  const handleFirstStepComplete = async (id: number) => {
    if (iso.subdomain && iso.subdomain.trim() !== "") {
      try {
        const formData = new FormData();
        formData.append("customerId", id.toString());
        formData.append("subdomain", iso.subdomain);
        formData.append("primaryColor", "#000000");
        formData.append("secondaryColor", "#ffffff");
        
        if (customizationData?.id) {
          formData.append("id", customizationData.id.toString());
          await updateCustomization(formData);
        } else {
          await saveCustomization(formData);
        }
        
        const updatedCustomization = await getCustomizationByCustomerId(id);
        if (updatedCustomization) {
          setCustomizationData({
            imageUrl: updatedCustomization.imageUrl ?? undefined,
            id: updatedCustomization.id ?? 0,
            subdomain: updatedCustomization.slug ?? undefined,
            primaryColor: updatedCustomization.primaryColor ?? undefined,
            secondaryColor: updatedCustomization.secondaryColor ?? undefined,
            loginImageUrl: updatedCustomization.loginImageUrl ?? undefined,
          });
        }
      } catch (error) {
        console.error("Erro ao salvar subdomain:", error);
        const errorMessage = error instanceof Error ? error.message : "Erro ao salvar subdomain";
        toast.error(errorMessage);
      }
    }
    
    setNewCustomerId(id);
    setIsFirstStepComplete(true);
    loadUsers(id);
  };

  // Função para recarregar a lista de usuários
  const loadUsers = async (customerId: number) => {
    const users = await getUsersWithClerk(customerId);
    setUsers(users);
  };

  useEffect(() => {
    if (newCustomerId) {
      loadUsers(newCustomerId);
    }
  }, [newCustomerId]);

  useEffect(() => {
    if (isFirstStepComplete && newCustomerId) {
      loadUsers(newCustomerId);
    }
  }, [isFirstStepComplete, newCustomerId]);

  useEffect(() => {
    const fetchUserDetail = async () => {
      if (selectedUser) {
        setIsLoadingUser(true);
        try {
          const userDetail = await getUserDetailWithClerk(selectedUser);
          if (userDetail) {
            setUserToEdit(userDetail);
          } else {
            toast.error("Não foi possível carregar os detalhes do usuário");
            setSelectedUser(null);
          }
        } catch (error) {
          console.error("Erro ao carregar usuário:", error);
          toast.error("Erro ao carregar os detalhes do usuário");
          setSelectedUser(null);
        } finally {
          setIsLoadingUser(false);
        }
      } else {
        setUserToEdit(null);
      }
    };

    fetchUserDetail();
  }, [selectedUser]);

  const handleUserSuccess = () => {
    if (newCustomerId) {
      loadUsers(newCustomerId);
    }
    setSelectedUser(null);
    setUserToEdit(null);
  };

  console.log("CUSTOMERID", newCustomerId);

  const [isSavingCustomization, setIsSavingCustomization] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const [iso, setIso] = useState<{
    name: string;
    subdomain: string;
  }>({
    name: customer?.name || "",
    subdomain: "",
  });

  useEffect(() => {
    const initialSubdomain = customizationData?.subdomain || customer?.slug || "";
    const initialName = customer?.name || "";
    
    setIso({
      name: initialName,
      subdomain: initialSubdomain,
    });
  }, [customizationData?.subdomain, customer?.slug, customer?.name]);

  // Handler para impedir troca de aba ao clicar nas tabs
  const handleTabClick = (value: string, e: React.MouseEvent) => {
    if (value !== activeTab) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  return (
    <div className="w-full">
      <Tabs
        value={activeTab}
        onValueChange={handleStepChange}
        className="space-y-6"
      >
        {/* Progress Indicator - 2 Steps */}
        <div className="mb-4">
          <div className="flex items-center justify-between max-w-md mx-auto">
            <div className="flex items-center gap-2">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full text-sm font-medium ${isFirstStepComplete ? 'bg-green-600 text-white' : activeTab === 'step1' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                {isFirstStepComplete ? '✓' : '1'}
              </div>
              <span className={`text-sm font-medium ${activeTab === 'step1' ? 'text-foreground' : 'text-muted-foreground'}`}>
                ISO + Usuários
              </span>
            </div>
            <div className="flex-1 h-1 mx-4 bg-muted rounded-full overflow-hidden">
              <div className={`h-full transition-all duration-300 ${isFirstStepComplete ? 'bg-green-600 w-full' : 'bg-muted w-0'}`} />
            </div>
            <div className="flex items-center gap-2">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full text-sm font-medium ${activeTab === 'step2' && isFirstStepComplete ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                2
              </div>
              <span className={`text-sm font-medium ${activeTab === 'step2' ? 'text-foreground' : 'text-muted-foreground'}`}>
                Personalização
              </span>
            </div>
          </div>
        </div>

        <TabsList className="grid w-full grid-cols-2 h-auto p-1 bg-muted">
          <TabsTrigger
            value="step1"
            className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 px-2 sm:px-4 data-[state=active]:bg-background data-[state=active]:text-foreground"
            onMouseDown={(e) => handleTabClick("step1", e)}
          >
            1. ISO + Usuários
          </TabsTrigger>
          <TabsTrigger
            value="step2"
            className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 px-2 sm:px-4 data-[state=active]:bg-background data-[state=active]:text-foreground"
            onMouseDown={(e) => handleTabClick("step2", e)}
          >
            2. Personalização
          </TabsTrigger>
        </TabsList>

        <TabsContent value="step1" className="space-y-6">
          <Card className="p-8">
            <CardContent className="space-y-8 p-0">
              {/* Block A: ISO Data (2-column grid) */}
              <div className="space-y-4">
                <CustomerForm
                  customer={customer}
                  onSuccess={handleFirstStepComplete}
                  hideWrapper={true}
                  nameValue={iso.name}
                  onNameChange={(name) => setIso({ ...iso, name })}
                  subdomainValue={iso.subdomain}
                  onSubdomainChange={(subdomain) => setIso({ ...iso, subdomain })}
                  showSubmitButton={false}
                />
              </div>

              {/* Block B: User Creation Form (only after ISO created) */}
              {isFirstStepComplete && selectedUser === null && (
                <div className="space-y-4 pt-8 border-t">
                  <UserCustomerForm
                    customerId={newCustomerId || undefined}
                    onSuccess={handleUserSuccess}
                    profiles={profiles}
                    hideWrapper={true}
                  />
                </div>
              )}

              {/* Block C: User List Table (only after ISO created) */}
              {isFirstStepComplete && selectedUser === null && (
                <div className="space-y-4 pt-8 border-t">
                  <h3 className="text-lg font-semibold">Usuários</h3>
                  {isLoadingUsers ? (
                    <div className="text-center p-8">
                      <p>Carregando usuários...</p>
                    </div>
                  ) : (
                    <UsersCustomerList
                      users={users}
                      customerId={newCustomerId || 0}
                      onRefresh={() => loadUsers(newCustomerId || 0)}
                    />
                  )}
                </div>
              )}

              {/* Edit User Mode */}
              {isFirstStepComplete && selectedUser !== null && (
                <div className="space-y-4 pt-8 border-t">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium">Editar Usuário</h3>
                    <Button
                      variant="outline"
                      onClick={() => setSelectedUser(null)}
                      className="cursor-pointer"
                    >
                      Voltar
                    </Button>
                  </div>

                  {isLoadingUser ? (
                    <div className="text-center p-4">
                      <p>Carregando dados do usuário...</p>
                    </div>
                  ) : (
                    <UserCustomerForm
                      user={userToEdit || undefined}
                      customerId={newCustomerId || undefined}
                      onSuccess={handleUserSuccess}
                      profiles={profiles}
                      hideWrapper={true}
                    />
                  )}
                </div>
              )}

              {/* Single primary button at bottom of card */}
              <div className="flex justify-end pt-8 border-t">
                <Button
                  onClick={async () => {
                    const isEdit = Boolean(newCustomerId || customer?.id);
                    setIsLoading(true);
                    try {
                      if (isEdit && (newCustomerId || customer?.id)) {
                        const updatedData = {
                          id: newCustomerId || customer?.id,
                          name: iso.name,
                          slug: customer?.slug || "",
                          customerId: customer?.customerId || "",
                          settlementManagementType: customer?.settlementManagementType || "",
                        };
                        const updatedId = await updateCustomer(updatedData);
                        toast.success("ISO atualizado com sucesso");
                        
                        if (iso.subdomain && iso.subdomain.trim() !== "") {
                          const formData = new FormData();
                          formData.append("customerId", updatedId.toString());
                          formData.append("subdomain", iso.subdomain);
                          formData.append("primaryColor", customizationData?.primaryColor || "#000000");
                          formData.append("secondaryColor", customizationData?.secondaryColor || "#ffffff");
                          
                          if (customizationData?.id) {
                            formData.append("id", customizationData.id.toString());
                            await updateCustomization(formData);
                          } else {
                            await saveCustomization(formData);
                          }
                          
                          const updatedCustomization = await getCustomizationByCustomerId(updatedId);
                          if (updatedCustomization) {
                            setCustomizationData({
                              imageUrl: updatedCustomization.imageUrl ?? undefined,
                              id: updatedCustomization.id ?? 0,
                              subdomain: updatedCustomization.slug ?? undefined,
                              primaryColor: updatedCustomization.primaryColor ?? undefined,
                              secondaryColor: updatedCustomization.secondaryColor ?? undefined,
                              loginImageUrl: updatedCustomization.loginImageUrl ?? undefined,
                            });
                          }
                        }
                      } else {
                        const slug = generateSlug();
                        const customerDataFixed = {
                          slug: slug || "",
                          name: iso.name,
                          customerId: customer?.customerId || undefined,
                          settlementManagementType: customer?.settlementManagementType || undefined,
                          idParent: customer?.idParent || undefined,
                          id: customer?.id || undefined,
                        };
                        const newId = await insertCustomerFormAction(customerDataFixed);
                        toast.success("ISO criado com sucesso");
                        
                        if (newId !== null && newId !== undefined) {
                          await handleFirstStepComplete(newId);
                          router.replace(`/customers/${newId}?step=step1`, { scroll: false });
                        }
                      }
                    } catch (error) {
                      console.error("Erro ao salvar ISO:", error);
                      toast.error("Ocorreu um erro ao processar a solicitação");
                    } finally {
                      setIsLoading(false);
                    }
                  }}
                  disabled={isLoading || !iso.name || !iso.subdomain}
                  className="cursor-pointer"
                >
                  {isLoading ? "Salvando..." : (newCustomerId || customer?.id) ? "Atualizar" : "Salvar"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="flex justify-end gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => handleStepChange("step2")}
              disabled={!isFirstStepComplete}
              className="cursor-pointer"
            >
              Próximo →
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="step2">
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setIsSavingCustomization(true);

              const formData = new FormData(e.currentTarget);

              const subdomain = (iso.subdomain || customizationData?.subdomain || "").trim();
              const customerId = newCustomerId || customer.id;

              if (!subdomain) {
                toast.error("Por favor, defina o Domínio do ISO no passo 1 antes de salvar a personalização");
                setIsSavingCustomization(false);
                return;
              }

              if (!customerId) {
                toast.error("Por favor, crie o ISO no passo 1 antes de salvar a personalização");
                setIsSavingCustomization(false);
                return;
              }

              formData.set("subdomain", subdomain);
              formData.set("customerId", String(customerId));
              if (customizationData?.id) {
                formData.set("id", String(customizationData.id));
              }

              const validationData = {
                subdomain: subdomain,
                primaryColor: formData.get("primaryColor") as string,
                secondaryColor: formData.get("secondaryColor") as string,
                image: formData.get("image"),
                customerId: String(customerId),
                id: customizationData?.id,
              };

              const validationResult =
                CustomizationSchema.safeParse(validationData);

              if (!validationResult.success) {
                console.error("Validation errors:", validationResult.error.flatten());
                toast.error("Por favor, corrija os erros antes de continuar");
                setIsSavingCustomization(false);
                return;
              }

              try {
                if (customizationData) {
                  await updateCustomization(formData);
                } else {
                  await saveCustomization(formData);
                }

                // Atualizar o customizationData com os dados salvos
                if (customerId) {
                  const updatedCustomization =
                    await getCustomizationByCustomerId(customerId);
                  if (updatedCustomization) {
                    setCustomizationData({
                      imageUrl: updatedCustomization.imageUrl ?? undefined,
                      id: updatedCustomization.id ?? 0,
                      subdomain: updatedCustomization.slug ?? undefined,
                      primaryColor:
                        updatedCustomization.primaryColor ?? undefined,
                      secondaryColor:
                        updatedCustomization.secondaryColor ?? undefined,
                      loginImageUrl: updatedCustomization.loginImageUrl ?? undefined,
                    });
                  }
                }

                toast.success("Customização salva com sucesso!");
              } catch (error) {
                console.error("Erro ao salvar a customização", error);
                const errorMessage = error instanceof Error ? error.message : "Erro ao salvar a customização";
                toast.error(errorMessage);
              } finally {
                setIsSavingCustomization(false);
              }
            }}
            className="space-y-6"
          >
            <Card className="border-1">
              <CardHeader className="border-b border-border">
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <Palette className="h-5 w-5" />
                  Customização do ISO
                </CardTitle>
              </CardHeader>
              {isFirstStepComplete && (
                <>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {/* Coluna Esquerda - Imagens */}
                      <div className="space-y-4">
                        {/* Upload de Imagem */}
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-2">
                            Imagem ou Logotipo
                          </label>
                          <input
                            type="file"
                            accept="image/jpeg,image/jpg,image/png"
                            name="image"
                            id="image"
                            onChange={handleImageChange}
                            className="block w-full text-sm text-foreground
                              file:mr-4 file:py-2 file:px-4
                              file:rounded file:border-0
                              file:text-sm file:font-semibold
                              file:bg-secondary file:text-gray-700
                              hover:file:bg-gray-300
                              file:cursor-pointer
                              dark:file:bg-white"
                          />
                          <p className="mt-1 text-xs text-muted-foreground">
                            Apenas arquivos nos formatos JPG, JPEG e PNG são
                            aceitos
                          </p>
                          {imageError && (
                            <p className="mt-1 text-xs text-red-500 font-medium">
                              {imageError}
                            </p>
                          )}
                        </div>

                        {/* Preview da Imagem Selecionada */}
                        {imagePreview && (
                          <div>
                            <p className="text-sm text-foreground mb-1">
                              Pré-visualização:
                            </p>
                            {/* Usa img simples pra evitar problemas com next/image */}
                            <Image
                              src={imagePreview}
                              alt={"image preview"}
                              height={100}
                              width={100}
                            ></Image>
                          </div>
                        )}

                        {/* Preview da Imagem Atual */}
                        {customizationData?.imageUrl && !imagePreview && (
                          <div>
                            <p className="text-sm text-foreground mb-1">
                              Logo atual:
                            </p>
                            <Image
                              src={customizationData.imageUrl}
                              alt={""}
                              height={100}
                              width={100}
                            ></Image>
                          </div>
                        )}

                        {/* Upload de Imagem de Login */}
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-2">
                            Imagem de Fundo do Login
                          </label>
                          <input
                            type="file"
                            accept="image/jpeg,image/jpg,image/png"
                            name="loginImage"
                            id="loginImage"
                            onChange={handleLoginImageChange}
                            className="block w-full text-sm text-foreground
                              file:mr-4 file:py-2 file:px-4
                              file:rounded file:border-0
                              file:text-sm file:font-semibold
                              file:bg-secondary file:text-gray-700
                              hover:file:bg-gray-300
                              file:cursor-pointer
                              dark:file:bg-white"
                          />
                          <p className="mt-1 text-xs text-muted-foreground">
                            Imagem que será exibida como fundo na tela de login (JPG, JPEG, PNG - máx. 5MB)
                          </p>
                          {loginImageError && (
                            <p className="mt-1 text-xs text-red-500 font-medium">
                              {loginImageError}
                            </p>
                          )}
                        </div>

                        {/* Preview da Imagem de Login */}
                        {loginImagePreview && (
                          <div className="mt-4">
                            <p className="text-sm text-foreground mb-2">
                              Preview da Imagem de Fundo:
                            </p>
                            <div className="border rounded-lg overflow-hidden">
                              <Image
                                src={loginImagePreview}
                                alt="Login background preview"
                                width={400}
                                height={225}
                                className="w-full h-48 object-cover"
                              />
                            </div>
                          </div>
                        )}

                        {/* Preview da Imagem de Login Atual */}
                        {customizationData?.loginImageUrl && !loginImagePreview && (
                          <div className="mt-4">
                            <p className="text-sm text-foreground mb-2">
                              Imagem de fundo atual:
                            </p>
                            <div className="border rounded-lg overflow-hidden">
                              <Image
                                src={customizationData.loginImageUrl}
                                alt="Current login background"
                                width={400}
                                height={225}
                                className="w-full h-48 object-cover"
                              />
                            </div>
                          </div>
                        )}

                        {/* Upload de Favicon */}
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-2">
                            Favicon
                          </label>
                          <input
                            type="file"
                            accept="image/x-icon,image/vnd.microsoft.icon,image/ico,image/png"
                            name="favicon"
                            id="favicon"
                            className="block w-full text-sm text-foreground
                              file:mr-4 file:py-2 file:px-4
                              file:rounded file:border-0
                              file:text-sm file:font-semibold
                              file:bg-secondary file:text-gray-700
                              hover:file:bg-gray-300
                              file:cursor-pointer
                              dark:file:bg-white"
                          />
                          <p className="mt-1 text-xs text-muted-foreground">
                            Ícone que aparecerá na aba do navegador (ICO, PNG - 16x16 ou 32x32 pixels)
                          </p>
                        </div>
                      </div>

                      {/* Coluna Direita - Cores */}
                      <div className="space-y-4">
                        {/* Cor Primária */}
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-1">
                            <div className="flex items-center gap-1">
                              <span>Cor Primária</span>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <button
                                      type="button"
                                      className="text-foreground p-1"
                                    >
                                      <Info className="w-4 h-4 text-muted-foreground" />
                                    </button>
                                  </TooltipTrigger>
                                  <TooltipContent side="top">
                                    <p>
                                      A cor primária deve ser uma cor escura.
                                    </p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                          </label>
                          <input
                            type="color"
                            name="primaryColor"
                            defaultValue={
                              customizationData?.primaryColor
                                ? hslToHex(customizationData.primaryColor)
                                : "#ffffff"
                            }
                            className="h-10 w-full p-0 border rounded cursor-pointer"
                          />
                        </div>

                        {/* Cor Secundária */}
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-1">
                            Cor Secundária
                          </label>
                          <input
                            type="color"
                            name="secondaryColor"
                            defaultValue={
                              customizationData?.secondaryColor
                                ? hslToHex(customizationData.secondaryColor)
                                : "#ffffff"
                            }
                            className="h-10 w-full p-0 border rounded cursor-pointer"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Campos ocultos */}
                    {customizationData?.id && (
                      <input
                        type="hidden"
                        name="id"
                        value={customizationData.id}
                      />
                    )}
                    <input
                      type="hidden"
                      name="customerId"
                      value={newCustomerId || ""}
                    />
                    <input
                      type="hidden"
                      name="subdomain"
                      value={iso.subdomain || customizationData?.subdomain || ""}
                    />
                  </CardContent>
                </>
              )}
              <div className="flex justify-end space-x-2 mt-4 pr-3">
                <Button
                  type="submit"
                  className="mt-6 p-2 cursor-pointer"
                  disabled={isSavingCustomization}
                >
                  {isSavingCustomization
                    ? "Salvando..."
                    : "Salvar personalização"}
                </Button>
              </div>
            </Card>
          </form>
          <div className="flex justify-start gap-2 mt-4 p-1">
            <Button
              variant="outline"
              className="cursor-pointer"
              onClick={() => handleStepChange("step1")}
            >
              ← Voltar
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
