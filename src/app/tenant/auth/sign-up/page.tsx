import { SignUp } from "@clerk/nextjs";

export default function TenantSignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <SignUp
        appearance={{
          elements: {
            rootBox: "mx-auto",
            card: "shadow-xl",
          },
        }}
        afterSignUpUrl="/dashboard"
        signInUrl="/auth/sign-in"
      />
    </div>
  );
}
