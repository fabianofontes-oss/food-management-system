import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { draftStoreRepository } from '@/modules/draft-store/repository';

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { draftToken, userId, email, name, phone } = body;

    if (!draftToken || !userId || !email || !name) {
      return NextResponse.json(
        { success: false, error: 'Dados incompletos' },
        { status: 400 }
      );
    }

    const draft = await draftStoreRepository.getDraftByToken({ draftToken });

    if (!draft) {
      return NextResponse.json(
        { success: false, error: 'Draft não encontrado ou expirado' },
        { status: 404 }
      );
    }

    const { slug, config } = draft;
    const supabaseAdmin = getSupabaseAdmin();

    const { data: existingStore } = await supabaseAdmin
      .from('stores')
      .select('id')
      .eq('slug', slug)
      .single();

    if (existingStore) {
      return NextResponse.json(
        { success: false, error: 'Slug já está em uso' },
        { status: 400 }
      );
    }

    const { data: tenant, error: tenantError } = await supabaseAdmin
      .from('tenants')
      .insert({
        name: config.storeName || slug,
        owner_id: userId,
      })
      .select()
      .single();

    if (tenantError || !tenant) {
      console.error('Erro ao criar tenant:', tenantError);
      return NextResponse.json(
        { success: false, error: 'Erro ao criar tenant' },
        { status: 500 }
      );
    }

    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 10);

    const { data: store, error: storeError } = await supabaseAdmin
      .from('stores')
      .insert({
        tenant_id: tenant.id,
        name: config.storeName || slug,
        slug: slug,
        description: config.storeDescription || null,
        status: 'active',
        settings: {
          theme: config.theme || {},
          businessHours: config.businessHours || {},
          niche: config.niche || 'other',
        },
      })
      .select()
      .single();

    if (storeError || !store) {
      console.error('Erro ao criar store:', storeError);
      await supabaseAdmin.from('tenants').delete().eq('id', tenant.id);
      return NextResponse.json(
        { success: false, error: 'Erro ao criar loja' },
        { status: 500 }
      );
    }

    const { error: storeUserError } = await supabaseAdmin
      .from('store_users')
      .insert({
        store_id: store.id,
        user_id: userId,
        role: 'OWNER',
      });

    if (storeUserError) {
      console.error('Erro ao criar store_user:', storeUserError);
      await supabaseAdmin.from('stores').delete().eq('id', store.id);
      await supabaseAdmin.from('tenants').delete().eq('id', tenant.id);
      return NextResponse.json(
        { success: false, error: 'Erro ao vincular usuário à loja' },
        { status: 500 }
      );
    }

    const { error: subscriptionError } = await supabaseAdmin
      .from('subscriptions')
      .insert({
        tenant_id: tenant.id,
        plan_id: 'trial',
        status: 'trialing',
        trial_ends_at: trialEndsAt.toISOString(),
        current_period_start: new Date().toISOString(),
        current_period_end: trialEndsAt.toISOString(),
      });

    if (subscriptionError) {
      console.error('Erro ao criar subscription:', subscriptionError);
    }

    await draftStoreRepository.deleteDraft(draftToken);

    return NextResponse.json({
      success: true,
      slug: store.slug,
      storeId: store.id,
      tenantId: tenant.id,
      trialEndsAt: trialEndsAt.toISOString(),
    });
  } catch (error) {
    console.error('Erro ao publicar draft:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
