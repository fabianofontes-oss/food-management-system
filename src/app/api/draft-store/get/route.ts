import { NextRequest, NextResponse } from 'next/server';
import { getDraftStore } from '@/modules/draft-store';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Token não fornecido' },
        { status: 400 }
      );
    }

    const result = await getDraftStore({ draftToken: token });

    if (!result.success || !result.data) {
      return NextResponse.json(
        { success: false, error: result.error || 'Draft não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    console.error('Erro ao buscar draft store:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
