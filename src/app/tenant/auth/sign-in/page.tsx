import { SignIn } from "@clerk/nextjs";

export default function TenantSignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-900">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">Consolle</h1>
          <p className="text-gray-300 text-sm">Acesse sua conta</p>
        </div>
        <SignIn
          appearance={{
            elements: {
              rootBox: "mx-auto",
              card: "shadow-xl bg-gray-900/95 backdrop-blur-sm",
              // Ocultar o elemento do link no canto superior esquerdo
              headerBackLink: "hidden",
              logoLink: "hidden",
              // Ocultar título padrão do Clerk já que temos customizado
              headerTitle: "hidden",
              headerSubtitle: "hidden",
              // Garantir que o link "Esqueci minha senha" esteja visível
              formFieldAction: "text-white hover:text-gray-300 underline !block !visible !opacity-100",
              formButtonReset: "text-white hover:text-gray-300 underline !block !visible !opacity-100",
              formFieldActionLink: "text-white hover:text-gray-300 underline !block !visible !opacity-100",
              identityPreviewEditButton: "text-white hover:text-gray-300",
              formResendCodeLink: "text-white hover:text-gray-300 underline",
            },
            variables: {
              colorText: "#f9fafb",
              colorInputText: "#e5e7eb",
              colorPrimary: "#ffffff",
              colorBackground: "#111827",
              colorInputBackground: "#1f2937",
            },
          }}
          routing="path"
          path="/auth/sign-in"
          afterSignInUrl="/dashboard"
          signUpUrl="/auth/sign-up"
        />
      </div>
    </div>
  );
}
