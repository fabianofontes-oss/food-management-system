export const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL || 'https://app.pediu.food'

export const MARKETING_URL =
  process.env.NEXT_PUBLIC_MARKETING_URL || 'https://pediufood.com'

export const STORE_BASE_DOMAIN =
  process.env.NEXT_PUBLIC_STORE_BASE_DOMAIN || 'pediu.food'

export const DRIVER_BASE_DOMAIN =
  process.env.NEXT_PUBLIC_DRIVER_BASE_DOMAIN || 'entregou.food'

export function storePublicUrl(slug: string) {
  return `https://${slug}.${STORE_BASE_DOMAIN}`
}

export function driverPublicUrl(slug: string) {
  return `https://${slug}.${DRIVER_BASE_DOMAIN}`
}
