import BaseBody from "@/components/layout/base-body";
import BaseHeader from "@/components/layout/base-header";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function NotFound() {
  return (
    <>
      <BaseHeader
        breadcrumbItems={[
          { title: "Vendas", subtitle: "", url: "/transactions" },
          { title: "Não encontrado", subtitle: "", url: "#" },
        ]}
      />
      <BaseBody title="Transação não encontrada" subtitle="">
        <div className="flex flex-col items-center justify-center space-y-4 py-8">
          <p className="text-muted-foreground">
            A transação solicitada não foi encontrada ou você não tem permissão para visualizá-la.
          </p>
          <Link href="/transactions">
            <Button variant="outline">Voltar para Vendas</Button>
          </Link>
        </div>
      </BaseBody>
    </>
  );
}

