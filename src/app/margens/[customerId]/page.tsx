import { Suspense } from 'react';
import { IsoDetailPage } from './iso-detail-page';
import { getIsoDetail, getAvailableTables, getFornecedoresList, getUserRole, getCanValidateMdr, checkIsSuperAdminForView, getEffectiveUserId } from '../actions-new';
import { notFound, redirect } from 'next/navigation';
import BaseHeader from '@/components/layout/base-header';
import BaseBody from '@/components/layout/base-body';

interface PageProps {
  params: Promise<{ customerId: string }>;
}

export default async function Page({ params }: PageProps) {
  const { customerId } = await params;
  const customerIdNum = parseInt(customerId, 10);
  
  if (isNaN(customerIdNum)) {
    notFound();
  }

  const { targetUserId, isSimulating } = await getEffectiveUserId();

  const [detail, availableTables, fornecedores, userRole, canValidateMdr, isSuperAdminForView] = await Promise.all([
    getIsoDetail(customerIdNum, targetUserId),
    getAvailableTables(),
    getFornecedoresList(),
    getUserRole(targetUserId),
    getCanValidateMdr(),
    checkIsSuperAdminForView(targetUserId)
  ]);

  if (!detail) {
    notFound();
  }

  if (userRole === 'executivo') {
    redirect('/fechamento');
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <BaseHeader 
        breadcrumbItems={[
          { title: 'Margens', url: '/margens' },
          { title: detail.config?.customerName || 'ISO' }
        ]}
        showBackButton={true}
        backHref="/margens"
      />
      <BaseBody
        title={detail.config?.customerName || 'ISO'}
        subtitle="Configure as margens e vincule tabelas de MDR para este ISO"
      >
        <Suspense fallback={<div className="p-8 text-white">Carregando...</div>}>
          <IsoDetailPage 
            customerId={customerIdNum}
            config={detail.config}
            linkedTables={detail.linkedTables}
            availableTables={availableTables}
            fornecedores={fornecedores}
            userRole={userRole}
            canValidateMdr={canValidateMdr}
            isSuperAdmin={isSuperAdminForView}
            isSimulating={isSimulating}
          />
        </Suspense>
      </BaseBody>
    </div>
  );
}
