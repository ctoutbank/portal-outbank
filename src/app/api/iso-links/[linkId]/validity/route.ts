import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { setLinkValidityDates, getIsoLinkWithVersionInfo, applyPendingVersion } from '@/lib/db/mdr-versioning';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ linkId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { linkId } = await params;
    const link = await getIsoLinkWithVersionInfo(linkId);

    if (!link) {
      return NextResponse.json({ error: 'Link não encontrado' }, { status: 404 });
    }

    return NextResponse.json({ link });
  } catch (error) {
    console.error('Erro ao buscar link:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ linkId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    if (user.userType !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Apenas Super Admin pode definir datas de validade' }, { status: 403 });
    }

    const { linkId } = await params;
    const body = await request.json();
    const { validFrom, validUntil, autoRenew } = body;

    if (!validFrom || !validUntil) {
      return NextResponse.json({ error: 'Datas obrigatórias' }, { status: 400 });
    }

    await setLinkValidityDates(linkId, validFrom, validUntil, autoRenew ?? true);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao definir validade:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ linkId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    if (user.userType !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Apenas Super Admin pode aplicar versões' }, { status: 403 });
    }

    const { linkId } = await params;
    const body = await request.json();
    
    if (body.action === 'apply_pending_version') {
      await applyPendingVersion(linkId);
      return NextResponse.json({ success: true, message: 'Nova versão aplicada com sucesso' });
    }

    return NextResponse.json({ error: 'Ação inválida' }, { status: 400 });
  } catch (error) {
    console.error('Erro ao aplicar versão:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
