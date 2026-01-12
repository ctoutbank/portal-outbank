import { Suspense } from 'react';
import { MargensWrapper } from './margens-wrapper';
import { getIsoList, getUserRole, checkIsSuperAdminForView, getEffectiveUserId } from './actions-new';
import BaseHeader from '@/components/layout/base-header';
import BaseBody from '@/components/layout/base-body';

export default async function Page() {
  const { targetUserId, isSimulating } = await getEffectiveUserId();
  
  const [isoConfigs, userRole, isSuperAdminForView] = await Promise.all([
    getIsoList(targetUserId),
    getUserRole(targetUserId),
    checkIsSuperAdminForView(targetUserId)
  ]);

  return (
    <>
      <BaseHeader 
        breadcrumbItems={[
          { title: 'Margens' }
        ]}
        showBackButton={true}
        backHref="/"
      />
      <BaseBody
        title="Margens dos ISOs"
        subtitle="Configure as margens de lucro para cada ISO"
      >
        <Suspense fallback={<div className="p-8 text-white">Carregando...</div>}>
          <MargensWrapper 
            initialIsoConfigs={isoConfigs} 
            initialUserRole={userRole}
            initialIsSuperAdmin={isSuperAdminForView}
            initialIsSimulating={isSimulating}
            initialSimulatedUserId={targetUserId}
          />
        </Suspense>
      </BaseBody>
    </>
  );
}
