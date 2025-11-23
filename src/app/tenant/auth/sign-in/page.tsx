import { SignIn } from "@clerk/nextjs";
import { headers } from "next/headers";

interface PageProps {
  searchParams: Promise<{ redirect_url?: string }>;
}

export default async function TenantSignInPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const headersList = await headers();
  const hostname = headersList.get("host") || "";
  const protocol = headersList.get("x-forwarded-proto") || "https";
  
  // Usar redirect_url da query string se existir, caso contrário usar /dashboard
  let afterSignInUrl = params.redirect_url || "/dashboard";
  
  // Se o redirect_url for relativo, converter para absoluto usando o hostname atual
  if (afterSignInUrl.startsWith("/")) {
    afterSignInUrl = `${protocol}://${hostname}${afterSignInUrl}`;
  }

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
        forceRedirectUrl={afterSignInUrl}
        signUpUrl="/auth/sign-up"
        routing="path"
        path="/auth/sign-in"
      />
    </div>
  );
}
