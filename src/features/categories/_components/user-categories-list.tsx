"use client";

import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, ShieldCheck, Users, Lock } from "lucide-react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { deleteCategory } from "@/features/categories/server/categories";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

type Category = {
  id: number;
  name: string | null;
  description: string | null;
  active: boolean | null;
  restrictCustomerData: boolean | null;
  isSalesAgent: boolean | null;
  userCount: number;
  dtinsert?: string | null;
  dtupdate?: string | null;
};

interface UserCategoriesListProps {
  categories: Category[];
}

export function UserCategoriesList({ categories }: UserCategoriesListProps) {
  const router = useRouter();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteClick = (category: Category) => {
    setCategoryToDelete(category);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!categoryToDelete) return;

    setIsDeleting(true);
    try {
      await deleteCategory(categoryToDelete.id);
      toast.success("Categoria deletada com sucesso");
      router.refresh();
      setDeleteDialogOpen(false);
      setCategoryToDelete(null);
    } catch (error: any) {
      toast.error(error.message || "Erro ao deletar categoria");
    } finally {
      setIsDeleting(false);
    }
  };

  const isSuperAdmin = (name: string | null) => {
    if (!name) return false;
    return name.toUpperCase().includes("SUPER_ADMIN") || name.toUpperCase().includes("SUPER");
  };

  return (
    <>
      <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-[#1f1f1f] border-b border-[#2a2a2a] hover:bg-[#1f1f1f]">
                <TableHead className="p-4 text-white text-xs font-medium uppercase tracking-wider">Nome</TableHead>
                <TableHead className="p-4 text-white text-xs font-medium uppercase tracking-wider">Descrição</TableHead>
                <TableHead className="p-4 text-white text-xs font-medium uppercase tracking-wider">Usuários</TableHead>
                <TableHead className="p-4 text-white text-xs font-medium uppercase tracking-wider">Restrição</TableHead>
                <TableHead className="p-4 text-white text-xs font-medium uppercase tracking-wider">Status</TableHead>
                <TableHead className="p-4 text-white text-xs font-medium uppercase tracking-wider text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-[#808080]">
                    Nenhuma categoria encontrada
                  </TableCell>
                </TableRow>
              ) : (
                categories.map((category) => {
                  const isSuper = isSuperAdmin(category.name);

                  return (
                    <TableRow
                      key={category.id}
                      className="border-b border-[#2a2a2a] hover:bg-[#1f1f1f] transition-colors"
                    >
                      <TableCell className="p-4 text-[#b0b0b0] text-[13px]">
                        <div className="flex items-center gap-2">
                          {isSuper && (
                            <ShieldCheck className="h-4 w-4 text-primary" />
                          )}
                          <span className="text-white">
                            {category.name || "--"}
                          </span>
                          {isSuper && (
                            <Badge variant="secondary" className="text-[11px]">
                              Protegido
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="p-4 text-[#b0b0b0] text-[13px]">
                        <span className="text-[11px] text-[#606060]">
                          {category.description || "--"}
                        </span>
                      </TableCell>
                      <TableCell className="p-4 text-[#b0b0b0] text-[13px]">
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4 text-[#606060]" />
                          <span className="text-white font-medium">
                            {category.userCount}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="p-4 text-[#b0b0b0] text-[13px]">
                        {category.restrictCustomerData ? (
                          <Badge variant="secondary" className="gap-1 text-[11px]">
                            <Lock className="h-3 w-3" />
                            Restrito
                          </Badge>
                        ) : (
                          <span className="text-[#808080]">--</span>
                        )}
                      </TableCell>
                      <TableCell className="p-4 text-[#b0b0b0] text-[13px]">
                        {category.active ? (
                          <Badge className="bg-green-600 hover:bg-green-700 text-white text-[11px]">
                            Ativo
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-[11px]">Inativo</Badge>
                        )}
                      </TableCell>
                      <TableCell className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/config/categories/${category.id}`}>
                              <Pencil className="h-4 w-4" />
                            </Link>
                          </Button>
                          {!isSuper && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteClick(category)}
                              disabled={category.userCount > 0}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja deletar a categoria "{categoryToDelete?.name}"?
              {categoryToDelete && categoryToDelete.userCount > 0 && (
                <span className="block mt-2 text-destructive font-medium">
                  Esta categoria possui {categoryToDelete.userCount} usuário(s) atribuído(s).
                  Você não pode deletá-la enquanto houver usuários atribuídos.
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleDeleteConfirm}
              disabled={isDeleting || (categoryToDelete?.userCount || 0) > 0}
              variant="destructive"
            >
              {isDeleting ? "Deletando..." : "Deletar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}





