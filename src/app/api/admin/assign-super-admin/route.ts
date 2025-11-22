import { NextRequest, NextResponse } from "next/server";
import { assignSuperAdminToUser } from "@/features/users/server/admin-users";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * API Route para atribuir Super Admin a um usuário
 * POST /api/admin/assign-super-admin
 * Body: { email: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: "Email é obrigatório" },
        { status: 400 }
      );
    }

    const result = await assignSuperAdminToUser(email);

    return NextResponse.json({
      success: true,
      message: `Usuário ${email} promovido a Super Admin com sucesso`,
      data: result,
    });
  } catch (error: any) {
    console.error("Error assigning Super Admin:", error);
    return NextResponse.json(
      { 
        error: error?.message || "Erro ao atribuir Super Admin",
        details: error?.message 
      },
      { status: 500 }
    );
  }
}




