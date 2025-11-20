import { SignIn } from "@clerk/nextjs";

export default function TenantSignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <SignIn
        appearance={{
          elements: {
            rootBox: "mx-auto",
            card: "shadow-xl",
            // Ocultar o elemento do link no canto superior esquerdo
            headerBackLink: "hidden",
            logoLink: "hidden",
            // Mostrar título customizado
            headerTitle: "text-2xl font-bold text-gray-900",
            headerSubtitle: "text-gray-600",
          },
          variables: {
            colorText: "#1f2937",
            colorInputText: "#374151",
            colorPrimary: "#000000",
          },
        }}
        locale="pt-BR"
        afterSignInUrl="/dashboard"
        signUpUrl="/auth/sign-up"
        routing="path"
        path="/auth/sign-in"
      />
    </div>
  );
}
