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
        localization={{
          locale: "pt-BR",
          labels: {
            signIn: {
              title: "Acesso para Consolle Admin",
              subtitle: "Bem vindo de volta!",
              emailAddress: {
                label: "E-mail",
                placeholder: "Digite seu e-mail",
              },
              password: {
                label: "Senha",
                placeholder: "Digite sua senha",
              },
            },
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
