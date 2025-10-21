'use server';


import { NextRequest, NextResponse } from "next/server";
import { fornecedoresRepository } from "@/lib/db/fornecedores";
import { FornecedorFormData } from "@/types/fornecedor";

export async function GET(request: NextRequest) {

    try {
        const searchParams = request.nextUrl.searchParams;
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');
        const search = searchParams.get('search') || '';
        const ativo = searchParams.get('ativo') || '';

        const result = await fornecedoresRepository.getAll(page, limit, {
            search: search || undefined,
            ativo: ativo ? ativo === 'active' : undefined,
        });
        return NextResponse.json(result);
        } catch (error: any) {
            console.error("Error fetching fornecedores in API route:", error);
            const message = error?.message || String(error) || 'Error fetching fornecedores';
            return NextResponse.json({ error: message }, { status: 500 });
        }
}

export async function POST(request: NextRequest) {
    try {
        const data: FornecedorFormData = await request.json();
        if (!data.nome || !data.cnpj || !data.email) {
            return NextResponse.json({ error: "Nome, CNPJ e Email são obrigatórios." }, { status: 400 });
        }

        const exists = await fornecedoresRepository.existsByCnpj(data.cnpj);
        if (exists) {
            return NextResponse.json({ error: "Fornecedor com este CNPJ já existe." }, { status: 400 });
        }

        const result = await fornecedoresRepository.create(data);
        return NextResponse.json(result, { status: 201 });
    } catch (error) {
        console.error("Error creating fornecedor in API route:", error);
        return NextResponse.json({ error: "Error creating fornecedor" }, { status: 500 });
    }

}
