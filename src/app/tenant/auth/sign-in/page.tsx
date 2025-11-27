import { SignIn } from "@clerk/nextjs";

export default function TenantSignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <SignIn
        appearance={{
          elements: {
            rootBox: "mx-auto",
            card: "shadow-xl bg-gray-900/95 backdrop-blur-sm",
            // Ocultar o elemento do link no canto superior esquerdo
            headerBackLink: "hidden",
            logoLink: "hidden",
            // Mostrar título customizado com nome Consolle
            headerTitle: "text-2xl font-bold text-white",
            headerSubtitle: "text-gray-300",
          },
          variables: {
            colorText: "#f9fafb",
            colorInputText: "#e5e7eb",
            colorPrimary: "#ffffff",
            colorBackground: "#111827",
            colorInputBackground: "#1f2937",
          },
        }}
        headerTitle="Consolle"
        afterSignInUrl="/dashboard"
        signUpUrl="/auth/sign-up"
        routing="path"
        path="/auth/sign-in"
      />
    </div>
  );
}
