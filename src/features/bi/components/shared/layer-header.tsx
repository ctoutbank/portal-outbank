"use client";

type LayerHeaderProps = {
  number: number;
  title: string;
};

export function LayerHeader({ number, title }: LayerHeaderProps) {
  return (
    <div className="flex items-center gap-3">
      <span 
        className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold text-white bg-transparent border border-[#2a2a2a]"
      >
        {number}
      </span>
      <h2 className="text-lg font-semibold text-white">{title}</h2>
    </div>
  );
}
