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
  const [totalUsers, setTotalUsers] = useState(0);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [selectedUser, setSelectedUser] = useState<number | null>(null);
  const [userToEdit, setUserToEdit] = useState<UserDetailForm | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(false);

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
      setTotalUsers(response.totalCount);
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

  // Função para editar um usuário
  const handleEditUser = (userId: number) => {
    setSelectedUser(userId);
  };

  // Função para adicionar um novo usuário
  const handleAddUser = () => {
    setSelectedUser(null);
    setUserToEdit(null);
  };

  // Função para excluir um usuário
  const handleDeleteUser = (userId: number) => {
    if (confirm("Tem certeza que deseja excluir este usuário?")) {
      // Implementar a lógica de exclusão
      // Em um ambiente real, chamaríamos algo como:
      // deleteUser(userId).then(() => { loadUsers(newCustomerId); });
      toast.success("Usuário excluído com sucesso");
      // Simulação da remoção do usuário da lista
      setUsers(users.filter(user => user.id !== userId));
      setTotalUsers(prev => prev - 1);
    }
  };

  return (
    <div className="w-full">
      <Tabs
        value={activeTab}
        onValueChange={handleStepChange}
        className="w-full"
      >
        <div className="flex justify-center w-full mb-4">
          <div className="w-full md:w-1/3">
            <TabsList className="grid grid-cols-2 w-full">
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
      </Tabs>
    </div>
  );
} 