import { SignOutButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="w-full max-w-md space-y-8 text-center">
        <div className="space-y-4">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10">
            <svg
              className="h-10 w-10 text-destructive"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          
          <h1 className="text-3xl font-bold">Acesso Não Autorizado</h1>
          
          <p className="text-muted-foreground">
            Você não tem permissão para acessar este portal. Verifique se você está usando o subdomínio correto ou entre em contato com o administrador.
          </p>
        </div>

        <div className="space-y-4">
          <SignOutButton>
            <Button variant="outline" className="w-full">
              Fazer Logout
            </Button>
          </SignOutButton>
          
          <p className="text-sm text-muted-foreground">
            Se você acredita que isso é um erro, entre em contato com o suporte.
          </p>
        </div>
      </div>
    </div>
  );
}
