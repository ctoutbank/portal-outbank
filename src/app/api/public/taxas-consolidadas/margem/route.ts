import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

export const dynamic = 'force-dynamic';

const BANDEIRAS_VALIDAS = ['Master', 'Visa', 'Elo', 'Amex', 'Hipercard', 'Cabal'];
const MODALIDADES_VALIDAS = ['debito', 'credito', 'credito_2x', 'credito_7x', 'voucher', 'pre', 'pix', 'antecipacao'];
const CHANNELS_VALIDOS = ['pos', 'online'];

function normalizeModalidadeForDb(modalidade: string): string {
  if (modalidade === 'credito_2x') return 'credito2x';
  if (modalidade === 'credito_7x') return 'credito7x';
  return modalidade;
}

export async function PUT(request: NextRequest): Promise<NextResponse> {
  try {
    const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;
    if (!dbUrl) {
      return NextResponse.json(
        { error: 'Configuração de banco de dados não encontrada' },
        { status: 500 }
      );
    }

    const sql = neon(dbUrl);

    const apiKey = request.headers.get('x-api-key');
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API Key não fornecida. Use o header x-api-key.' },
        { status: 401 }
      );
    }

    const authResult = await sql`
      SELECT 
        iak.customer_id,
        c.name as customer_name
      FROM iso_api_keys iak
      JOIN customers c ON iak.customer_id = c.id
      WHERE iak.api_key = ${apiKey} AND iak.is_active = true AND c.is_active = true
    ` as { customer_id: number; customer_name: string }[];

    if (!authResult || authResult.length === 0) {
      return NextResponse.json(
        { error: 'API Key inválida ou inativa' },
        { status: 401 }
      );
    }

    const customerId = Number(authResult[0].customer_id);
    const customerName = authResult[0].customer_name;

    const body = await request.json();
    
    if (!body.margens || !Array.isArray(body.margens)) {
      return NextResponse.json(
        { error: 'Formato inválido. Envie um array de margens: { margens: [{ bandeira, modalidade, channel, margin_iso }] }' },
        { status: 400 }
      );
    }

    const resultados: { bandeira: string; modalidade: string; channel: string; margin_iso: string; taxa_final: string; status: string }[] = [];

    for (const margem of body.margens) {
      const { bandeira, modalidade, channel, margin_iso } = margem;

      if (!bandeira || !modalidade || !channel || margin_iso === undefined) {
        resultados.push({
          bandeira: bandeira || '',
          modalidade: modalidade || '',
          channel: channel || '',
          margin_iso: '',
          taxa_final: '',
          status: 'erro: campos obrigatórios faltando'
        });
        continue;
      }

      if (!BANDEIRAS_VALIDAS.includes(bandeira)) {
        resultados.push({
          bandeira,
          modalidade,
          channel,
          margin_iso: '',
          taxa_final: '',
          status: `erro: bandeira inválida. Use: ${BANDEIRAS_VALIDAS.join(', ')}`
        });
        continue;
      }

      if (!MODALIDADES_VALIDAS.includes(modalidade)) {
        resultados.push({
          bandeira,
          modalidade,
          channel,
          margin_iso: '',
          taxa_final: '',
          status: `erro: modalidade inválida. Use: ${MODALIDADES_VALIDAS.join(', ')}`
        });
        continue;
      }

      if (!CHANNELS_VALIDOS.includes(channel)) {
        resultados.push({
          bandeira,
          modalidade,
          channel,
          margin_iso: '',
          taxa_final: '',
          status: `erro: channel inválido. Use: ${CHANNELS_VALIDOS.join(', ')}`
        });
        continue;
      }

      const marginValue = parseFloat(margin_iso);
      if (isNaN(marginValue) || marginValue < 0 || marginValue > 100) {
        resultados.push({
          bandeira,
          modalidade,
          channel,
          margin_iso: margin_iso?.toString() || '',
          taxa_final: '',
          status: 'erro: margin_iso deve ser um número entre 0 e 100'
        });
        continue;
      }

      const modalidadeDb = normalizeModalidadeForDb(modalidade);

      const snapshot = await sql`
        SELECT s.id, s.custo_base, l.id as link_id
        FROM iso_mdr_cost_snapshots s
        JOIN iso_mdr_links l ON s.iso_mdr_link_id = l.id
        WHERE l.customer_id = ${customerId}
          AND s.bandeira = ${bandeira}
          AND s.modalidade = ${modalidadeDb}
          AND s.channel = ${channel}
      ` as { id: string; custo_base: string; link_id: string }[];

      if (!snapshot || snapshot.length === 0) {
        resultados.push({
          bandeira,
          modalidade,
          channel,
          margin_iso: marginValue.toFixed(4),
          taxa_final: '',
          status: 'erro: taxa não encontrada para essa combinação'
        });
        continue;
      }

      const custoBase = parseFloat(snapshot[0].custo_base);
      const taxaFinal = custoBase + marginValue;

      await sql`
        UPDATE iso_mdr_cost_snapshots 
        SET margin_iso = ${marginValue.toFixed(4)},
            taxa_final = ${taxaFinal.toFixed(4)},
            updated_at = NOW()
        WHERE id = ${snapshot[0].id}
      `;

      resultados.push({
        bandeira,
        modalidade,
        channel,
        margin_iso: marginValue.toFixed(4),
        taxa_final: taxaFinal.toFixed(4),
        status: 'atualizado'
      });
    }

    await sql`
      UPDATE iso_api_keys SET last_used_at = NOW() WHERE api_key = ${apiKey}
    `;

    return NextResponse.json({
      iso: customerName,
      customer_id: customerId,
      total_processados: resultados.length,
      resultados
    }, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });

  } catch (error: any) {
    console.error('Erro ao atualizar margem ISO:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  return PUT(request);
}
