'use server';

import { draftStoreRepository } from './repository';
import type { CreateDraftStoreInput, UpdateDraftConfigInput, GetDraftStoreInput, DraftConfig } from './types';
import { draftConfigSchema } from './types';

export async function createDraftStore(input: CreateDraftStoreInput) {
  try {
    const isAvailable = await draftStoreRepository.isSlugAvailable(input.slug);
    
    if (!isAvailable) {
      return { success: false, error: 'Slug já está em uso' };
    }

    const draft = await draftStoreRepository.createDraft(input);
    
    return { 
      success: true, 
      data: {
        draftToken: draft.draft_token,
        slug: draft.slug,
      }
    };
  } catch (error) {
    console.error('Erro ao criar draft store:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro desconhecido' 
    };
  }
}

export async function getDraftStore(input: GetDraftStoreInput) {
  try {
    const draft = await draftStoreRepository.getDraftByToken(input);
    
    if (!draft) {
      return { success: false, error: 'Draft não encontrado ou expirado' };
    }

    return { success: true, data: draft };
  } catch (error) {
    console.error('Erro ao buscar draft store:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro desconhecido' 
    };
  }
}

export async function updateDraftStore(input: UpdateDraftConfigInput) {
  try {
    const validation = draftConfigSchema.partial().safeParse(input.config);
    
    if (!validation.success) {
      return { 
        success: false, 
        error: 'Dados inválidos: ' + validation.error.errors[0].message 
      };
    }

    const draft = await draftStoreRepository.updateDraftConfig(input);
    
    return { success: true, data: draft };
  } catch (error) {
    console.error('Erro ao atualizar draft store:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro desconhecido' 
    };
  }
}

export async function checkSlugAvailability(slug: string) {
  try {
    const isAvailable = await draftStoreRepository.isSlugAvailable(slug);
    return { success: true, available: isAvailable };
  } catch (error) {
    console.error('Erro ao verificar disponibilidade:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro desconhecido' 
    };
  }
}
