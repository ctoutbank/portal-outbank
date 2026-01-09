import { redirect } from "next/navigation";

export default function TenantSignUpPage() {
  redirect("/auth/sign-in");
}
