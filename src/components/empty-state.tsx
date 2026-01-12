import type { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center h-[400px] p-4 text-center border-2 border-dashed border-[#3a3a3a] rounded-lg">
      <div className="bg-[#2a2a2a] rounded-full p-3 mb-4">
        <Icon className="h-8 w-8 text-[#808080]" />
      </div>
      <h2 className="text-xl font-semibold text-white mb-2">{title}</h2>
      {description && (
        <p className="text-sm text-[#808080] max-w-sm">{description}</p>
      )}
    </div>
  );
}




