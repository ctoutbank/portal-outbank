'use client';

import { CheckCircle, FileEdit, Ban } from 'lucide-react';

export type MdrStatus = 'rascunho' | 'pendente_validacao' | 'validada' | 'rejeitada' | 'inativa';

interface MdrStatusBadgeProps {
  status: MdrStatus;
  showLabel?: boolean;
  size?: 'sm' | 'md';
}

const statusConfig: Record<MdrStatus, {
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: React.ComponentType<{ className?: string }>;
}> = {
  rascunho: {
    label: 'Rascunho',
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-900/30',
    borderColor: 'border-yellow-700',
    icon: FileEdit
  },
  pendente_validacao: {
    label: 'Pendente',
    color: 'text-orange-400',
    bgColor: 'bg-orange-900/30',
    borderColor: 'border-orange-700',
    icon: FileEdit
  },
  validada: {
    label: 'Aprovada',
    color: 'text-green-400',
    bgColor: 'bg-green-900/30',
    borderColor: 'border-green-700',
    icon: CheckCircle
  },
  rejeitada: {
    label: 'Rejeitada',
    color: 'text-red-400',
    bgColor: 'bg-red-900/30',
    borderColor: 'border-red-700',
    icon: Ban
  },
  inativa: {
    label: 'Inativa',
    color: 'text-gray-500',
    bgColor: 'bg-gray-800/50',
    borderColor: 'border-gray-600',
    icon: Ban
  }
};

export function MdrStatusBadge({ status, showLabel = true, size = 'md' }: MdrStatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.rascunho;
  const Icon = config.icon;

  const sizeClasses = size === 'sm'
    ? 'px-2 py-0.5 text-xs gap-1'
    : 'px-2.5 py-1 text-xs gap-1.5';

  const iconSize = size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5';

  return (
    <span className={`inline-flex items-center font-medium rounded-md border ${config.bgColor} ${config.borderColor} ${config.color} ${sizeClasses}`}>
      <Icon className={iconSize} />
      {showLabel && <span>{config.label}</span>}
    </span>
  );
}

export function getStatusLabel(status: MdrStatus): string {
  return statusConfig[status]?.label || 'Desconhecido';
}
