import { NextRequest, NextResponse } from 'next/server';
import { updateDraftStore } from '@/modules/draft-store';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { draftToken, config } = body;

    if (!draftToken || !config) {
      return NextResponse.json(
        { success: false, error: 'Dados inválidos' },
        { status: 400 }
      );
    }

    const result = await updateDraftStore({ draftToken, config });

    if (!result.success || !result.data) {
      return NextResponse.json(
        { success: false, error: result.error || 'Erro ao atualizar draft' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    console.error('Erro ao atualizar draft store:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
