"use client";

import React, { useState, ReactNode } from "react";
import { Settings, EyeOff, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { saveVisibilitySettings } from "../serverActions/visibility-settings";
import { useRouter } from "next/navigation";

interface LayoutEditorProps {
  children: ReactNode;
  initialHiddenSections: string[];
  sectionIds: string[];
  canEdit?: boolean;
}

interface EditableSectionProps {
  sectionId: string;
  children: ReactNode;
  isEditing: boolean;
  isHidden: boolean;
  onToggle: () => void;
  canEdit: boolean;
}

function EditableSection({
  sectionId,
  children,
  isEditing,
  isHidden,
  onToggle,
  canEdit,
}: EditableSectionProps) {
  if (isHidden) return null;

  return (
    <div className="relative group">
      {canEdit && isEditing && (
        <button
          onClick={onToggle}
          className="absolute -top-2 -right-2 z-50 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 shadow-lg transition-all"
          title="Ocultar esta seção"
        >
          <EyeOff className="h-4 w-4" />
        </button>
      )}
      {children}
    </div>
  );
}

export function LayoutEditor({
  children,
  initialHiddenSections,
  sectionIds,
  canEdit = false,
}: LayoutEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [previewHidden, setPreviewHidden] = useState<Set<string>>(
    new Set(initialHiddenSections)
  );
  const [savedHidden, setSavedHidden] = useState<Set<string>>(
    new Set(initialHiddenSections)
  );
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();

  const toggleSection = (sectionId: string) => {
    const newHidden = new Set(previewHidden);
    if (newHidden.has(sectionId)) {
      newHidden.delete(sectionId);
    } else {
      newHidden.add(sectionId);
    }
    setPreviewHidden(newHidden);
  };

  const hasChanges = () => {
    if (previewHidden.size !== savedHidden.size) return true;
    for (const id of previewHidden) {
      if (!savedHidden.has(id)) return true;
    }
    return false;
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await saveVisibilitySettings([...previewHidden], "closing");
      setSavedHidden(new Set(previewHidden));
      setShowSaveDialog(false);
      setIsEditing(false);
      router.refresh(); // Recarregar página para aplicar mudanças
    } catch (error) {
      console.error("Erro ao salvar:", error);
      alert("Erro ao salvar configurações");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setPreviewHidden(new Set(savedHidden)); // Reverter para estado salvo
    setIsEditing(false);
  };

  // Renderizar children com controle de visibilidade
  const renderChildren = (children: ReactNode): ReactNode => {
    if (!children) return null;

    return (
      <>
        {React.Children.map(children as any, (child, index) => {
          if (!child || typeof child !== "object") return child;
          
          // Verificar se é um elemento React válido
          if (React.isValidElement(child)) {
            const sectionId = (child.props as any)?.sectionId;
            
            if (sectionId) {
              return (
                <EditableSection
                  key={sectionId || index}
                  sectionId={sectionId}
                  isEditing={isEditing}
                  isHidden={previewHidden.has(sectionId)}
                  onToggle={() => toggleSection(sectionId)}
                  canEdit={canEdit}
                >
                  {child}
                </EditableSection>
              );
            }
          }
          
          return child;
        })}
      </>
    );
  };

  return (
    <>
      {canEdit && (
        <div className="mb-4 flex justify-end">
          <Button
            onClick={() => setIsEditing(!isEditing)}
            variant={isEditing ? "destructive" : "outline"}
            size="sm"
          >
            {isEditing ? (
              <>
                <X className="h-4 w-4 mr-2" />
                Cancelar Edição
              </>
            ) : (
              <>
                <Settings className="h-4 w-4 mr-2" />
                Editar Layout
              </>
            )}
          </Button>
        </div>
      )}

      {canEdit && isEditing && (
        <div className="mb-4 p-4 bg-yellow-900/20 border border-yellow-500/50 rounded-lg">
          <p className="text-sm text-yellow-200 mb-2">
            <strong>Modo de edição ativo</strong> - Clique no botão vermelho (👁️) nas seções para ocultar/mostrar. 
            Clique em "Salvar Alterações" para aplicar as mudanças permanentemente no banco de dados.
          </p>
          <div className="flex gap-2">
            <Button
              onClick={() => setShowSaveDialog(true)}
              size="sm"
              disabled={!hasChanges()}
            >
              <Save className="h-4 w-4 mr-2" />
              Salvar Alterações
            </Button>
            <Button onClick={handleCancel} variant="outline" size="sm">
              Cancelar
            </Button>
          </div>
        </div>
      )}

      {canEdit && (
        <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmar Alterações</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">
              Você está prestes a salvar as alterações no banco de dados. 
              As seções ocultas não serão mais exibidas para todos os usuários.
            </p>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowSaveDialog(false)}
                disabled={isSaving}
              >
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? "Salvando..." : "Confirmar e Salvar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {renderChildren(children)}
    </>
  );
}

