import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Login - Portal OutBank",
  description: "Entre na sua conta do Portal OutBank",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 bg-[#0f0f14]">
      {children}
    </div>
  );
}
