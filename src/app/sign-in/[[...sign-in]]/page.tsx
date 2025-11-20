import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <SignIn
        appearance={{
          elements: {
            rootBox: "mx-auto",
            card: "shadow-xl",
            headerTitle: "text-2xl font-bold text-gray-900",
            headerSubtitle: "text-gray-600",
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
      />
    </div>
  );
}
