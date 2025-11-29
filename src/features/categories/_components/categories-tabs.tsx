"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Loader2 } from "lucide-react";
import Categorylist from "./categories-list";
import MccList from "@/features/mcc/_components/mcc-list";
import PageSizeSelector from "@/components/page-size-selector";
import PaginationRecords from "@/components/pagination-Records";
import type { CategoryList } from "../server/category";
import type { MccWithGroup } from "@/features/mcc/server/types";

function MccPageSizeSelector({ currentPageSize }: { currentPageSize: number }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const handlePageSizeChange = (value: string) => {
    startTransition(() => {
      const params = new URLSearchParams(searchParams?.toString() ?? "");
      params.set("mccPerPage", value);
      params.set("mccPage", "1");
      router.push(`/categories?${params.toString()}`);
    });
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm">Itens por página:</span>
      <Select
        value={currentPageSize.toString()}
        onValueChange={handlePageSizeChange}
        disabled={isPending}
      >
        <SelectTrigger className="w-20 h-8 cursor-pointer">
          <SelectValue placeholder="20" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="10">10</SelectItem>
          <SelectItem value="20">20</SelectItem>
          <SelectItem value="50">50</SelectItem>
          <SelectItem value="100">100</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

function MccPaginationRecords({
  totalRecords,
  currentPage,
  pageSize,
}: {
  totalRecords: number;
  currentPage: number;
  pageSize: number;
}) {
  const router = useRouter();
  const totalPages = Math.ceil(totalRecords / pageSize);
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      startTransition(() => {
        const params = new URLSearchParams(searchParams?.toString() ?? "");
        params.set("mccPage", page.toString());
        router.push(`/categories?${params.toString()}`);
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
}

interface CategoriesTabsProps {
  categories: CategoryList;
  mccs: MccWithGroup[];
  mccTotalCount: number;
  categorySortField: string;
  categorySortOrder: "asc" | "desc";
  mccSortField: string;
  mccSortOrder: "asc" | "desc";
  categoryPage: number;
  categoryPerPage: number;
  mccPage: number;
  mccPerPage: number;
}

export default function CategoriesTabs({
  categories,
  mccs,
  mccTotalCount,
  categorySortField,
  categorySortOrder,
  mccSortField,
  mccSortOrder,
  categoryPage,
  categoryPerPage,
  mccPage,
  mccPerPage,
}: CategoriesTabsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState("categories");

  useEffect(() => {
    const tab = searchParams?.get("tab") || "categories";
    setActiveTab(tab);
  }, [searchParams]);

  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams?.toString() ?? "");
    params.set("tab", value);
    router.push(`/categories?${params.toString()}`);
  };

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
      <TabsList className="mb-6">
        <TabsTrigger value="categories">CNAEs</TabsTrigger>
        <TabsTrigger value="mccs">MCCs da Dock</TabsTrigger>
      </TabsList>

      <TabsContent value="categories">
        <div className="flex flex-col space-y-4">
          <Categorylist
            Categories={categories}
            sortField={categorySortField}
            sortOrder={categorySortOrder}
          />

          {categories.totalCount > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between mt-6 gap-4 pt-4 border-t border-border">
              <PageSizeSelector
                currentPageSize={categoryPerPage}
                pageName="categories"
              />
              <PaginationRecords
                totalRecords={categories.totalCount}
                currentPage={categoryPage}
                pageSize={categoryPerPage}
                pageName="categories"
              />
            </div>
          )}
        </div>
      </TabsContent>

      <TabsContent value="mccs">
        <div className="flex flex-col space-y-4">
          <MccList
            mccs={mccs}
            totalCount={mccTotalCount}
            sortField={mccSortField}
            sortOrder={mccSortOrder}
          />

          {mccTotalCount > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between mt-6 gap-4 pt-4 border-t border-border">
              <MccPageSizeSelector currentPageSize={mccPerPage} />
              <MccPaginationRecords
                totalRecords={mccTotalCount}
                currentPage={mccPage}
                pageSize={mccPerPage}
              />
            </div>
          )}
        </div>
      </TabsContent>
    </Tabs>
  );
}

