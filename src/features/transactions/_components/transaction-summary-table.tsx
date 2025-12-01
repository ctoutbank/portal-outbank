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
    <div className=" overflow-x-auto border rounded-md shadow-sm min-h-[180px] max-h-[180px]">
      <table className="w-full text-[9px]">
        <tbody className="">
          {/* Total Geral como primeira linha */}
          <tr
            className={`border-b ${headerbg} whitespace-nowrap text-nowrap font-medium`}
          >
            <td className="py-1 flex items-center gap-2">
              {!headersViews || headersViews.length <= 1 ? (
                // Se houver apenas um item, mostrar apenas o label sem os ícones
                <span>{labelHeader}</span>
              ) : (
                // Se houver mais de um item, mostrar os ícones de navegação
                <>
                  <ChevronLeftIcon
                    className="w-4 h-4 cursor-pointer"
                    onClick={() => {
                      const currentIndex = headersViews.findIndex(
                        (view) => view.value === currentHeaderView.value
                      );
                      const prevIndex =
                        currentIndex > 0
                          ? currentIndex - 1
                          : headersViews.length - 1;

                      // Atualizar o estado com a visualização anterior e notificar o pai
                      handleHeaderViewChange(headersViews[prevIndex]);
                    }}
                  />{" "}
                  {currentHeaderView.label}
                  <ChevronRightIcon
                    className="w-4 h-4 cursor-pointer"
                    onClick={() => {
                      const currentIndex = headersViews.findIndex(
                        (view) => view.value === currentHeaderView.value
                      );
                      const nextIndex =
                        currentIndex < headersViews.length - 1
                          ? currentIndex + 1
                          : 0;

                      // Atualizar o estado com a próxima visualização e notificar o pai
                      handleHeaderViewChange(headersViews[nextIndex]);
                    }}
                  />
                </>
              )}
            </td>
            <td className="py-1 text-right">{total.quantidade}</td>

            <td className="py-1 text-right">
              {formatCurrency(total.valorTotal)}
            </td>
          </tr>
          {/* Linhas de itens */}
          {sortedItems.map((item) => (
            <tr key={item.id} className="border-b hover:bg-muted/30 text-[8px]">
              <td className="px-2 py-1">{item.label}</td>
              <td className="px-2 py-1 text-right">
                <span className="text-[7px] mr-1">
                  {total.quantidade === 0
                    ? "(0.0%)"
                    : "(" +
                      ((item.count / total.quantidade) * 100).toFixed(1) +
                      "%)"}
                </span>
                {item.count}
              </td>

              <td className="px-2 py-1 text-right whitespace-nowrap text-nowrap">
                <span className="text-[7px] mr-1">
                  {total.valorTotal === 0
                    ? "0.0%"
                    : "(" +
                      ((item.totalAmount / total.valorTotal) * 100).toFixed(1) +
                      "%)"}
                </span>
                {formatCurrency(item.totalAmount)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

