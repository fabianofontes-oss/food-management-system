export function mapOrderError(err: unknown): string {
  const msg =
    typeof err === 'string'
      ? err
      : err && typeof err === 'object' && 'message' in err
        ? String((err as { message?: unknown }).message)
        : ''

  const normalized = msg.toLowerCase()

  if (normalized.includes('out_of_stock')) {
    return 'Produto sem estoque. Ajuste seu carrinho.'
  }

  if (normalized.includes('delivery_address is required')) {
    return 'Endereço é obrigatório para delivery.'
  }

  if (normalized.includes('delivery_address') && normalized.includes('obrigat')) {
    return 'Endereço é obrigatório para delivery.'
  }

  return 'Não foi possível criar o pedido. Tente novamente.'
}
