import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';
import type { DraftStore, CreateDraftStoreInput, UpdateDraftConfigInput, GetDraftStoreInput } from './types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient<Database>(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

export const draftStoreRepository = {
  async createDraft(input: CreateDraftStoreInput): Promise<DraftStore> {
    const { data, error } = await supabaseAdmin
      .from('draft_stores')
      .insert({
        slug: input.slug,
        config: {},
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Erro ao criar draft: ${error.message}`);
    }

    return data as DraftStore;
  },

  async getDraftByToken(input: GetDraftStoreInput): Promise<DraftStore | null> {
    const { data, error } = await supabaseAdmin
      .from('draft_stores')
      .select('*')
      .eq('draft_token', input.draftToken)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Erro ao buscar draft: ${error.message}`);
    }

    const now = new Date();
    const expiresAt = new Date(data.expires_at);

    if (expiresAt < now) {
      await this.deleteDraft(input.draftToken);
      return null;
    }

    return data as DraftStore;
  },

  async getDraftBySlug(slug: string): Promise<DraftStore | null> {
    const { data, error } = await supabaseAdmin
      .from('draft_stores')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Erro ao buscar draft por slug: ${error.message}`);
    }

    return data as DraftStore;
  },

  async updateDraftConfig(input: UpdateDraftConfigInput): Promise<DraftStore> {
    const draft = await this.getDraftByToken({ draftToken: input.draftToken });

    if (!draft) {
      throw new Error('Draft não encontrado ou expirado');
    }

    const updatedConfig = {
      ...draft.config,
      ...input.config,
    };

    const { data, error } = await supabaseAdmin
      .from('draft_stores')
      .update({
        config: updatedConfig,
        updated_at: new Date().toISOString(),
      })
      .eq('draft_token', input.draftToken)
      .select()
      .single();

    if (error) {
      throw new Error(`Erro ao atualizar draft: ${error.message}`);
    }

    return data as DraftStore;
  },

  async deleteDraft(draftToken: string): Promise<void> {
    const { error } = await supabaseAdmin
      .from('draft_stores')
      .delete()
      .eq('draft_token', draftToken);

    if (error) {
      throw new Error(`Erro ao deletar draft: ${error.message}`);
    }
  },

  async isSlugAvailable(slug: string): Promise<boolean> {
    const { data: existingStore } = await supabaseAdmin
      .from('stores')
      .select('id')
      .eq('slug', slug)
      .single();

    if (existingStore) {
      return false;
    }

    const { data: existingDraft } = await supabaseAdmin
      .from('draft_stores')
      .select('id')
      .eq('slug', slug)
      .single();

    return !existingDraft;
  },
};
