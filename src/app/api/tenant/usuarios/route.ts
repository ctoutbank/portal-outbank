import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { requireTenantAccess } from "@/lib/subdomain-auth/guard";
import { getTenantUsers } from "@/features/users/server/admin-users";
import { getInheritedCommissions } from "@/lib/db/inherited-commissions";

export async function GET() {
  try {
    const headersList = await headers();
    const hostname = headersList.get("host") || "";

    const { tenant } = await requireTenantAccess(hostname);

    if (!tenant?.id) {
      return NextResponse.json(
        { error: "Tenant não encontrado" },
        { status: 404 }
      );
    }

    const result = await getTenantUsers(tenant.id);

    const usersWithCommissions = await Promise.all(
      result.users.map(async (user) => {
        const commissions = await getInheritedCommissions(user.id);
        const tenantCommission = commissions.find(c => c.customerId === tenant.id);

        return {
          ...user,
          commissionType: tenantCommission?.categoryType || null,
          commissionPercent: tenantCommission?.commissionPercent || 0,
        };
      })
    );

    return NextResponse.json({
      users: usersWithCommissions,
      totalCount: result.totalCount,
      tenantName: tenant.name,
    });
  } catch (error) {
    console.error("[API /tenant/usuarios] Erro:", error);
    return NextResponse.json(
      { error: "Erro ao buscar usuários" },
      { status: 500 }
    );
  }
}
