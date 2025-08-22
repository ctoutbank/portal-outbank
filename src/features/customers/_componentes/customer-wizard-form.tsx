"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import CustomerForm from "./customer-form";
import { CustomerSchema } from "../schema/schema";
import UserCustomerForm from "../users/_components/user-form";
import UsersCustomerList from "../users/_components/user-table-updated";
import { useSearchParams, useRouter } from "next/navigation";
import { UserDetail } from "../users/_actions/use-Actions";
import {
  ProfileDD,
  UserDetailForm,
  getUserDetailWithClerk,
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
import { getUsersWithClerk } from "@/features/customers/users/_actions/users-actions";

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
  } | null>(null);

  useEffect(() => {
    // Sincroniza o activeTab com a URL se ela mudar externamente
    if (stepFromUrl !== activeTab) {
      setActiveTab(stepFromUrl);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepFromUrl]);

  useEffect(() => {
    const loadCustomization = async () => {
      if (newCustomerId) {
        const response = await getCustomizationByCustomerId(newCustomerId);
        if (response) {
          setCustomizationData({
            imageUrl: response.imageUrl ?? undefined,
            id: response.id ?? 0,
            subdomain: response.name ?? undefined,
            primaryColor: response.primaryColor ?? undefined,
            secondaryColor: response.secondaryColor ?? undefined,
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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setImagePreview(null);
    }
  };

  // Função para marcar que o primeiro passo foi concluído e passar para o próximo
  const onCustomerCreated = (id: number) => {
    setNewCustomerId(id);
    setIsFirstStepComplete(true);
    setActiveTab("step2");
    loadUsers(id);
    router.replace(`/customers/${id}?step=step2`, { scroll: false });
  };

  // Função que será passada para o CustomerForm para notificar quando o cliente for criado
  const handleFirstStepComplete = (id: number) => {
    onCustomerCreated(id);
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
        <TabsList className="grid w-full grid-cols-3 h-auto p-1 bg-muted">
          <TabsTrigger
            value="step1"
            className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 px-2 sm:px-4 data-[state=active]:bg-background data-[state=active]:text-foreground"
            onMouseDown={(e) => handleTabClick("step1", e)}
          >
            1. Criar ISO
          </TabsTrigger>
          <TabsTrigger
            value="step2"
            className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 px-2 sm:px-4 data-[state=active]:bg-background data-[state=active]:text-foreground"
            onMouseDown={(e) => handleTabClick("step2", e)}
          >
            2. Configurar Usuários
          </TabsTrigger>
          <TabsTrigger
            value="step3"
            className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 px-2 sm:px-4 data-[state=active]:bg-background data-[state=active]:text-foreground "
            onMouseDown={(e) => handleTabClick("step3", e)}
          >
            3. Personalização
          </TabsTrigger>
        </TabsList>

        <TabsContent value="step1" className="space-y-4">
          <Card className="border-0 shadow-none">
            <CardContent className="p-0">
              <CustomerForm
                customer={customer}
                onSuccess={handleFirstStepComplete}
              />
            </CardContent>
          </Card>
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
          <div className="flex justify-between gap-2 mt-4">
            <Button variant="outline" className="cursor-pointer" onClick={() => handleStepChange("step1")}>
              ← Voltar
            </Button>
            <Button variant="outline" className="cursor-pointer" onClick={() => handleStepChange("step3")}>
              Próximo →
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="step3">
          <form
              onSubmit={async (e) => {
                e.preventDefault();

                const formData = new FormData(e.currentTarget);

                try {
                  if (customizationData) {
                    await updateCustomization(formData);
                  } else {
                    await saveCustomization(formData);
                  }

                  toast.success("Customização salva com sucesso!");
                } catch (error) {
                  console.error("Erro ao salvar a customização", error);
                  toast.error("Erro ao salvar a customização");
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
                      {/* Coluna Esquerda - Subdomínio e Imagem */}
                      <div className="space-y-4">
                        {/* Subdomínio */}
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-1">
                            <div className="flex items-center gap-1">
                              <span>Nome do subdomínio</span>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <button
                                      type="button"
                                      className="text-muted-foreground p-1"
                                    >
                                      <Info className="w-4 h-4 text-muted-foreground" />
                                    </button>
                                  </TooltipTrigger>
                                  <TooltipContent side="top" className="z-50">
                                    <p>
                                      Este será o seu endereço de acesso ao
                                      portal: meusubdominio.consolle.one
                                    </p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                          </label>
                          <Input
                            maxLength={15}
                            value={subdomainValue}
                            onChange={(e) => {
                              const sanitized = e.target.value
                                  .replace(/[^a-zA-Z0-9À-ÿ\s]/g, "")
                                  .toLowerCase();
                              setSubdomainValue(sanitized);
                            }}
                            className="w-full"
                            placeholder="Meu subdomínio"
                            name="subdomain"
                          />
                        </div>

                        {/* Upload de Imagem */}
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-2">
                            Imagem ou Logotipo
                          </label>
                          <input
                            type="file"
                            accept="image/*"
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
                  </CardContent>
                </>
              )}
              <div className="flex justify-end space-x-2 mt-4 pr-3">
                <Button type="submit" className="mt-6 p-2 cursor-pointer">
                  Salvar personalização
                </Button>
              </div>
            </Card>
          </form>
          <div className="flex justify-start space-x-2 mt-4 p-1">
            <Button variant="outline" className="cursor-pointer" onClick={() => handleStepChange("step2")}>
              ← Voltar
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
