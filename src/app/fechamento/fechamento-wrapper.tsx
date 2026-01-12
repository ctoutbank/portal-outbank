'use client';

import { FechamentoClient } from './fechamento-client';
import { useSimulatedUserId } from '@/contexts/ViewModeContext';

export function FechamentoWrapper() {
  const simulatedUserId = useSimulatedUserId();

  return <FechamentoClient key={simulatedUserId ?? 'default'} simulatedUserId={simulatedUserId} />;
}
