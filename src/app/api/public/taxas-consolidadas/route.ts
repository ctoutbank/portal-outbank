import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

export const dynamic = 'force-dynamic';

interface TaxaChannel {
  debito: { custo_base: string; margin_iso: string; taxa_final: string };
  credito: { custo_base: string; margin_iso: string; taxa_final: string };
  credito_2x: { custo_base: string; margin_iso: string; taxa_final: string };
  credito_7x: { custo_base: string; margin_iso: string; taxa_final: string };
  voucher: { custo_base: string; margin_iso: string; taxa_final: string };
  pre: { custo_base: string; margin_iso: string; taxa_final: string };
  pix: { custo_base: string; margin_iso: string; taxa_final: string };
  antecipacao: { custo_base: string; margin_iso: string; taxa_final: string };
}

interface TaxasPorBandeira {
  bandeira: string;
  pos: TaxaChannel;
  online: TaxaChannel;
}

export async function GET(request: NextRequest): Promise<NextResponse> {
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

    await sql`
      UPDATE iso_api_keys SET last_used_at = NOW() WHERE api_key = ${apiKey}
    `;

    const searchParams = request.nextUrl.searchParams;
    const bandeiraFilter = searchParams.get('bandeira');
    const channelFilter = searchParams.get('channel');

    const taxas = await sql`
      SELECT 
        bandeira,
        modalidade,
        channel,
        custo_base,
        margin_iso,
        taxa_final
      FROM vw_taxas_consolidadas
      WHERE customer_id = ${customerId}
      ORDER BY bandeira, channel, modalidade
    ` as { bandeira: string; modalidade: string; channel: string; custo_base: string; margin_iso: string; taxa_final: string }[];

    // Separar antecipação (bandeira "ALL") das outras taxas
    const antecipacaoTaxas = taxas.filter(t => t.bandeira === 'ALL' && t.modalidade === 'antecipacao');
    const antecipacaoPOS = antecipacaoTaxas.find(t => t.channel === 'pos');
    const antecipacaoOnline = antecipacaoTaxas.find(t => t.channel === 'online');
    
    // Filtrar bandeira "ALL" das taxas normais
    let filteredTaxas = taxas.filter(t => t.bandeira !== 'ALL');

    if (bandeiraFilter) {
      filteredTaxas = filteredTaxas.filter(t => 
        t.bandeira.toLowerCase() === bandeiraFilter.toLowerCase()
      );
    }

    if (channelFilter) {
      filteredTaxas = filteredTaxas.filter(t => 
        t.channel.toLowerCase() === channelFilter.toLowerCase()
      );
    }

    // Criar valores de antecipação para aplicar em todas as bandeiras
    const antecipacaoPOSValue = antecipacaoPOS ? {
      custo_base: antecipacaoPOS.custo_base?.toString() || '0.00',
      margin_iso: antecipacaoPOS.margin_iso?.toString() || '0.00',
      taxa_final: antecipacaoPOS.taxa_final?.toString() || '0.00'
    } : { custo_base: '0.00', margin_iso: '0.00', taxa_final: '0.00' };
    
    const antecipacaoOnlineValue = antecipacaoOnline ? {
      custo_base: antecipacaoOnline.custo_base?.toString() || '0.00',
      margin_iso: antecipacaoOnline.margin_iso?.toString() || '0.00',
      taxa_final: antecipacaoOnline.taxa_final?.toString() || '0.00'
    } : { custo_base: '0.00', margin_iso: '0.00', taxa_final: '0.00' };

    const defaultTaxa = { custo_base: '0.00', margin_iso: '0.00', taxa_final: '0.00' };
    const bandeirasMap: Record<string, TaxasPorBandeira> = {};

    for (const taxa of filteredTaxas) {
      const bandeira = taxa.bandeira;
      
      if (!bandeirasMap[bandeira]) {
        bandeirasMap[bandeira] = {
          bandeira,
          pos: {
            debito: { ...defaultTaxa },
            credito: { ...defaultTaxa },
            credito_2x: { ...defaultTaxa },
            credito_7x: { ...defaultTaxa },
            voucher: { ...defaultTaxa },
            pre: { ...defaultTaxa },
            pix: { ...defaultTaxa },
            antecipacao: { ...antecipacaoPOSValue }
          },
          online: {
            debito: { ...defaultTaxa },
            credito: { ...defaultTaxa },
            credito_2x: { ...defaultTaxa },
            credito_7x: { ...defaultTaxa },
            voucher: { ...defaultTaxa },
            pre: { ...defaultTaxa },
            pix: { ...defaultTaxa },
            antecipacao: { ...antecipacaoOnlineValue }
          }
        };
      }

      const channel = taxa.channel as 'pos' | 'online';
      let modalidade = taxa.modalidade.replace('_pos', '').replace('_online', '');
      if (modalidade === 'credito2x') modalidade = 'credito_2x';
      if (modalidade === 'credito7x') modalidade = 'credito_7x';
      const modalidadeKey = modalidade as keyof TaxaChannel;
      
      if (bandeirasMap[bandeira][channel] && modalidadeKey in bandeirasMap[bandeira][channel]) {
        bandeirasMap[bandeira][channel][modalidadeKey] = {
          custo_base: taxa.custo_base?.toString() || '0.00',
          margin_iso: taxa.margin_iso?.toString() || '0.00',
          taxa_final: taxa.taxa_final?.toString() || '0.00'
        };
      }
    }

    const taxasAgrupadas = Object.values(bandeirasMap);

    // Criar taxas_detalhadas incluindo antecipação para cada bandeira
    const taxasDetalhadas = filteredTaxas.map(t => {
      let modalidadeNorm = t.modalidade.replace('_pos', '').replace('_online', '');
      if (modalidadeNorm === 'credito2x') modalidadeNorm = 'credito_2x';
      if (modalidadeNorm === 'credito7x') modalidadeNorm = 'credito_7x';
      return {
        bandeira: t.bandeira,
        modalidade: modalidadeNorm,
        channel: t.channel,
        custo_base: t.custo_base?.toString() || '0.00',
        margin_iso: t.margin_iso?.toString() || '0.00',
        taxa_final: t.taxa_final?.toString() || '0.00'
      };
    });

    // Adicionar antecipação para cada bandeira (se não filtrado por channel específico ou se channel=pos/online)
    const bandeirasUnicas = [...new Set(filteredTaxas.map(t => t.bandeira))];
    for (const bandeira of bandeirasUnicas) {
      if (!channelFilter || channelFilter.toLowerCase() === 'pos') {
        taxasDetalhadas.push({
          bandeira,
          modalidade: 'antecipacao',
          channel: 'pos',
          custo_base: antecipacaoPOSValue.custo_base,
          margin_iso: antecipacaoPOSValue.margin_iso,
          taxa_final: antecipacaoPOSValue.taxa_final
        });
      }
      if (!channelFilter || channelFilter.toLowerCase() === 'online') {
        taxasDetalhadas.push({
          bandeira,
          modalidade: 'antecipacao',
          channel: 'online',
          custo_base: antecipacaoOnlineValue.custo_base,
          margin_iso: antecipacaoOnlineValue.margin_iso,
          taxa_final: antecipacaoOnlineValue.taxa_final
        });
      }
    }

    return NextResponse.json({
      iso: customerName,
      customer_id: customerId,
      total_bandeiras: taxasAgrupadas.length,
      total_taxas: taxasDetalhadas.length,
      taxas: taxasAgrupadas,
      taxas_detalhadas: taxasDetalhadas
    }, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });

  } catch (error: any) {
    console.error('Erro na API pública de taxas:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  return GET(request);
}
