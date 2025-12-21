import { type StoreRow } from '@/modules/store'
import { StoreRepository } from '@/modules/store/repository'

export type Store = StoreRow

class StoreService {
  async getBySlug(slug: string): Promise<Store | null> {
    const store = await StoreRepository.getBySlug(slug)
    return store as unknown as Store | null
  }

  async getById(id: string): Promise<Store | null> {
    const store = await StoreRepository.getById(id)
    return store as unknown as Store | null
  }

  async update(id: string, data: Partial<Store>): Promise<boolean> {
    return StoreRepository.update(id, data as unknown as Partial<StoreRow>)
  }

  async updateSettings(id: string, settings: Record<string, unknown>): Promise<boolean> {
    return StoreRepository.updateSettings(id, settings)
  }

  async getSettings(id: string): Promise<Record<string, unknown> | null> {
    const settings = await StoreRepository.getSettings(id)
    return settings as unknown as Record<string, unknown> | null
  }
}

export const storeService = new StoreService()
