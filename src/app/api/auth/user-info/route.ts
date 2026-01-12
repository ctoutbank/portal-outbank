import { NextResponse } from "next/server";
import { getCurrentUserInfo } from "@/lib/permissions/check-permissions";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const userInfo = await getCurrentUserInfo();

    if (!userInfo) {
      return NextResponse.json(
        { error: "Usuário não autenticado" },
        { status: 401 }
      );
    }

    return NextResponse.json({
      id: userInfo.id,
      email: userInfo.email,
      isSuperAdmin: userInfo.isSuperAdmin,
      isAdmin: userInfo.isAdmin,
      allowedCustomers: userInfo.allowedCustomers || [],
      idCustomer: userInfo.idCustomer,
    });
  } catch (error: any) {
    console.error("Erro ao buscar informações do usuário:", error);
    return NextResponse.json(
      { error: "Erro ao buscar informações do usuário" },
      { status: 500 }
    );
  }
}




