'use server'

import type { CompleteSignupInput, CompleteSignupResult, ReserveSlugResult } from './types'
import { normalizeSlug, isValidSlug } from './types'
import { OnboardingRepository } from './repository'

export async function reserveSlugAction(rawSlug: string): Promise<ReserveSlugResult> {
  const slug = normalizeSlug(rawSlug)
  if (!isValidSlug(slug)) {
    throw new Error('Slug inválido')
  }
  return OnboardingRepository.reserveSlug(slug)
}

export async function completeSignupAction(input: CompleteSignupInput): Promise<CompleteSignupResult> {
  if (!input.token || !input.userId || !input.email || !input.name) {
    throw new Error('Dados inválidos')
  }
  return OnboardingRepository.completeSignup(input)
}
