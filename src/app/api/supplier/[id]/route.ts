import { NextRequest, NextResponse } from 'next/server';
import { fornecedoresRepository } from '@/lib/db/fornecedores';
import { FornecedorFormData } from '@/types/fornecedor';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{id: string}> }
) {
  try {
    const { id } = await params;
    const supplier = await fornecedoresRepository.findById(id);

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
  { params }: { params: Promise<{id: string}>}
) {
  try {
    const {id} = await params;
    const data: Partial<FornecedorFormData> = await request.json();

    if(data.cnpj){
      const exists = await fornecedoresRepository.existsByCnpj(data.cnpj, id);
      if (exists) {
        return NextResponse.json({ error: "Fornecedor com esse CNPJ já existe" }, { status: 409 });
      }
    }

    const updated = await fornecedoresRepository.update(id, data);
    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating fornecedor in API route:", error);
    return NextResponse.json({ error: "Error updating fornecedor" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{id: string}> }
) {
  try {
    const { id } = await params;
    await fornecedoresRepository.delete(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting fornecedor in API route:", error);
    return NextResponse.json({ error: "Error deleting fornecedor" }, { status: 500 });
  }
}
