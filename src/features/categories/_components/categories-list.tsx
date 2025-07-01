"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CategoryList } from "../server/category";

interface CategorylistProps {
  Categories: CategoryList;
  sortField: string;
  sortOrder: "asc" | "desc";
}

export default function Categorylist({
  Categories,
  sortField,
  sortOrder,
}: CategorylistProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const handleSort = (field: string) => {
    const params = new URLSearchParams(searchParams?.toString() ?? "");

    if (field === sortField) {
      params.set("sortOrder", sortOrder === "asc" ? "desc" : "asc");
    } else {
      params.set("sortField", field);
      params.set("sortOrder", "asc");
    }

    router.push(`/portal/categories?${params.toString()}`);
  };

  return (
    <div>
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <button
                  onClick={() => handleSort("name")}
                  className="flex items-center gap-1"
                >
                  CNAE
                  {sortField === "name" && (
                    <span>{sortOrder === "asc" ? "↑" : "↓"}</span>
                  )}
                </button>
              </TableHead>
              <TableHead>MCC</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Ativo</TableHead>
              <TableHead>Valor Cartão Presente antecipável(%) </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Categories.categories.map((categories) => (
              <TableRow key={categories.id}>
                <TableCell>
                  <Link
                    className="text-primary underline"
                    href="/categories/[id]"
                    as={`/categories/${categories.id}`}
                  >
                    {categories.cnae}
                  </Link>
                </TableCell>
                <TableCell>{categories.mcc}</TableCell>
                <TableCell>{categories.name}</TableCell>
                <TableCell>
                  {" "}
                  <Badge
                    variant={categories.active ? "success" : "destructive"}
                  >
                    {categories.active ? "ATIVO" : "INATIVO"}
                  </Badge>
                </TableCell>
                <TableCell className="text-center">
                  {categories.anticipation_risk_factor_cnp}%
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
