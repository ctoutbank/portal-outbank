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
