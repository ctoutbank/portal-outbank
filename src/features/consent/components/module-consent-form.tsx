"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertTriangle, CheckCircle2, FileText, Shield, Info } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { grantConsentAction } from "@/features/consent/actions/consent-actions";
import { Label } from "@/components/ui/label";

interface ModuleConsentFormProps {
  moduleId: number;
  merchantId: number;
  moduleName: string;
  moduleSlug: string;
  merchantName: string;
  alreadyConsented: boolean;
}

export default function ModuleConsentForm({
  moduleId,
  merchantId,
  moduleName,
  moduleSlug,
  merchantName,
  alreadyConsented,
}: ModuleConsentFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [consentGiven, setConsentGiven] = useState(false);
  const router = useRouter();

  if (alreadyConsented) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <CheckCircle2 className="h-12 w-12 text-green-500 mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              Consentimento já dado
            </h3>
            <p className="text-muted-foreground">
              Você já deu seu consentimento LGPD para usar este módulo.
            </p>
            <Button
              className="mt-4"
              variant="outline"
              onClick={() => router.push("/consent/modules")}
            >
              Voltar para lista
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!consentGiven) {
      toast.error("Você precisa aceitar o termo de consentimento para continuar");
      return;
    }

    setIsLoading(true);

    try {
      const consentText = `
TERMO DE CONSENTIMENTO LGPD - MÓDULO ${moduleSlug.toUpperCase()}

Eu, abaixo identificado, concordo em dar meu consentimento para o uso do módulo "${moduleName}" (${moduleSlug}) pela empresa ${merchantName}.

Concordo que:
- Os dados pessoais necessários para o funcionamento deste módulo serão coletados e processados
- Tenho direito de revogar este consentimento a qualquer momento
- Os dados serão tratados de acordo com a Lei Geral de Proteção de Dados (LGPD - Lei 13.709/2018)

Data: ${new Date().toLocaleString('pt-BR')}
      `.trim();

      const formData = new FormData();
      formData.append("merchantId", merchantId.toString());
      formData.append("moduleId", moduleId.toString());
      formData.append("consentText", consentText);

      const result = await grantConsentAction(formData);

      if (result.success) {
        toast.success(result.message || "Consentimento LGPD registrado com sucesso!");
        router.push("/consent/modules");
        router.refresh();
      } else {
        toast.error(result.error || "Erro ao registrar consentimento. Tente novamente.");
      }
    } catch (error) {
      console.error("Erro ao registrar consentimento:", error);
      toast.error("Erro ao registrar consentimento. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="h-6 w-6 text-blue-500" />
            <div>
              <CardTitle className="flex items-center gap-2">
                {moduleName}
                <Badge variant="secondary">
                  {moduleSlug.toUpperCase()}
                </Badge>
              </CardTitle>
              <CardDescription>
                Estabelecimento: <strong>{merchantName}</strong>
              </CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Aviso sobre LGPD */}
          <div className="rounded-lg border border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-800 p-4">
            <div className="flex gap-3">
              <Info className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                  Consentimento LGPD
                </h4>
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  Para usar este módulo, é necessário seu consentimento explícito conforme 
                  a Lei Geral de Proteção de Dados (LGPD - Lei 13.709/2018). 
                  Você pode revogar este consentimento a qualquer momento.
                </p>
              </div>
            </div>
          </div>

          {/* Informações do módulo */}
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Informações do Módulo
              </h3>
              <div className="space-y-2 text-sm text-muted-foreground pl-6">
                <p>
                  <strong>Nome:</strong> {moduleName}
                </p>
                <p>
                  <strong>Código:</strong> {moduleSlug.toUpperCase()}
                </p>
                <p>
                  <strong>Estabelecimento:</strong> {merchantName}
                </p>
              </div>
            </div>

            {/* Termo de consentimento */}
            <div className="rounded-lg border bg-muted/50 p-4">
              <h3 className="font-semibold mb-3">Termo de Consentimento</h3>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>
                  Eu concordo em dar meu consentimento para o uso do módulo <strong>{moduleName}</strong> 
                  ({moduleSlug.toUpperCase()}) pela empresa <strong>{merchantName}</strong>.
                </p>
                <p>
                  Concordo que os dados pessoais necessários para o funcionamento deste módulo 
                  serão coletados e processados de acordo com a LGPD.
                </p>
                <p>
                  Tenho direito de revogar este consentimento a qualquer momento através do portal.
                </p>
                <p className="text-xs italic mt-4 pt-4 border-t">
                  Data de registro: {new Date().toLocaleString('pt-BR')}
                </p>
              </div>
            </div>
          </div>

          {/* Checkbox de consentimento */}
          <div className="flex items-start space-x-3 rounded-lg border bg-muted/50 p-4">
            <Checkbox
              id="consent"
              checked={consentGiven}
              onCheckedChange={(checked) => setConsentGiven(checked === true)}
              className="mt-1"
            />
            <div className="flex-1 space-y-1">
              <Label
                htmlFor="consent"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                Eu aceito o termo de consentimento LGPD acima
              </Label>
              <p className="text-xs text-muted-foreground">
                Ao marcar esta opção, você confirma que leu e aceita os termos de consentimento.
              </p>
            </div>
          </div>

          {/* Aviso final */}
          <div className="flex gap-3 rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800 p-4">
            <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm text-amber-800 dark:text-amber-200">
                <strong>Importante:</strong> Este consentimento é necessário para ativar o módulo. 
                Você pode revogá-lo a qualquer momento, mas isso desativará o módulo.
              </p>
            </div>
          </div>

          {/* Botões de ação */}
          <div className="flex gap-3 justify-end pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={!consentGiven || isLoading}
            >
              {isLoading ? (
                "Registrando consentimento..."
              ) : (
                <>
                  <Shield className="h-4 w-4 mr-2" />
                  Dar Consentimento e Ativar Módulo
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

