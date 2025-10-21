'use server';

import { NextRequest, NextResponse } from "next/server";
import { cnaesRepository } from "@/lib/db/cnae";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search') || '';

    const result = await cnaesRepository.getAll(search || undefined);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Error fetching CNAEs:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { codigo, descricao } = await request.json();
    
    if (!codigo || !descricao) {
      return NextResponse.json(
        { error: "Código e descrição são obrigatórios" },
        { status: 400 }
      );
    }

    const result = await cnaesRepository.create(codigo, descricao);
    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    console.error("Error creating CNAE:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
