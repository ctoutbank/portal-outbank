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
      <div className="border rounded-lg shadow-sm bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="font-semibold text-sm">Nome</TableHead>
              <TableHead className="font-semibold text-sm">Descrição</TableHead>
              <TableHead className="font-semibold text-sm">Usuários</TableHead>
              <TableHead className="font-semibold text-sm">Restrição</TableHead>
              <TableHead className="font-semibold text-sm">Status</TableHead>
              <TableHead className="font-semibold text-sm text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  Nenhuma categoria encontrada
                </TableCell>
              </TableRow>
            ) : (
              categories.map((category) => {
                const isSuper = isSuperAdmin(category.name);

                return (
                  <TableRow
                    key={category.id}
                    className="hover:bg-muted/30 transition-colors"
                  >
                    <TableCell className="py-3">
                      <div className="flex items-center gap-2">
                        {isSuper && (
                          <ShieldCheck className="h-4 w-4 text-primary" />
                        )}
                        <span className="text-sm font-medium">
                          {category.name || "--"}
                        </span>
                        {isSuper && (
                          <Badge variant="secondary" className="text-xs">
                            Protegido
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="py-3">
                      <span className="text-sm text-muted-foreground">
                        {category.description || "--"}
                      </span>
                    </TableCell>
                    <TableCell className="py-3">
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">
                          {category.userCount}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="py-3">
                      {category.restrictCustomerData ? (
                        <Badge variant="secondary" className="gap-1">
                          <Lock className="h-3 w-3" />
                          Restrito
                        </Badge>
                      ) : (
                        <span className="text-sm text-muted-foreground">--</span>
                      )}
                    </TableCell>
                    <TableCell className="py-3">
                      {category.active ? (
                        <Badge className="bg-green-600 hover:bg-green-700 text-white">
                          Ativo
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Inativo</Badge>
                      )}
                    </TableCell>
                    <TableCell className="py-3 text-right">
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


