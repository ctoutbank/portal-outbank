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
    <>
      <Pagination className="mt-4">
        <PaginationContent>
          {currentPage > 1 && (
            <PaginationItem>
              <PaginationPrevious
                className={`cursor-pointer ${
                  isPending ? "opacity-50 pointer-events-none" : ""
                }`}
                onClick={() => handlePageChange(currentPage - 1)}
              />
            </PaginationItem>
          )}
          {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
            const start = Math.max(1, currentPage - 3);
            const pageNum = start + i;
            return pageNum <= totalPages ? pageNum : null;
          })
            .filter(Boolean)
            .map((page) => (
              <PaginationItem className="cursor-pointer" key={page}>
                <PaginationLink
                  onClick={() => handlePageChange(page as number)}
                  isActive={currentPage === page}
                  className={isPending ? "opacity-50 pointer-events-none" : ""}
                >
                  {page}
                </PaginationLink>
              </PaginationItem>
            ))}

          {currentPage < totalPages && (
            <PaginationItem>
              <PaginationNext
                className={`cursor-pointer ${
                  isPending ? "opacity-50 pointer-events-none" : ""
                }`}
                onClick={() => handlePageChange(currentPage + 1)}
              />
            </PaginationItem>
          )}
          {isPending && (
            <PaginationItem>
              <Loader2 className="h-4 w-4 animate-spin" />
            </PaginationItem>
          )}
        </PaginationContent>
      </Pagination>
      <div className="text-sm">Total de Registros: {totalRecords}</div>
    </>
  );
};

export default PaginationCustom;
