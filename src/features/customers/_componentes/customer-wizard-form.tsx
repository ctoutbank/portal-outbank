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
import { Input } from "@/components/ui/input";
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
  
  }, [stepFromUrl]);

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
            subdomain: response.name ?? undefined,
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
  const [colorPrimaryHex, setColorPrimaryHex] = useState<string>("#1E40AF");
  const [colorSecondaryHex, setColorSecondaryHex] = useState<string>("#3B82F6");
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [lastAutoSave, setLastAutoSave] = useState<Date | null>(null);

  useEffect(() => {
    if (customizationData?.primaryColor) {
      const primaryHex = hslToHex(customizationData.primaryColor);
      setColorPrimaryHex(primaryHex);
    }
    if (customizationData?.secondaryColor) {
      const secondaryHex = hslToHex(customizationData.secondaryColor);
      setColorSecondaryHex(secondaryHex);
    }
  }, [customizationData?.primaryColor, customizationData?.secondaryColor]);

  useEffect(() => {
    if (!newCustomerId || !isFirstStepComplete || activeTab !== "step1") {
      return;
    }

    const autoSaveInterval = setInterval(async () => {
      setIsAutoSaving(true);
      try {
        const form = document.getElementById("customizationForm") as HTMLFormElement;
        if (form) {
          const formData = new FormData(form);
          
          if (customizationData) {
            await updateCustomization(formData);
          } else {
            await saveCustomization(formData);
          }

          setLastAutoSave(new Date());
        }
      } catch (error) {
        console.error("Erro ao salvar automaticamente", error);
      } finally {
        setIsAutoSaving(false);
      }
    }, 30000); // 30 seconds

    return () => clearInterval(autoSaveInterval);
  }, [newCustomerId, isFirstStepComplete, activeTab, customizationData]);

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

  // Função para marcar que o primeiro passo foi concluído e passar para o próximo
  const onCustomerCreated = (id: number) => {
    setNewCustomerId(id);
    setIsFirstStepComplete(true);
    loadUsers(id);
  };

  // Função que será passada para o CustomerForm para notificar quando o cliente for criado
  const handleFirstStepComplete = (id: number) => {
    onCustomerCreated(id);
  };

  // Função para salvar rascunho sem validações obrigatórias
  const handleSaveDraft = async () => {
    if (!newCustomerId) {
      toast.error("Crie o ISO primeiro antes de salvar o rascunho");
      return;
    }

    setIsSavingCustomization(true);
    try {
      const form = document.getElementById("customizationForm") as HTMLFormElement;
      if (form) {
        const formData = new FormData(form);
        
        if (customizationData) {
          await updateCustomization(formData);
        } else {
          await saveCustomization(formData);
        }

        if (newCustomerId) {
          const updatedCustomization = await getCustomizationByCustomerId(newCustomerId);
          if (updatedCustomization) {
            setCustomizationData({
              imageUrl: updatedCustomization.imageUrl ?? undefined,
              loginImageUrl: updatedCustomization.loginImageUrl ?? undefined,
              id: updatedCustomization.id ?? 0,
              subdomain: updatedCustomization.name ?? undefined,
              primaryColor: updatedCustomization.primaryColor ?? undefined,
              secondaryColor: updatedCustomization.secondaryColor ?? undefined,
            });
          }
        }

        toast.success("Rascunho salvo com sucesso!");
      }
    } catch (error) {
      console.error("Erro ao salvar rascunho", error);
      toast.error("Erro ao salvar rascunho");
    } finally {
      setIsSavingCustomization(false);
    }
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

  const [subdomainValue, setSubdomainValue] = useState("");
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});
  const [isSavingCustomization, setIsSavingCustomization] = useState(false);

  useEffect(() => {
    if (customizationData?.subdomain) {
      setSubdomainValue(customizationData.subdomain);
    }
  }, [customizationData?.subdomain]);

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
                Configuração Geral
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
                Usuários
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
            1. Configuração Geral
          </TabsTrigger>
          <TabsTrigger
            value="step2"
            className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 px-2 sm:px-4 data-[state=active]:bg-background data-[state=active]:text-foreground"
            onMouseDown={(e) => handleTabClick("step2", e)}
          >
            2. Usuários
          </TabsTrigger>
        </TabsList>

        <TabsContent value="step1" className="space-y-4">
          {/* 2-Column Layout: 60% Form / 40% Preview */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Left Column (60% - 3/5 cols) - Forms */}
            <div className="lg:col-span-3 space-y-6">
              {/* CARD 1: Dados do ISO */}
              <Card className="border-0 shadow-none">
                <CardContent className="p-0">
                  <CustomerForm
                    customer={customer}
                    onSuccess={handleFirstStepComplete}
                  />
                </CardContent>
              </Card>

              {/* CARD 2: Personalização */}
              {isFirstStepComplete && (
                <Card className="border-1">
                  <CardHeader className="border-b border-border">
                    <CardTitle className="flex items-center gap-2 text-foreground">
                      <Palette className="h-5 w-5" />
                      Personalização
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <form
                      id="customizationForm"
                      onSubmit={async (e) => {
                        e.preventDefault();
                        setValidationErrors({});
                        setIsSavingCustomization(true);

                        const formData = new FormData(e.currentTarget);

                        const validationData = {
                          subdomain: subdomainValue,
                          primaryColor: formData.get("primaryColor") as string,
                          secondaryColor: formData.get("secondaryColor") as string,
                          image: formData.get("image"),
                          customerId: formData.get("customerId") as string,
                          id: customizationData?.id,
                        };

                        const validationResult = CustomizationSchema.safeParse(validationData);

                        if (!validationResult.success) {
                          const errors: Record<string, string> = {};
                          validationResult.error.errors.forEach((error) => {
                            if (error.path[0]) {
                              errors[error.path[0] as string] = error.message;
                            }
                          });
                          setValidationErrors(errors);
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

                          if (newCustomerId) {
                            const updatedCustomization = await getCustomizationByCustomerId(newCustomerId);
                            if (updatedCustomization) {
                              setCustomizationData({
                                imageUrl: updatedCustomization.imageUrl ?? undefined,
                                loginImageUrl: updatedCustomization.loginImageUrl ?? undefined,
                                id: updatedCustomization.id ?? 0,
                                subdomain: updatedCustomization.name ?? undefined,
                                primaryColor: updatedCustomization.primaryColor ?? undefined,
                                secondaryColor: updatedCustomization.secondaryColor ?? undefined,
                              });
                            }
                          }

                          toast.success("Customização salva com sucesso!");
                        } catch (error) {
                          console.error("Erro ao salvar a customização", error);
                          toast.error("Erro ao salvar a customização");
                        } finally {
                          setIsSavingCustomization(false);
                        }
                      }}
                      className="space-y-6"
                    >
                      {/* Subdomínio */}
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1">
                          <div className="flex items-center gap-1">
                            <span>Nome do subdomínio</span>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <button type="button" className="text-muted-foreground p-1">
                                    <Info className="w-4 h-4 text-muted-foreground" />
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent side="top" className="z-50">
                                  <p>Este será o seu endereço de acesso ao portal: meusubdominio.consolle.one</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        </label>
                        <Input
                          maxLength={15}
                          value={subdomainValue}
                          onChange={(e) => {
                            const sanitized = e.target.value.replace(/[^a-zA-Z0-9À-ÿ\s]/g, "").toLowerCase();
                            setSubdomainValue(sanitized);
                            if (validationErrors.subdomain) {
                              setValidationErrors((prev) => {
                                const newErrors = { ...prev };
                                delete newErrors.subdomain;
                                return newErrors;
                              });
                            }
                          }}
                          className={`w-full ${validationErrors.subdomain ? "border-red-500" : ""}`}
                          placeholder="Meu subdomínio"
                          name="subdomain"
                        />
                        {validationErrors.subdomain && (
                          <p className="mt-1 text-xs text-red-500 font-medium">{validationErrors.subdomain}</p>
                        )}
                      </div>

                      {/* Cores */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-1">
                            <div className="flex items-center gap-1">
                              <span>Cor Primária</span>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <button type="button" className="text-foreground p-1">
                                      <Info className="w-4 h-4 text-muted-foreground" />
                                    </button>
                                  </TooltipTrigger>
                                  <TooltipContent side="top">
                                    <p>A cor primária deve ser uma cor escura.</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                          </label>
                          <input
                            type="color"
                            name="primaryColor"
                            id="primaryColorInput"
                            value={colorPrimaryHex}
                            onChange={(e) => setColorPrimaryHex(e.target.value)}
                            className="h-10 w-full p-0 border rounded cursor-pointer"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-1">Cor Secundária</label>
                          <input
                            type="color"
                            name="secondaryColor"
                            id="secondaryColorInput"
                            value={colorSecondaryHex}
                            onChange={(e) => setColorSecondaryHex(e.target.value)}
                            className="h-10 w-full p-0 border rounded cursor-pointer"
                          />
                        </div>
                      </div>

                      {/* Paleta de Cores Sugeridas */}
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">Paleta de Cores Sugeridas</label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {[
                            { name: "Profissional", primary: "#1E40AF", secondary: "#3B82F6" },
                            { name: "Moderno", primary: "#7C3AED", secondary: "#EC4899" },
                            { name: "Vibrante", primary: "#EA580C", secondary: "#F59E0B" },
                            { name: "Minimalista", primary: "#374151", secondary: "#06B6D4" },
                            { name: "Corporativo", primary: "#1F2937", secondary: "#F59E0B" },
                            { name: "Tech", primary: "#047857", secondary: "#10B981" },
                          ].map((palette) => (
                            <button
                              key={palette.name}
                              type="button"
                              onClick={() => {
                                setColorPrimaryHex(palette.primary);
                                setColorSecondaryHex(palette.secondary);
                              }}
                              className="flex items-center gap-2 p-2 border rounded hover:bg-muted transition-colors cursor-pointer"
                            >
                              <div className="flex gap-1">
                                <div className="w-6 h-6 rounded" style={{ backgroundColor: palette.primary }} />
                                <div className="w-6 h-6 rounded" style={{ backgroundColor: palette.secondary }} />
                              </div>
                              <span className="text-xs font-medium">{palette.name}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Upload de Logo */}
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">Imagem ou Logotipo</label>
                        <input
                          type="file"
                          accept="image/jpeg,image/jpg,image/png"
                          name="image"
                          id="image"
                          onChange={handleImageChange}
                          className="block w-full text-sm text-foreground file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-secondary file:text-gray-700 hover:file:bg-gray-300 file:cursor-pointer dark:file:bg-white"
                        />
                        <p className="mt-1 text-xs text-muted-foreground">Apenas arquivos nos formatos JPG, JPEG e PNG são aceitos</p>
                        {imageError && <p className="mt-1 text-xs text-red-500 font-medium">{imageError}</p>}
                      </div>

                      {imagePreview && (
                        <div>
                          <p className="text-sm text-foreground mb-1">Pré-visualização:</p>
                          <Image src={imagePreview} alt="image preview" height={100} width={100} />
                        </div>
                      )}

                      {customizationData?.imageUrl && !imagePreview && (
                        <div>
                          <p className="text-sm text-foreground mb-1">Logo atual:</p>
                          <Image src={customizationData.imageUrl} alt="" height={100} width={100} />
                        </div>
                      )}

                      {/* Upload de Imagem de Login */}
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">Imagem de Fundo do Login</label>
                        <input
                          type="file"
                          accept="image/jpeg,image/jpg,image/png"
                          name="loginImage"
                          id="loginImage"
                          onChange={handleLoginImageChange}
                          className="block w-full text-sm text-foreground file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-secondary file:text-gray-700 hover:file:bg-gray-300 file:cursor-pointer dark:file:bg-white"
                        />
                        <p className="mt-1 text-xs text-muted-foreground">Imagem que será exibida como fundo na tela de login (JPG, JPEG, PNG - máx. 5MB)</p>
                        {loginImageError && <p className="mt-1 text-xs text-red-500 font-medium">{loginImageError}</p>}
                      </div>

                      {loginImagePreview && (
                        <div className="mt-4">
                          <p className="text-sm text-foreground mb-2">Preview da Imagem de Fundo:</p>
                          <div className="border rounded-lg overflow-hidden">
                            <Image src={loginImagePreview} alt="Login background preview" width={400} height={225} className="w-full h-48 object-cover" />
                          </div>
                        </div>
                      )}

                      {customizationData?.loginImageUrl && !loginImagePreview && (
                        <div className="mt-4">
                          <p className="text-sm text-foreground mb-2">Imagem de fundo atual:</p>
                          <div className="border rounded-lg overflow-hidden">
                            <Image src={customizationData.loginImageUrl} alt="Current login background" width={400} height={225} className="w-full h-48 object-cover" />
                          </div>
                        </div>
                      )}

                      {/* Upload de Favicon */}
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">Favicon</label>
                        <input
                          type="file"
                          accept="image/x-icon,image/vnd.microsoft.icon,image/ico,image/png"
                          name="favicon"
                          id="favicon"
                          className="block w-full text-sm text-foreground file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-secondary file:text-gray-700 hover:file:bg-gray-300 file:cursor-pointer dark:file:bg-white"
                        />
                        <p className="mt-1 text-xs text-muted-foreground">Ícone que aparecerá na aba do navegador (ICO, PNG - 16x16 ou 32x32 pixels)</p>
                      </div>

                      {customizationData?.id && <input type="hidden" name="id" value={customizationData.id} />}
                      <input type="hidden" name="customerId" value={newCustomerId || ""} />

                      <div className="flex justify-end">
                        <Button type="submit" className="cursor-pointer" disabled={isSavingCustomization}>
                          {isSavingCustomization ? "Salvando..." : "Salvar personalização"}
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Right Column (40% - 2/5 cols) - Preview */}
            <div className="lg:col-span-2">
              {/* Auto-save indicator */}
              {isAutoSaving && (
                <div className="mb-2 text-xs text-muted-foreground flex items-center gap-1">
                  <span className="animate-pulse">●</span>
                  <span>Salvando automaticamente...</span>
                </div>
              )}
              {!isAutoSaving && lastAutoSave && (
                <div className="mb-2 text-xs text-muted-foreground">
                  Salvo há {Math.floor((new Date().getTime() - lastAutoSave.getTime()) / 1000)}s
                </div>
              )}
              <Card className="border lg:sticky lg:top-4">
                <CardHeader className="border-b border-border">
                  <CardTitle className="text-sm font-medium">Preview em Tempo Real</CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  {/* Login Page Mockup */}
                  <div className="border rounded-lg overflow-hidden bg-background shadow-sm">
                    <div className="flex h-[400px]">
                      {/* Left side - Background Image (60%) */}
                      <div className="w-[60%] relative bg-gradient-to-br from-blue-500 to-purple-600">
                        {(loginImagePreview || customizationData?.loginImageUrl) ? (
                          <Image
                            src={loginImagePreview || customizationData?.loginImageUrl || ""}
                            alt="Login Background"
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center text-white/50 text-xs">
                            Imagem de Fundo
                          </div>
                        )}
                      </div>
                      
                      {/* Right side - Login Form (40%) */}
                      <div className="w-[40%] bg-background p-6 flex flex-col justify-center">
                        {/* Logo */}
                        <div className="mb-6 flex justify-center">
                          {(imagePreview || customizationData?.imageUrl) ? (
                            <div className="relative w-16 h-16">
                              <Image
                                src={imagePreview || customizationData?.imageUrl || ""}
                                alt="Logo"
                                fill
                                className="object-contain"
                              />
                            </div>
                          ) : (
                            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center text-xs text-muted-foreground">
                              Logo
                            </div>
                          )}
                        </div>
                        
                        {/* ISO Name */}
                        <h2 className="text-lg font-semibold text-center mb-6">
                          {customer.name || "Nome do ISO"}
                        </h2>
                        
                        {/* Login Form Fields (mockup) */}
                        <div className="space-y-3">
                          <div>
                            <div className="h-8 bg-muted rounded text-xs flex items-center px-2 text-muted-foreground">
                              Email
                            </div>
                          </div>
                          <div>
                            <div className="h-8 bg-muted rounded text-xs flex items-center px-2 text-muted-foreground">
                              Senha
                            </div>
                          </div>
                          <button
                            type="button"
                            className="w-full h-9 rounded text-sm font-medium text-white transition-colors"
                            style={{
                              backgroundColor: colorPrimaryHex
                            }}
                          >
                            Entrar
                          </button>
                        </div>
                        
                        {/* Footer link */}
                        <div className="mt-4 text-center">
                          <a
                            href="#"
                            className="text-xs transition-colors"
                            style={{
                              color: colorSecondaryHex
                            }}
                          >
                            Esqueci minha senha
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Preview Info */}
                  <div className="mt-4 text-xs text-muted-foreground text-center">
                    <p>Preview atualiza conforme você altera os campos acima</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="flex justify-between gap-2 mt-4">
            <Button
              variant="outline"
              onClick={handleSaveDraft}
              disabled={!isFirstStepComplete || isSavingCustomization}
              className="cursor-pointer"
            >
              Salvar Rascunho
            </Button>
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

        <TabsContent value="step2" className="space-y-4">
          <Card className="border-0 shadow-none">
            {isFirstStepComplete && (
              <>
                {selectedUser === null ? (
                  <div className="space-y-6">
                    <UserCustomerForm
                      customerId={newCustomerId || undefined}
                      onSuccess={handleUserSuccess}
                      profiles={profiles}
                    />

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
                ) : (
                  <div className="space-y-4">
                    <Card>
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
                        />
                      )}
                    </Card>
                  </div>
                )}
              </>
            )}
          </Card>
          <div className="flex justify-start gap-2 mt-4">
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
