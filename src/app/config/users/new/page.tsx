import { redirect } from "next/navigation";

export default function NewUserPage() {
  redirect("/config/users/0");
}
