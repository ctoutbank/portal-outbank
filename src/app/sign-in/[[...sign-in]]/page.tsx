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
          },
          variables: {
            colorText: "#f9fafb",
            colorInputText: "#e5e7eb",
            colorPrimary: "#ffffff",
            colorBackground: "#111827",
            colorInputBackground: "#1f2937",
          },
        }}
      />
    </div>
  );
}
