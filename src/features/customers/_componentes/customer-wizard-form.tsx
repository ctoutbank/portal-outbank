"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import CustomerForm from "./customer-formm";
import { CustomerSchema } from "../schema/schema";
import UserCustomerForm from "../users/_components/user-form";
import UsersCustomerList from "../users/_components/user-table-updated";
import { UserDetail, getUsersByCustomerId } from "../users/_actions/use-Actions";
import { ProfileDD, UserDetailForm, getUserDetailWithClerk } from "../users/_actions/user-actions";
import { Input } from "@/components/ui/input";
import {getCustomizationByCustomerId, saveCustomization, updateCustomization} from "@/utils/serverActions";
import Image from "next/image";

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
  const [activeTab, setActiveTab] = useState(activeTabDefault);
  const [newCustomerId, setNewCustomerId] = useState<number | null>(
      customer.id || null
  );
  const [isFirstStepComplete, setIsFirstStepComplete] = useState(!!customer.id);
  const [users, setUsers] = useState<UserDetail[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
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
    const loadCustomization = async () => {
      if (newCustomerId) {
        const response = await getCustomizationByCustomerId(newCustomerId);
        if (response) {
          setCustomizationData({
            imageUrl: response.imageUrl ?? undefined,
            id: response.id,
            subdomain: response.name,
            primaryColor: response.primaryColor ?? undefined,
            secondaryColor: response.secondaryColor ?? undefined,
          });
        }
      }
    };

    loadCustomization();
  }, [newCustomerId]);


  function hslToHex(hsl: string): string {
    const [h, s, l] = hsl.split(' ').map((value, index) =>
        index === 0 ? parseFloat(value) : parseFloat(value) / 100
    );

    const a = s * Math.min(l, 1 - l);
    const f = (n: number) => {
      const k = (n + h / 30) % 12;
      const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
      return Math.round(255 * color).toString(16).padStart(2, '0');
    };

    return `#${f(0)}${f(8)}${f(4)}`;
  }

  const handleStepChange = (value: string) => {
    // Só permite ir para o segundo passo se o cliente foi criado
    if (value === "step2" && !isFirstStepComplete) {
      toast.error(
          "É necessário criar o cliente antes de configurar os usuários"
      );
      return;
    }
    setActiveTab(value);
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
  };

  // Função que será passada para o CustomerForm para notificar quando o cliente for criado
  const handleFirstStepComplete = (id: number) => {
    onCustomerCreated(id);
  };

  // Função para recarregar a lista de usuários
  const loadUsers = async (customerId: number) => {
    setIsLoadingUsers(true);
    try {
      const response = await getUsersByCustomerId(customerId);
      setUsers(response.data);
    } catch (error) {
      console.error("Erro ao carregar usuários:", error);
      toast.error("Não foi possível carregar os usuários");
    } finally {
      setIsLoadingUsers(false);
    }
  };

  // Carregar usuários quando o componente for montado (se já tiver um cliente)
  useEffect(() => {
    if (isFirstStepComplete && newCustomerId) {
      loadUsers(newCustomerId);
    }
  }, [isFirstStepComplete, newCustomerId]);

  // Carregar dados completos do usuário quando um for selecionado para edição
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

  // Função para lidar com a criação ou atualização bem-sucedida de um usuário
  const handleUserSuccess = () => {
    if (newCustomerId) {
      loadUsers(newCustomerId);
    }
    setSelectedUser(null);
    setUserToEdit(null);
  };

  console.log("CUSTOMERID", newCustomerId);

  return (
      <div className="w-full">
        <Tabs
            value={activeTab}
            onValueChange={handleStepChange}
            className="w-full"
        >
          <div className="flex justify-center w-full mb-4">
            <div className="w-full md:w-1/3">
              <TabsList className="grid grid-cols-3 w-full">
                <TabsTrigger value="step1" className="text-sm">
                  1. Criar ISO
                </TabsTrigger>
                <TabsTrigger
                    value="step2"
                    className="text-sm"
                    disabled={!isFirstStepComplete}
                >
                  2. Configurar Usuários
                </TabsTrigger>
                <TabsTrigger
                    value="step3"
                    className="text-sm"
                    disabled={!isFirstStepComplete}
                >
                  3. Personalização
                </TabsTrigger>
              </TabsList>
            </div>
          </div>

          <TabsContent value="step1">
            <Card className="border-0 shadow-none">
              <CardContent className="p-0">
                <CustomerForm
                    customer={customer}
                    onSuccess={handleFirstStepComplete}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="step2">
            <Card className="border-0 shadow-none">

              {isFirstStepComplete && (
                  <>
                    <div className="flex justify-between items-center mb-4">
                      <div>
                        <h2 className="text-xl font-semibold">
                          Usuários do ISO
                        </h2>
                        <p className="text-sm text-muted-foreground">
                          Gerencie os usuários associados a este ISO
                        </p>
                      </div>

                    </div>

                    {selectedUser === null ? (
                        <div className="space-y-6">

                          <CardContent className="">
                            <h3 className="text-lg font-medium mb-4">Novo Usuário</h3>
                            <UserCustomerForm
                                customerId={newCustomerId || undefined}
                                onSuccess={handleUserSuccess}
                                profiles={profiles}
                            />
                          </CardContent>


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
          </TabsContent>
          <TabsContent value="step3">
            <div className="flex justify-between items-center mb-4 pl-5">
              <div>
                <h2 className="text-xl font-semibold flex">Personalização do ISO</h2>
                <p className="text-sm text-muted-foreground">
                  Escolha as cores e imagem da identidade visual
                </p>
              </div>
            </div>

            <form action={customizationData ? updateCustomization : saveCustomization} className="space-y-6">
              <Card className="border-1">
                {isFirstStepComplete && (
                    <>
                      <CardContent>
                        <h3 className="text-lg font-medium mb-4">Configurações Visuais</h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          {/* Coluna Esquerda - Subdomínio e Imagem */}
                          <div className="space-y-4">
                            {/* Subdomínio */}
                            <div>
                              <label className="block text-sm font-medium text-gray-200 mb-2">
                                Nome do Subdomínio
                              </label>
                              <Input
                                  className="w-full"
                                  placeholder="Meu subdomínio"
                                  name="subdomain"
                                  defaultValue={customizationData?.subdomain || ""}
                              />
                            </div>

                            {/* Upload de Imagem */}
                            <div>
                              <label className="block text-sm font-medium text-gray-200 mb-2">
                                Imagem ou Logotipo
                              </label>
                              <input
                                  type="file"
                                  accept="image/*"
                                  name="image"
                                  id="image"
                                  onChange={handleImageChange}
                                  className="block w-full text-sm text-gray-200
                          file:mr-4 file:py-2 file:px-4
                          file:rounded file:border-0
                          file:text-sm file:font-semibold
                          file:bg-primary file:text-gray-700
                          hover:file:bg-primary/80"
                              />
                            </div>

                            {/* Preview da Imagem Selecionada */}
                            {imagePreview && (
                                <div>
                                  <p className="text-sm text-gray-400 mb-1">Pré-visualização:</p>
                                  {/* Usa img simples pra evitar problemas com next/image */}
                                  <Image src={imagePreview} alt={"image preview"} height={100} width={100}></Image>
                                </div>
                            )}

                            {/* Preview da Imagem Atual */}
                            {customizationData?.imageUrl && !imagePreview && (
                                <div>
                                  <p className="text-sm text-gray-400 mb-1">Logo atual:</p>
                                  <Image src={customizationData.imageUrl} alt={"imagem atual"} height={100} width={100}></Image>
                                </div>
                            )}
                          </div>

                          {/* Coluna Direita - Cores */}
                          <div className="space-y-4">
                            {/* Cor Primária */}
                            <div>
                              <label className="block text-sm font-medium text-gray-200 mb-1">
                                Cor Primária
                              </label>
                              <input
                                  type="color"
                                  name="primaryColor"
                                  defaultValue={customizationData?.primaryColor ? hslToHex(customizationData.primaryColor) : "#ffffff"}
                                  className="h-10 w-full p-0 border rounded"
                              />
                            </div>

                            {/* Cor Secundária */}
                            <div>
                              <label className="block text-sm font-medium text-gray-200 mb-1">
                                Cor Secundária
                              </label>
                              <input
                                  type="color"
                                  name="secondaryColor"
                                  defaultValue={customizationData?.secondaryColor ? hslToHex(customizationData.secondaryColor) : "#ffffff"}
                                  className="h-10 w-full p-0 border rounded"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Campos ocultos */}
                        {customizationData?.id && (
                            <input type="hidden" name="id" value={customizationData.id} />
                        )}
                        <input type="hidden" name="customerId" value={newCustomerId || ""} />
                      </CardContent>
                    </>
                )}
                <Button type="submit" className="mt-6">
                  Salvar personalização
                </Button>
              </Card>
            </form>
          </TabsContent>
        </Tabs>
      </div>
  );
}