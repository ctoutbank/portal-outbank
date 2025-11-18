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
            headerTitle: "hidden",
          },
        }}
        afterSignInUrl="/dashboard"
        signUpUrl="/auth/sign-up"
        routing="path"
        path="/auth/sign-in"
      />
    </div>
  );
}
