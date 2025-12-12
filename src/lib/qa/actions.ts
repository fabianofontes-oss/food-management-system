'use server'

import {
  checkStore,
  checkTenant,
  checkCheckoutMode,
  checkPayments,
  checkUserSession,
  checkStoreAccess,
  getLastOrderIdForStore,
  getStoreBySlug,
  type QACheckResult
} from './queries'

export async function runStoreCheck(slug: string): Promise<QACheckResult> {
  return checkStore(slug)
}

export async function runTenantCheck(slug: string): Promise<QACheckResult> {
  return checkTenant(slug)
}

export async function runCheckoutModeCheck(slug: string): Promise<QACheckResult> {
  return checkCheckoutMode(slug)
}

export async function runPaymentsCheck(slug: string): Promise<QACheckResult> {
  return checkPayments(slug)
}

export async function runUserSessionCheck(): Promise<QACheckResult> {
  return checkUserSession()
}

export async function runStoreAccessCheck(slug: string): Promise<QACheckResult> {
  return checkStoreAccess(slug)
}

export async function getLastOrderId(storeSlug: string): Promise<string | null> {
  const store = await getStoreBySlug(storeSlug)
  if (!store) return null
  return getLastOrderIdForStore(store.id)
}
