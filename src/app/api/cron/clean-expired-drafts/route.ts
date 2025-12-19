import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireCronAuth } from '@/lib/security/internal-auth';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

export async function POST(req: NextRequest) {
  // SECURITY: Verificar autenticação de cron
  try {
    requireCronAuth(req)
  } catch (error) {
    if (error instanceof Response) {
      return error
    }
    throw error
  }

  try {

    // Deletar drafts expirados
    const { data, error } = await supabaseAdmin
      .from('draft_stores')
      .delete()
      .lt('expires_at', new Date().toISOString())
      .select('slug');

    if (error) {
      console.error('Error cleaning expired drafts:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    const deletedCount = data?.length || 0;

    console.log(`✅ Cleaned ${deletedCount} expired drafts`);

    return NextResponse.json({
      success: true,
      deleted: deletedCount,
      slugs: data?.map(d => d.slug),
    });
  } catch (error) {
    console.error('Error in clean-expired-drafts cron:', error);
    return NextResponse.json(
      { success: false, error: 'Internal error' },
      { status: 500 }
    );
  }
}
