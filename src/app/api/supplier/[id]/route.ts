import { NextRequest, NextResponse } from 'next/server';
import { fornecedoresRepository } from '@/lib/db/fornecedores';
import { FornecedorFormData } from '@/types/fornecedor';

export async function GET(
    request: NextRequest,
    { params }: { params: {id: string} }
) {
    try{
    const supplier = await fornecedoresRepository.getById(params.id);

    if (!supplier) {
        return NextResponse.json({ error: 'Fornecedor não encontrado' }, { status: 404 });
    }
    return NextResponse.json(supplier);
    } catch (error) {
        console.error("Error fetching fornecedor by ID in API route:", error);
        return NextResponse.json({ error: "Error fetching fornecedor" }, { status: 500 });
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: {id: string}}
){
    try{
        const data: Partial<FornecedorFormData> = await request.json();
        if(data.cnpj){
            const exists = await fornecedoresRepository.existsByCNPJ(data.cnpj, params.id);
            if (exists) {
                return NextResponse.json({ error: "Fornecedor com este CNPJ já existe." }, { status: 400 });
            }
        }

        const result = await fornecedoresRepository.update(params.id, data);
        return NextResponse.json(result);
    } catch (error) {
        console.error("Error updating fornecedor in API route:", error);
        return NextResponse.json({ error: "Error updating fornecedor" }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: {id: string}}
){
    try {
        await fornecedoresRepository.delete(params.id);
        return NextResponse.json({ success: true });

    } catch (error){
        console.error('Error deleting fornecedor in API route:', error);
        return NextResponse.json({ error: 'Error deleting fornecedor' }, { status: 500 });
    }
}