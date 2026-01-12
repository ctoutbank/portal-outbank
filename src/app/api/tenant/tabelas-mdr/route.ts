import { NextRequest, NextResponse } from 'next/server';
import { isoMarginsRepository, LinkedMdrTable } from '@/lib/db/iso-margins';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const MODALIDADES = ['debito', 'credito', 'credito2x', 'credito7x', 'voucher', 'pre', 'pix', 'antecipacao'] as const;
const CHANNELS = ['pos', 'online'] as const;

type Modalidade = typeof MODALIDADES[number];
type Channel = typeof CHANNELS[number];

interface TaxaCell {
  custo_base: string;
  margin_iso: string;
  taxa_final: string;
}

interface BandeiraData {
  bandeira: string;
  taxas: {
    [key in Channel]: {
      [key in Modalidade]: TaxaCell;
    };
  };
}

interface FormattedTable {
  linkId: string;
  id: string;
  categoryName: string;
  mcc: string | null;
  cnae: string | null;
  fornecedorNome: string;
  status: string;
  bandeiras: string[];
  data: BandeiraData[];
  antecipacao: {
    pos: TaxaCell;
    online: TaxaCell;
  };
}

async function getTenantCustomerId(): Promise<{ customerId: number } | null> {
  const user = await getCurrentUser();
  if (!user) {
    return null;
  }

  if (!user.idCustomer || typeof user.idCustomer !== 'number') {
    return null;
  }

  return { customerId: user.idCustomer };
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const tenantResult = await getTenantCustomerId();
    if (!tenantResult) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { customerId } = tenantResult;

    const linkedTables = await isoMarginsRepository.getLinkedMdrTables(customerId, false);

    const formattedTables: FormattedTable[] = await Promise.all(linkedTables.map(async (table: LinkedMdrTable) => {
      const snapshots = await isoMarginsRepository.getCostSnapshots(table.linkId);
      const isoMargins = await isoMarginsRepository.getIsoMdrMargins(table.linkId);
      
      const bandeirasOrder = (table.bandeiras || '').split(',').map(b => b.trim()).filter(Boolean);
      
      const defaultCell: TaxaCell = { custo_base: '0.00', margin_iso: '0.00', taxa_final: '0.00' };
      
      const getSnapshotForBandeira = (bandeira: string, modalidade: string, channel: string): TaxaCell => {
        const snapshot = snapshots.find(s => 
          s.bandeira === bandeira && s.modalidade === modalidade && s.channel === channel
        );
        if (!snapshot) return { ...defaultCell };
        return {
          custo_base: snapshot.custoBase || '0.00',
          margin_iso: snapshot.marginIso || '0.00',
          taxa_final: snapshot.taxaFinal || '0.00'
        };
      };
      
      const getIsoMarginForBandeira = (bandeira: string, modalidade: string, channel: string): string => {
        const modalidadeWithChannel = `${modalidade}_${channel}`;
        const margin = isoMargins.find(m => 
          m.bandeira === bandeira && m.modalidade === modalidadeWithChannel
        );
        return margin?.marginIso || '0.0000';
      };
      
      const bandeiraDataList: BandeiraData[] = bandeirasOrder.map(bandeira => {
        const taxas = {} as BandeiraData['taxas'];
        
        for (const channel of CHANNELS) {
          taxas[channel] = {} as { [key in Modalidade]: TaxaCell };
          
          for (const modalidade of MODALIDADES) {
            if (modalidade === 'antecipacao') {
              taxas[channel][modalidade] = { ...defaultCell };
              continue;
            }
            
            const snapshot = getSnapshotForBandeira(bandeira, modalidade, channel);
            const marginIso = getIsoMarginForBandeira(bandeira, modalidade, channel);
            
            const custoBase = parseFloat(snapshot.custo_base) || 0;
            const margin = parseFloat(marginIso) || 0;
            const taxaFinal = custoBase + margin;
            
            taxas[channel][modalidade] = {
              custo_base: custoBase.toFixed(2),
              margin_iso: margin.toFixed(4),
              taxa_final: taxaFinal.toFixed(2)
            };
          }
        }
        
        return { bandeira, taxas };
      });
      
      const getAntecipacao = (channel: Channel): TaxaCell => {
        const snapshot = snapshots.find(s => 
          s.bandeira === 'ALL' && s.modalidade === 'antecipacao' && s.channel === channel
        );
        if (!snapshot) return { ...defaultCell };
        return {
          custo_base: snapshot.custoBase || '0.00',
          margin_iso: snapshot.marginIso || '0.00',
          taxa_final: snapshot.taxaFinal || '0.00'
        };
      };

      return {
        linkId: table.linkId,
        id: table.id,
        categoryName: table.categoryName,
        mcc: table.mcc,
        cnae: table.cnae,
        fornecedorNome: table.fornecedorNome,
        status: table.status || 'rascunho',
        bandeiras: bandeirasOrder,
        data: bandeiraDataList,
        antecipacao: {
          pos: getAntecipacao('pos'),
          online: getAntecipacao('online')
        }
      };
    }));

    return NextResponse.json({ tables: formattedTables });

  } catch (error: any) {
    console.error('Erro ao buscar tabelas MDR do tenant:', error);
    return NextResponse.json({ error: 'Erro ao buscar tabelas MDR' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest): Promise<NextResponse> {
  try {
    const tenantResult = await getTenantCustomerId();
    if (!tenantResult) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { customerId } = tenantResult;
    const body = await request.json();
    const { margins } = body;

    if (!Array.isArray(margins) || margins.length === 0) {
      return NextResponse.json({ error: 'Nenhuma margem fornecida' }, { status: 400 });
    }

    const results: { success: boolean; linkId: string; modalidade: string; error?: string }[] = [];

    for (const margin of margins) {
      const { linkId, bandeira, modalidade, marginIso, channel = 'pos' } = margin;

      if (!linkId || !bandeira || !modalidade) {
        results.push({ success: false, linkId: linkId || '', modalidade: modalidade || '', error: 'Dados incompletos' });
        continue;
      }

      const linkBelongsToTenant = await validateLinkOwnership(linkId, customerId);
      if (!linkBelongsToTenant) {
        results.push({ success: false, linkId, modalidade, error: 'Link não pertence a este ISO' });
        continue;
      }

      const strValue = String(marginIso).trim().replace(',', '.');
      const numValue = parseFloat(strValue);
      
      if (isNaN(numValue) || numValue < 0) {
        results.push({ success: false, linkId, modalidade, error: 'Valor de margem inválido' });
        continue;
      }

      const normalizedValue = numValue.toFixed(4);
      const modalidadeWithChannel = modalidade.includes('_') ? modalidade : `${modalidade}_${channel}`;

      try {
        await isoMarginsRepository.upsertIsoMdrMargin(linkId, bandeira, modalidadeWithChannel, normalizedValue);
        await isoMarginsRepository.generateCostSnapshots(linkId);
        results.push({ success: true, linkId, modalidade: modalidadeWithChannel });
      } catch (error) {
        console.error('Erro ao salvar margem:', error);
        results.push({ success: false, linkId, modalidade, error: 'Erro ao salvar' });
      }
    }

    const allSuccess = results.every(r => r.success);
    return NextResponse.json({ 
      success: allSuccess, 
      results,
      message: allSuccess ? 'Margens salvas com sucesso' : 'Algumas margens não foram salvas'
    });

  } catch (error: any) {
    console.error('Erro ao salvar margens do tenant:', error);
    return NextResponse.json({ error: 'Erro ao salvar margens' }, { status: 500 });
  }
}

async function validateLinkOwnership(linkId: string, customerId: number): Promise<boolean> {
  const { sql } = await import('@vercel/postgres');
  const { rows } = await sql.query(`
    SELECT id FROM iso_mdr_links WHERE id = $1 AND customer_id = $2
  `, [linkId, customerId]);
  return rows.length > 0;
}
