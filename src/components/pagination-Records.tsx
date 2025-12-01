"use client";

import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Loader2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useTransition } from "react";

interface PaginationProps {
  totalRecords: number;
  currentPage: number;
  pageSize: number;
  pageName: string;
}

const PaginationCustom: React.FC<PaginationProps> = ({
  totalRecords,
  currentPage,
  pageSize,
  pageName,
}) => {
  const router = useRouter();
  const totalPages = Math.ceil(totalRecords / pageSize);
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      startTransition(() => {
        const params = new URLSearchParams(searchParams?.toString());
        params.set("page", page.toString());
        router.push(`/${pageName}?${params.toString()}`);
      });
    }
  };

  if (totalPages <= 0) return null;

  return (
    <div className="flex gap-2 items-center">
      {currentPage > 1 && (
        <button
          className={`bg-[#1f1f1f] border border-[#2a2a2a] rounded-md w-8 h-8 text-white text-sm cursor-pointer flex items-center justify-center transition-all hover:bg-[#252525] hover:border-[#3a3a3a] ${
            isPending ? "opacity-30 cursor-not-allowed" : ""
          }`}
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={isPending}
        >
          ‹
        </button>
      )}
      {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
        const start = Math.max(1, currentPage - 3);
        const pageNum = start + i;
        return pageNum <= totalPages ? pageNum : null;
      })
        .filter(Boolean)
        .map((page) => (
          <button
            key={page}
            onClick={() => handlePageChange(page as number)}
            disabled={isPending}
            className={`bg-[#1f1f1f] border border-[#2a2a2a] rounded-md w-8 h-8 text-white text-sm cursor-pointer flex items-center justify-center transition-all hover:bg-[#252525] hover:border-[#3a3a3a] ${
              currentPage === page ? "bg-[#1a1a1a] text-white font-semibold border-[#3a3a3a]" : ""
            } ${
              isPending ? "opacity-30 cursor-not-allowed" : ""
            }`}
          >
            {page}
          </button>
        ))}

      {currentPage < totalPages && (
        <button
          className={`bg-[#1f1f1f] border border-[#2a2a2a] rounded-md w-8 h-8 text-white text-sm cursor-pointer flex items-center justify-center transition-all hover:bg-[#252525] hover:border-[#3a3a3a] ${
            isPending ? "opacity-30 cursor-not-allowed" : ""
          }`}
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={isPending}
        >
          ›
        </button>
      )}
      {isPending && (
        <Loader2 className="h-4 w-4 animate-spin text-[#808080]" />
      )}
    </div>
  );
};

export default PaginationCustom;
