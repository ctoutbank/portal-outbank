import BaseBody from "@/components/layout/base-body";
import BaseHeader from "@/components/layout/base-header";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";

export const revalidate = 0;

export default async function Customerspage() {
  return (
    <>
      <BaseHeader
        breadcrumbItems={[{ title: "Clientes", url: "/customers" }]}
      />

      <BaseBody title="Clientes" subtitle={`visualização de todos os Clientes`}>
        <div className="flex flex-col space-y-4">
          <div className="mb-1 flex items-center justify-between">
            <div className="flex-1"></div>
            <Button asChild className="ml-2">
              <Link href="/portal/categories/0">
                <Plus className="h-4 w-4 mr-1" />
                Novo Cliente
              </Link>
            </Button>
          </div>

          <div className="flex items-start justify-between gap-4 mb-2">
            <div className="flex-grow">
              Teste
            </div>
          </div>
        </div>
      </BaseBody>
    </>
  );
}
