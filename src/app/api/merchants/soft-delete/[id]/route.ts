"use server";

import { db, merchants } from "@/lib/db";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { checkPagePermission } from "@/lib/permissions/check-permissions";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const merchantId = parseInt(resolvedParams.id);

    if (isNaN(merchantId)) {
      return NextResponse.json(
        { error: "ID do estabelecimento inválido" },
        { status: 400 }
      );
    }

    // Verificar permissões
    const permissions = await checkPagePermission(
      "Estabelecimentos",
      "Atualizar"
    );

    if (!permissions || permissions.length === 0) {
      return NextResponse.json(
        { error: "Você não tem permissão para desativar estabelecimentos" },
        { status: 403 }
      );
    }

    // Fazer soft delete (marcar dtdelete e active = false)
    await db
      .update(merchants)
      .set({
        active: false,
        dtdelete: new Date().toISOString(),
        dtupdate: new Date().toISOString(),
      })
      .where(eq(merchants.id, merchantId));

    return NextResponse.json({
      success: true,
      message: "Estabelecimento desativado com sucesso",
    });
  } catch (error) {
    console.error("Erro ao desativar estabelecimento:", error);
    return NextResponse.json(
      { error: "Erro ao desativar estabelecimento" },
      { status: 500 }
    );
  }
}




