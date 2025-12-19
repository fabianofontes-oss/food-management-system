/**
 * Rota de rewrite para subdomínios: {slug}.pediu.food → /s/{slug}
 * Reexporta a página pública do cardápio
 */

export { default } from '@/app/[slug]/page'
export { generateMetadata } from '@/app/[slug]/page'
export { dynamic } from '@/app/[slug]/page'
