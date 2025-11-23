import { SignIn } from "@clerk/nextjs";

interface PageProps {
  searchParams: Promise<{ redirect_url?: string }>;
}

export default async function TenantSignInPage({ searchParams }: PageProps) {
  const params = await searchParams;
  // Usar redirect_url da query string se existir, caso contrário usar /dashboard
  const afterSignInUrl = params.redirect_url || "/dashboard";

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
        afterSignInUrl={afterSignInUrl}
        signUpUrl="/auth/sign-up"
        routing="path"
        path="/auth/sign-in"
      />
    </div>
  );
}
