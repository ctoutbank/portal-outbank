'use server';

import { sql } from '@vercel/postgres';
import { NextRequest, NextResponse } from "next/server";
import { fornecedoresRepository } from "@/lib/db/fornecedores";
import { FornecedorFormData } from "@/types/fornecedor";

export async function GET(request: NextRequest) {

    try {

        console.log('=== DEBUG INICIO ===');
        console.log('POSTGRES_URL:', process.env.POSTGRES_URL?.substring(0, 50) + '...');
        
        const dbInfo = await sql.query('SELECT current_database(), current_schema()');
        console.log('Database conectado:', dbInfo.rows[0]);
        
        const tablesQuery = await sql.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            ORDER BY table_name
        `);
        console.log('Tabelas disponíveis:', tablesQuery.rows.map(r => r.table_name));
        
        const cnaesExists = tablesQuery.rows.some(r => r.table_name === 'cnaes');
        console.log('Tabela cnaes existe?', cnaesExists);
        console.log('=== DEBUG FIM ===');
        
        if (!cnaesExists) {
            return NextResponse.json({ 
                error: 'Tabela cnaes não existe neste banco',
                debug: {
                    database: dbInfo.rows[0],
                    tables: tablesQuery.rows.map(r => r.table_name)
                }
            }, { status: 500 });
        }


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
        console.log("POST INICIADO")
        const data: FornecedorFormData = await request.json();
        console.log("DATA RECEBIDA:", data);

        if (!data.nome || !data.cnpj || !data.email) {
            console.log("DADOS INCOMPLETOS");
            return NextResponse.json({ error: "Nome, CNPJ e Email são obrigatórios." }, { status: 400 });
        }

        console.log("VERIFICANDO EXISTÊNCIA POR CNPJ:", data.cnpj);

        const exists = await fornecedoresRepository.existsByCnpj(data.cnpj);
        if (exists) {
            return NextResponse.json({ error: "Fornecedor com este CNPJ já existe." }, { status: 400 });
        }
        console.log("CRIANDO FORNECEDOR:", data);
        const result = await fornecedoresRepository.create(data);
        console.log("FORNECEDOR CRIADO COM SUCESSO:", result);
        return NextResponse.json(result, { status: 201 });
    } catch (error) {
        console.error("Error creating fornecedor in API route:", error);
        return NextResponse.json({ error: "Error creating fornecedor" }, { status: 500 });
    }

}
