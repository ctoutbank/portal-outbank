import { redirect, permanentRedirect } from "next/navigation";
import { isAdminOrSuperAdmin } from "@/lib/permissions/check-permissions";

export const revalidate = 0;
export const dynamic = 'force-dynamic';

export default async function ConfigPage() {
  try {
    // Verificar se usuário é Admin ou Super Admin
    const isAdmin = await isAdminOrSuperAdmin();
    
    if (!isAdmin) {
      redirect("/unauthorized");
    }
    
    // Redirecionar permanentemente para a página de usuários
    permanentRedirect("/config/users");
  } catch (error) {
    console.error("Error in ConfigPage:", error);
    redirect("/unauthorized");
  }
}
