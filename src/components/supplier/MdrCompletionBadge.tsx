'use client';

import { MdrCompletionStatus } from '@/lib/utils/mdr-completion';

interface MdrCompletionBadgeProps {
  status: MdrCompletionStatus;
  percentage?: number;
  showPercentage?: boolean;
}

export function MdrCompletionBadge({ status, percentage, showPercentage = false }: MdrCompletionBadgeProps) {
  const config = {
    sem_taxas: {
      label: 'Sem taxas',
      bgColor: 'bg-[#2a2a2a]',
      textColor: 'text-[#888]',
      borderColor: 'border-[#3a3a3a]',
    },
    incompleta: {
      label: 'Incompleta',
      bgColor: 'bg-yellow-900/20',
      textColor: 'text-yellow-500',
      borderColor: 'border-yellow-800/50',
    },
    completa: {
      label: 'Completa',
      bgColor: 'bg-green-900/20',
      textColor: 'text-green-500',
      borderColor: 'border-green-800/50',
    },
  };

  const { label, bgColor, textColor, borderColor } = config[status];

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full border ${bgColor} ${textColor} ${borderColor}`}>
      {label}
      {showPercentage && percentage !== undefined && status !== 'sem_taxas' && (
        <span className="opacity-70">({percentage}%)</span>
      )}
    </span>
  );
}
