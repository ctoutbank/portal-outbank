import { SignIn } from "@clerk/nextjs";

export default function TenantSignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <SignIn
        appearance={{
          elements: {
            rootBox: "mx-auto",
            card: "shadow-xl",
          },
        }}
        afterSignInUrl="/dashboard"
        signUpUrl="/auth/sign-up"
      />
    </div>
  );
}
