import { NextRequest, NextResponse } from "next/server";
import { validateUserAccessBySubdomain } from "@/lib/subdomain-auth";

/**
 * Rota /api/check-user - Alias para /api/check-subdomain-auth
 * Mantida para compatibilidade com chamadas antigas
 */
export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    const host = req.headers.get("host") || "";
    const subdomain = host.split(".")[0];

    const validation = await validateUserAccessBySubdomain(email, subdomain);

    if (!validation.authorized) {
      return NextResponse.json({ error: validation.reason }, { status: 403 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in check-user:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

