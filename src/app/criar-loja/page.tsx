/**
 * Página de Onboarding - pediufood.com/criar-loja
 * Redireciona para o fluxo de criação de loja
 */

import { redirect } from 'next/navigation'

export default function CriarLojaPage() {
  redirect('/choose-url')
}
