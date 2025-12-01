"use client";
import { formatCurrency } from "@/lib/utils";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { useState } from "react";

export type HeaderView = {
  label: string;
  value: string;
};

export interface SummaryTableItem {
  id: string;
  label: string;
  count: number;
  totalAmount: number;
}

interface TransactionSummaryTableProps {
  items: SummaryTableItem[];
  total: {
    quantidade: number;
    valorTotal: number;
  };
  labelHeader: string;
  headerbg?: string;
  headersViews?: HeaderView[];
  onHeaderViewChange?: (value: string) => void;
}

export function TransactionSummaryTable({
  items,
  total,
  headerbg,
  headersViews,
  onHeaderViewChange,
  labelHeader,
}: TransactionSummaryTableProps) {
  // Ordenar itens por valor total em ordem decrescente
  const sortedItems = [...items].sort((a, b) => b.totalAmount - a.totalAmount);

  const [currentHeaderView, setCurrentHeaderView] = useState<HeaderView>(
    headersViews?.[0] || { label: "", value: "" }
  );

  const handleHeaderViewChange = (newHeaderView: HeaderView) => {
    setCurrentHeaderView(newHeaderView);
    // Enviar o valor para o componente pai
    if (onHeaderViewChange) {
      onHeaderViewChange(newHeaderView.value);
    }
  };

  return (
    <div className="relative overflow-hidden rounded-xl border border-[#2a2a2a] p-6 bg-gradient-to-br from-[#1f1f1f] to-[#1a1a1a] before:absolute before:top-0 before:left-0 before:w-1 before:h-full before:bg-gradient-to-b before:from-[#3b82f6] before:to-[#8b5cf6]">
      {/* Card Header */}
      <div className="flex justify-between items-start mb-5">
        <div className="flex-1">
          <div className="text-xs text-[#808080] uppercase tracking-wider mb-1">
            Transações
          </div>
          <div className="text-lg font-semibold text-white mb-1">
            {!headersViews || headersViews.length <= 1 ? (
              labelHeader
            ) : (
              <div className="flex items-center gap-2">
                <ChevronLeftIcon
                  className="w-4 h-4 cursor-pointer text-[#808080] hover:text-white transition-colors"
                  onClick={() => {
                    const currentIndex = headersViews.findIndex(
                      (view) => view.value === currentHeaderView.value
                    );
                    const prevIndex =
                      currentIndex > 0
                        ? currentIndex - 1
                        : headersViews.length - 1;
                    handleHeaderViewChange(headersViews[prevIndex]);
                  }}
                />
                <span>{currentHeaderView.label}</span>
                <ChevronRightIcon
                  className="w-4 h-4 cursor-pointer text-[#808080] hover:text-white transition-colors"
                  onClick={() => {
                    const currentIndex = headersViews.findIndex(
                      (view) => view.value === currentHeaderView.value
                    );
                    const nextIndex =
                      currentIndex < headersViews.length - 1
                        ? currentIndex + 1
                        : 0;
                    handleHeaderViewChange(headersViews[nextIndex]);
                  }}
                />
              </div>
            )}
          </div>
          <div className="text-sm text-[#606060]">
            Vendas processadas
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className="text-2xl font-bold text-white">
            {total.quantidade.toLocaleString('pt-BR')}
          </div>
          <div className="text-sm text-[#808080]">
            {formatCurrency(total.valorTotal)}
          </div>
        </div>
      </div>

      {/* Payment Methods Grid */}
      <div className="grid grid-cols-3 gap-2">
        {sortedItems.map((item) => {
          const percentage = total.quantidade === 0
            ? 0
            : ((item.count / total.quantidade) * 100);
          const amountPercentage = total.valorTotal === 0
            ? 0
            : ((item.totalAmount / total.valorTotal) * 100);
          
          return (
            <div
              key={item.id}
              className="bg-[#0d0d0d] border border-[#2a2a2a] rounded-md p-2 px-3 flex justify-between items-center"
            >
              <span className="text-xs text-[#b0b0b0] flex items-center gap-1.5">
                <span className="bg-[#2a2a2a] text-white text-[10px] px-1.5 py-0.5 rounded font-medium">
                  {item.label}
                </span>
                <span className="text-[11px] text-[#808080]">
                  ({percentage.toFixed(1)}%) {item.count.toLocaleString('pt-BR')}
                </span>
              </span>
              <span className="text-xs font-semibold text-white">
                {formatCurrency(item.totalAmount)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

