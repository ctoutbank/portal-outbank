import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const health = {
      hasAccessKeyId: !!process.env.AWS_ACCESS_KEY_ID,
      hasSecretAccessKey: !!process.env.AWS_SECRET_ACCESS_KEY,
      hasRegion: !!process.env.AWS_REGION,
      hasBucketName: !!process.env.AWS_BUCKET_NAME,
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(health);
  } catch (error) {
    console.error("Error checking environment health:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
