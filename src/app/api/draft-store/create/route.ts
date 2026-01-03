import { NextRequest, NextResponse } from 'next/server';
import { createDraftStore } from '@/modules/draft-store';
import { rateLimitByIP } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    // Rate limiting by IP
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const rateLimitResult = await rateLimitByIP(ip);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { success: false, error: 'Muitas tentativas. Aguarde alguns segundos.' },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { slug } = body;

    if (!slug || typeof slug !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Slug inválido' },
        { status: 400 }
      );
    }

    const result = await createDraftStore({ slug });

    if (!result.success || !result.data) {
      return NextResponse.json(
        { success: false, error: result.error || 'Erro ao criar draft' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      draftToken: result.data.draftToken,
      slug: result.data.slug,
    });
  } catch (error) {
    console.error('Erro ao criar draft store:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
