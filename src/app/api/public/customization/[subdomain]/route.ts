import { NextRequest, NextResponse } from "next/server";
import { getCustomizationBySubdomain } from "@/utils/serverActions";

export const dynamic = 'force-dynamic';
export const revalidate = 5;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ subdomain: string }> }
) {
  try {
    const { subdomain } = await params;
    
    if (!subdomain) {
      return NextResponse.json(
        { error: "Subdomain parameter is required" },
        { status: 400 }
      );
    }

    const customization = await getCustomizationBySubdomain(subdomain);

    if (!customization) {
      return NextResponse.json(
        { error: `No customization found for subdomain: ${subdomain}` },
        { status: 404 }
      );
    }

    const response = NextResponse.json({
      subdomain,
      customization: {
        id: customization.id,
        name: customization.name,
        slug: customization.slug,
        imageUrl: customization.imageUrl,
        loginImageUrl: customization.loginImageUrl,
        faviconUrl: customization.faviconUrl,
        primaryColor: customization.primaryColor,
        secondaryColor: customization.secondaryColor,
      },
    });

    response.headers.set('Vary', 'Host');
    // ✅ Cache otimizado para atualização rápida (5 segundos)
    response.headers.set('Cache-Control', 'max-age=5, must-revalidate');
    
    return response;
  } catch (error) {
    console.error("Error fetching customization:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
