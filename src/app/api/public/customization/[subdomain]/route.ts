import { NextRequest, NextResponse } from "next/server";
import { getCustomizationBySubdomain } from "@/utils/serverActions";

export const dynamic = 'force-dynamic';

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

    return NextResponse.json({
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
  } catch (error) {
    console.error("Error fetching customization:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
