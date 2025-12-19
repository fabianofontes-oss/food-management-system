import { z } from 'zod';

// Schema de validação para configuração do draft
export const draftConfigSchema = z.object({
  storeName: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  storeDescription: z.string().optional(),
  niche: z.enum(['acai', 'burger', 'pizza', 'sushi', 'coffee', 'bakery', 'other']).optional(),
  theme: z.object({
    primaryColor: z.string().optional(),
    logo: z.string().optional(),
  }).optional(),
  products: z.array(z.object({
    name: z.string(),
    description: z.string().optional(),
    price: z.number(),
    category: z.string().optional(),
  })).optional(),
  categories: z.array(z.object({
    name: z.string(),
    order: z.number(),
  })).optional(),
  businessHours: z.object({
    monday: z.object({ open: z.string(), close: z.string() }).optional(),
    tuesday: z.object({ open: z.string(), close: z.string() }).optional(),
    wednesday: z.object({ open: z.string(), close: z.string() }).optional(),
    thursday: z.object({ open: z.string(), close: z.string() }).optional(),
    friday: z.object({ open: z.string(), close: z.string() }).optional(),
    saturday: z.object({ open: z.string(), close: z.string() }).optional(),
    sunday: z.object({ open: z.string(), close: z.string() }).optional(),
  }).optional(),
});

export type DraftConfig = z.infer<typeof draftConfigSchema>;

// Tipo do banco de dados
export interface DraftStore {
  id: string;
  slug: string;
  draft_token: string;
  config: DraftConfig;
  expires_at: string;
  created_at: string;
  updated_at: string;
}

// DTOs
export interface CreateDraftStoreInput {
  slug: string;
}

export interface UpdateDraftConfigInput {
  draftToken: string;
  config: Partial<DraftConfig>;
}

export interface GetDraftStoreInput {
  draftToken: string;
}
