import BaseBody from "@/components/layout/base-body";
import BaseHeader from "@/components/layout/base-header";
import { FechamentoWrapper } from "./fechamento-wrapper";

export default async function FechamentoPage() {
  return (
    <>
      <BaseHeader breadcrumbItems={[{ title: "Fechamento" }]} showBackButton={true} backHref="/" />
      <BaseBody title="" subtitle="">
        <FechamentoWrapper />
      </BaseBody>
    </>
  );
}
