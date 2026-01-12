import { NextRequest, NextResponse } from 'next/server';
import { isoMarginsRepository, LinkedMdrTable } from '@/lib/db/iso-margins';
import { getCurrentUser } from '@/lib/auth';
import { isSuperAdmin, getUserMultiIsoAccess } from '@/lib/permissions/check-permissions';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ customerId: string }> }
): Promise<NextResponse> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { customerId } = await params;
    const customerIdNum = parseInt(customerId);

    if (isNaN(customerIdNum)) {
      return NextResponse.json({ error: 'ID do ISO inválido' }, { status: 400 });
    }

    const superAdmin = await isSuperAdmin();
    if (!superAdmin) {
      const allowedIds = await getUserMultiIsoAccess(user.id);
      if (!allowedIds.includes(customerIdNum)) {
        return NextResponse.json({ error: 'Acesso negado a este ISO' }, { status: 403 });
      }
    }

    const includeAllStatuses = superAdmin;
    const linkedTables = await isoMarginsRepository.getLinkedMdrTables(customerIdNum, includeAllStatuses);

    const formattedTables = await Promise.all(linkedTables.map(async (table: LinkedMdrTable) => {
      const snapshots = await isoMarginsRepository.getCostSnapshots(table.linkId);
      const isoMargins = await isoMarginsRepository.getIsoMdrMargins(table.linkId);
      
      const bandeirasOrder = (table.bandeiras || '').split(',').map(b => b.trim()).filter(Boolean);
      const firstBandeira = bandeirasOrder[0] || snapshots.find(s => s.bandeira !== 'ALL')?.bandeira || 'ALL';
      
      const getSnapshotValue = (modalidade: string, channel: string = 'pos'): string => {
        if (modalidade === 'antecipacao') {
          const snapshot = snapshots.find(s => 
            s.bandeira === 'ALL' && s.modalidade === modalidade && s.channel === channel
          );
          return snapshot?.custoBase || '0.00';
        }
        
        const snapshot = snapshots.find(s => 
          s.bandeira === firstBandeira && s.modalidade === modalidade && s.channel === channel
        );
        return snapshot?.custoBase || '0.00';
      };

      const getIsoMarginValue = (modalidade: string): string => {
        const modalidadeWithChannel = `${modalidade}_pos`;
        const margin = isoMargins.find(m => 
          m.bandeira === firstBandeira && m.modalidade === modalidadeWithChannel
        );
        return margin?.marginIso || '';
      };

      const requiredModalidades = ['debito', 'credito', 'credito2x', 'pix'];
      const allMarginsComplete = requiredModalidades.every(mod => {
        const value = getIsoMarginValue(mod);
        return value !== '' && parseFloat(value) > 0;
      });

      const computedStatus = allMarginsComplete ? 'validada' : 'rascunho';

      if (superAdmin) {
        return {
          linkId: table.linkId,
          id: table.id,
          fornecedorCategoryId: table.fornecedorCategoryId,
          mcc: table.mcc,
          cnae: table.cnae,
          categoryName: table.categoryName,
          fornecedorNome: table.fornecedorNome,
          status: computedStatus,
          custoConsolidado: {
            debito: getSnapshotValue('debito', 'pos'),
            credito: getSnapshotValue('credito', 'pos'),
            credito2x: getSnapshotValue('credito2x', 'pos'),
            pix: getSnapshotValue('pix', 'pos'),
            antecipacao: getSnapshotValue('antecipacao', 'pos')
          },
          margemIso: {
            debito: getIsoMarginValue('debito'),
            credito: getIsoMarginValue('credito'),
            credito2x: getIsoMarginValue('credito2x'),
            pix: getIsoMarginValue('pix'),
            antecipacao: getIsoMarginValue('antecipacao')
          },
          allMarginsComplete,
          bandeira: firstBandeira,
          debitoPos: table.debitoPos,
          creditoPos: table.creditoPos,
          credito2xPos: table.credito2xPos,
          antecipacao: table.antecipacao,
          custoPixPos: table.custoPixPos
        };
      }

      return {
        linkId: table.linkId,
        id: table.id,
        fornecedorCategoryId: table.fornecedorCategoryId,
        mcc: table.mcc,
        cnae: table.cnae,
        categoryName: table.categoryName,
        status: computedStatus,
        custoConsolidado: {
          debito: getSnapshotValue('debito', 'pos'),
          credito: getSnapshotValue('credito', 'pos'),
          credito2x: getSnapshotValue('credito2x', 'pos'),
          pix: getSnapshotValue('pix', 'pos'),
          antecipacao: getSnapshotValue('antecipacao', 'pos')
        },
        margemIso: {
          debito: getIsoMarginValue('debito'),
          credito: getIsoMarginValue('credito'),
          credito2x: getIsoMarginValue('credito2x'),
          pix: getIsoMarginValue('pix'),
          antecipacao: getIsoMarginValue('antecipacao')
        },
        allMarginsComplete,
        bandeira: firstBandeira
      };
    }));

    return NextResponse.json({ 
      tables: formattedTables,
      count: formattedTables.length 
    });

  } catch (error: any) {
    console.error('Erro ao buscar tabelas do ISO:', error);
    return NextResponse.json({ 
      error: 'Erro ao buscar tabelas do ISO' 
    }, { status: 500 });
  }
}
