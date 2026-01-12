'use server';

import { sql } from '@vercel/postgres';
import { NextRequest, NextResponse } from "next/server";
import { fornecedoresRepository } from "@/lib/db/fornecedores";
import { FornecedorFormData, FornecedorMDRForm } from "@/types/fornecedor";

export const dynamic = 'force-dynamic';

function getErrorMessage(error: unknown) {
    if (typeof error === 'string') return error;
    if (error instanceof Error) return error.message;
    try { return JSON.stringify(error); } catch { return String(error); }
}

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
    } catch (error: unknown) {
        const message = getErrorMessage(error) || 'Error fetching fornecedores';
        console.error("Error fetching fornecedores in API route:", message);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

//Post comentado para testes locais

export async function POST(request: NextRequest) {
    try {
       
        const body = await request.json() as unknown;
        const { fornecedor, mdr } = body as {
            fornecedor: FornecedorFormData;
            mdr?: FornecedorMDRForm;
        } 
        

        if (!fornecedor.nome || !fornecedor.cnpj || !fornecedor.email) {
            
            return NextResponse.json({ error: "Nome, CNPJ e Email são obrigatórios." }, { status: 400 });
        }
        

        

    const exists = await fornecedoresRepository.existsByCnpj(fornecedor.cnpj);
        if (exists) {
            return NextResponse.json({ error: "Fornecedor com este CNPJ já existe." }, { status: 400 });
        }
        
        const createdFornecedor = await fornecedoresRepository.create(fornecedor);

    let createdMdr: unknown = null;
        if(mdr && createdFornecedor.id){
            try{
                const mdrResult = await sql.query(
                    `INSERT INTO mdr (
                        fornecedor_id,
                        bandeiras,
                        debitopos, creditopos, credito2xpos, credito7xpos, voucherpos,
                        prepos, mdrpos, cminpos, cmaxpos, antecipacao,
                        debitoonline, creditoonline, credito2xonline, credito7xonline, voucheronline,
                        preonline, mdronline, cminonline, cmaxonline, antecipacaoonline,
                        created_at, updated_at
                    ) VALUES (
                        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12,
                        $13, $14, $15, $16, $17, $18, $19, $20, $21, $22,
                        NOW(), NOW()
                    ) RETURNING *`,
                    [
                        createdFornecedor.id,
                        mdr.bandeiras,
                        mdr.debitopos, mdr.creditopos, mdr.credito2xpos, mdr.credito7xpos, mdr.voucherpos,
                        mdr.prepos, mdr.mdrpos, mdr.cminpos, mdr.cmaxpos, mdr.antecipacao,
                        mdr.debitoonline, mdr.creditoonline, mdr.credito2xonline, mdr.credito7xonline, mdr.voucheronline,
                        mdr.preonline, mdr.mdronline, mdr.cminonline, mdr.cmaxonline, mdr.antecipacaoonline
                    ]
                );
                createdMdr = mdrResult.rows[0];

                if (mdr.mcc && Array.isArray(mdr.mcc) && mdr.mcc.length > 0 ){
                    const values = mdr.mcc.map((categoyId, i) => `($1, $${i + 2})`).join(', ');
                    const categoryIds = mdr.mcc.map(id => parseInt(id as unknown as string, 10));
                    await sql.query(
                        `INSERT INTO fornecedor_categories (fornecedor_id, category_id) VALUES ${values}`,
                        [createdFornecedor.id, ...categoryIds]
                    );
                }
            } catch (mdrError: unknown){
                const msg = getErrorMessage(mdrError);
                console.error("Error creating MDR:", msg);
                return NextResponse.json({
                    fornecedor: createdFornecedor,
                    warning: "Fornecedor criado, mas houve um erro ao criar o MDR. " + msg
                }, { status: 201});
            }
        }

        
        return NextResponse.json({fornecedor: createdFornecedor, mdr: createdMdr, message: createdMdr? "Fornecedor e MDR criados com sucesso" : "Fonecedor: Status OK"}, { status: 201 });
    } catch (error: unknown) {
        const message = getErrorMessage(error);
        if (message.includes('duplicate key value')) {
            return NextResponse.json({ error: 'CNPJ duplicado' }, { status: 409 });
        }
        console.error("Error creating fornecedor in API route:", message);
        return NextResponse.json({ error: "Error creating fornecedor" }, { status: 500 });
    }

}
