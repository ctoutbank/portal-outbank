import BaseBody from "@/components/layout/base-body";
import BaseHeader from "@/components/layout/base-header";
import { getTransactionBySlug } from "@/features/transactions/serverActions/transaction";
import { checkPagePermission } from "@/lib/auth/check-permissions";
import TransactionDetails from "@/features/transactions/_components/transaction-details";
import { notFound } from "next/navigation";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function TransactionDetailPage({ params }: PageProps) {
  await checkPagePermission("Lançamentos Financeiros");
  
  const { slug } = await params;
  const transaction = await getTransactionBySlug(slug);

  if (!transaction) {
    notFound();
  }

  return (
    <>
      <BaseHeader
        breadcrumbItems={[
          { title: "Vendas", url: "/transactions" },
          { title: "Detalhes", url: `/transactions/${slug}` },
        ]}
      />
      <BaseBody title="Detalhes da Transação" subtitle="">
        <TransactionDetails transaction={transaction} />
      </BaseBody>
    </>
  );
}

