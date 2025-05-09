"use client";
import { CustomerSchema, SchemaCustomer } from "../schema/schema";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { insertCustomerFormAction, updateCustomerFormAction } from "../_actions/customers-formActions";

interface CustomersFormProps {
    customer: CustomerSchema | null;
}

export default function CustomersForm({ customer }: CustomersFormProps) {

    const router = useRouter();
    const form = useForm<CustomerSchema>({
        resolver: zodResolver(SchemaCustomer),
        defaultValues: customer || undefined,
    });

    const onSubmit = async (data: CustomerSchema) => {
        try{
            
            if(customer?.id){
                // Garantir que os dados estão completos
                const updateData = {
                    ...data,
                    id: customer.id,
                    slug: data.slug || customer.slug || "",
                    customerId: data.customerId || customer.customerId || undefined,
                    idParent: customer.idParent
                };
                
                await updateCustomerFormAction(updateData);
                toast.success("Cliente atualizado com sucesso");
                router.refresh();
            }else{
                // Gerar slug a partir do nome se não existir
                if (!data.slug && data.name) {
                    data.slug = data.name.toLowerCase().replace(/\s+/g, '-');
                }
                
                const result = await insertCustomerFormAction(data);
                toast.success("Cliente criado com sucesso");
                router.push(`/customers`);
                return result;
            }
        }catch(error){
            console.error(error);
            toast.error("Erro ao salvar cliente");
        }
        
    }


    return (
        <Card>
      <CardContent className="pt-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div id="main">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        value={field.value ? String(field.value) : ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              
                
              <FormField
                control={form.control}
                name="settlementManagementType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="mt-2">Tipo de gestão de liquidação</FormLabel>
                    <FormControl>
                      <Input
                        className="mb-2"
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              
              <div className="flex justify-end mt-4">
                <Button type="submit">Salvar</Button>
              </div>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
  







