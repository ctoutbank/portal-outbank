import { getAllCnaeOptions } from "@/features/categories/server/category";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export const revalidate = 300;

export async function GET(request: NextRequest){
  const search = request.nextUrl.searchParams.get('q') ?? '';
  const data = await getAllCnaeOptions(search);
  
  return NextResponse.json(data, {
    headers: {
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60',
    },
  });
}
