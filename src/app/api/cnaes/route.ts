import { getAllCnaeOptions } from "@/features/categories/server/category";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest){
  const search = request.nextUrl.searchParams.get('q') ?? '';
  const data = await getAllCnaeOptions(search);
  return NextResponse.json(data);
}