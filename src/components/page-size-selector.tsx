"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useTransition } from "react";

interface PageSizeSelectorProps {
  currentPageSize: number;
  pageName: string;
}

const PageSizeSelector: React.FC<PageSizeSelectorProps> = ({
  currentPageSize,
  pageName,
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const handlePageSizeChange = (value: string) => {
    startTransition(() => {
      const params = new URLSearchParams(searchParams?.toString());
      params.set("pageSize", value);
      params.set("page", "1");
      router.push(`/${pageName}?${params.toString()}`);
    });
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm">Itens por página:</span>
      <Select
        value={currentPageSize.toString()}
        onValueChange={handlePageSizeChange}
        disabled={isPending}
      >
        <SelectTrigger className="w-20 h-8">
          <SelectValue placeholder="20" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="10">10</SelectItem>
          <SelectItem value="20">20</SelectItem>
          <SelectItem value="50">50</SelectItem>
          <SelectItem value="100">100</SelectItem>
        </SelectContent>
      </Select>
      {isPending && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
          <div className="bg-white p-4 rounded-md shadow-lg">
            <span className="text-sm font-medium">Carregando...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default PageSizeSelector;
