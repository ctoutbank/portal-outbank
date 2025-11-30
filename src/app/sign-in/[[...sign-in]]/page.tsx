import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-900 dark:bg-gray-900">
      <SignIn
        appearance={{
          elements: {
            rootBox: "mx-auto",
            card: "shadow-xl bg-gray-900/95 backdrop-blur-sm",
            headerTitle: "text-2xl font-bold text-white",
            headerSubtitle: "text-gray-300",
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
        fallbackRedirectUrl="/"
        signUpUrl="/sign-up"
      />
    </div>
  );
}
