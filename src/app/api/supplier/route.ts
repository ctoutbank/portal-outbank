'use server';

import { sql } from '@vercel/postgres';
import { NextRequest, NextResponse } from "next/server";
import { fornecedoresRepository } from "@/lib/db/fornecedores";
import { FornecedorFormData } from "@/types/fornecedor";
import { error } from 'console';

export async function GET(request: NextRequest) {

    try {


        const searchParams = request.nextUrl.searchParams;
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');
        const search = searchParams.get('search') || '';
        // const ativo = searchParams.get('ativo') || '';
        let ativoFilter: boolean | undefined = undefined;
        const ativoParam = searchParams.get('ativo')

        console.log('ativoParam: ', ativoParam)
        console.log('tipo', typeof ativoParam)

        if (ativoParam === 'active') {
            ativoFilter = true;
        } else if (ativoParam === 'inactive') {
            ativoFilter = false;
        }

        console.log('ativoFilter depois da conversão: ', ativoFilter)
        console.log('tipo: ', typeof ativoFilter)

        const result = await fornecedoresRepository.getAll(page, limit, {
            search: search || undefined,
            ativo: ativoFilter
        });

        console.log('Resultado retornado: ', result.data.length)
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
    } catch (error: any) {
        if (error.message.includes('duplicate key value')) {
        return NextResponse.json({ error: 'CNPJ duplicado' }, { status: 409 });
        }
        console.error("Error creating fornecedor in API route:", error);
        return NextResponse.json({ error: "Error creating fornecedor" }, { status: 500 });
        
    }

}
