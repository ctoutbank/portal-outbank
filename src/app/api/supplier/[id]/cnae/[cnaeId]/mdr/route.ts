import { NextRequest, NextResponse } from 'next/server';
import { mdrRepository } from '@/lib/db/mdr';
import { fornecedoresRepository } from '@/lib/db/fornecedores';
import { Category } from '@/types/fornecedor';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; cnaeId: string }> }
) {
  try {
    const { id: fornecedorId, cnaeId } = await params;

    console.log('🔍 GET MDR - Fornecedor:', fornecedorId, 'CNAE:', cnaeId);

    // Buscar fornecedor
    const fornecedor = await fornecedoresRepository.findById(fornecedorId);

    if (!fornecedor) {
      console.log('❌ Fornecedor não encontrado');
      return NextResponse.json({ error: 'Fornecedor não encontrado' }, { status: 404 });
    }

    // Buscar category - COMPARAR COMO STRING
    const category = fornecedor.categories?.find((c: Category) => String(c.id) === cnaeId);

    if (!category) {
      console.log('❌ CNAE não encontrado');
      return NextResponse.json({ 
        error: 'CNAE não encontrado para este fornecedor'
      }, { status: 404 });
    }

    // Converter para número APENAS para o banco
    const categoryIdNumber = typeof category.id === 'string' 
      ? parseInt(category.id) 
      : category.id;

    // Buscar MDR
    const mdr = await mdrRepository.findByFornecedorAndCategory(fornecedorId, categoryIdNumber);

    console.log('✅ MDR encontrado:', mdr ? 'Sim' : 'Não');

    return NextResponse.json({
      fornecedor: {
        id: fornecedor.id,
        nome: fornecedor.nome,
        cnpj: fornecedor.cnpj,
      },
      cnae: {
        id: category.id,
        name: category.name,
        cnae: category.cnae,
        mcc: category.mcc,
      },
      mdr: mdr
    });

  } catch (error: any) {
    console.error('❌ Erro ao buscar MDR:', error);
    return NextResponse.json({ 
      error: 'Erro ao buscar MDR',
      details: error.message 
    }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; cnaeId: string }> }
) {
  try {
    const { id: fornecedorId, cnaeId } = await params;
    const data = await request.json();

    console.log('📝 POST MDR - Fornecedor:', fornecedorId, 'CNAE:', cnaeId);

    // Converter cnaeId para número
    const categoryId = parseInt(cnaeId);

    // Criar/atualizar MDR
    const mdr = await mdrRepository.upsert(fornecedorId, categoryId, data);

    console.log('✅ MDR salvo:', mdr.id);

    return NextResponse.json({ 
      success: true, 
      mdr 
    });

  } catch (error: any) {
    console.error('❌ Erro ao salvar MDR:', error);
    return NextResponse.json({ 
      error: 'Erro ao salvar MDR',
      details: error.message 
    }, { status: 500 });
  }
}
