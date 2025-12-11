import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}

export function generateOrderCode(): string {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const letter = letters[Math.floor(Math.random() * letters.length)]
  const number = Math.floor(Math.random() * 999) + 1
  return `${letter}-${number.toString().padStart(3, '0')}`
}

export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.length === 11) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`
  }
  return phone
}

export function formatCPF(cpf: string): string {
  const cleaned = cpf.replace(/\D/g, '')
  if (cleaned.length === 11) {
    return `${cleaned.slice(0, 3)}.${cleaned.slice(3, 6)}.${cleaned.slice(6, 9)}-${cleaned.slice(9)}`
  }
  return cpf
}

export function formatCEP(cep: string): string {
  const cleaned = cep.replace(/\D/g, '')
  if (cleaned.length === 8) {
    return `${cleaned.slice(0, 5)}-${cleaned.slice(5)}`
  }
  return cep
}

export function validateEmail(email: string): boolean {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return regex.test(email)
}

export function validateCPF(cpf: string): boolean {
  const cleaned = cpf.replace(/\D/g, '')
  if (cleaned.length !== 11) return false
  if (/^(\d)\1{10}$/.test(cleaned)) return false
  
  let sum = 0
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleaned.charAt(i)) * (10 - i)
  }
  let digit = 11 - (sum % 11)
  if (digit >= 10) digit = 0
  if (digit !== parseInt(cleaned.charAt(9))) return false
  
  sum = 0
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleaned.charAt(i)) * (11 - i)
  }
  digit = 11 - (sum % 11)
  if (digit >= 10) digit = 0
  if (digit !== parseInt(cleaned.charAt(10))) return false
  
  return true
}

export function validatePhone(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, '')
  return cleaned.length === 10 || cleaned.length === 11
}

export async function fetchAddressByCEP(cep: string): Promise<{
  street: string
  district: string
  city: string
  state: string
  error?: string
} | null> {
  try {
    const cleaned = cep.replace(/\D/g, '')
    if (cleaned.length !== 8) {
      return { street: '', district: '', city: '', state: '', error: 'CEP inválido' }
    }

    const response = await fetch(`https://viacep.com.br/ws/${cleaned}/json/`)
    const data = await response.json()

    if (data.erro) {
      return { street: '', district: '', city: '', state: '', error: 'CEP não encontrado' }
    }

    return {
      street: data.logradouro || '',
      district: data.bairro || '',
      city: data.localidade || '',
      state: data.uf || '',
    }
  } catch (error) {
    return { street: '', district: '', city: '', state: '', error: 'Erro ao buscar CEP' }
  }
}

function crc16(data: string): string {
  let crc = 0xFFFF
  for (let i = 0; i < data.length; i++) {
    crc ^= data.charCodeAt(i) << 8
    for (let j = 0; j < 8; j++) {
      if (crc & 0x8000) {
        crc = (crc << 1) ^ 0x1021
      } else {
        crc = crc << 1
      }
    }
  }
  return (crc & 0xFFFF).toString(16).toUpperCase().padStart(4, '0')
}

export function generatePixQRCode(params: {
  pixKey: string
  merchantName: string
  merchantCity: string
  amount: number
  txid?: string
}): string {
  const { pixKey, merchantName, merchantCity, amount, txid = 'TXID123456789' } = params

  const payload = [
    '00020126',
    `0014BR.GOV.BCB.PIX01${pixKey.length.toString().padStart(2, '0')}${pixKey}`,
    `52040000`,
    `5303986`,
    `5802BR`,
    `59${merchantName.length.toString().padStart(2, '0')}${merchantName}`,
    `60${merchantCity.length.toString().padStart(2, '0')}${merchantCity}`,
    `54${amount.toFixed(2).length.toString().padStart(2, '0')}${amount.toFixed(2)}`,
    `62${(4 + txid.length).toString().padStart(2, '0')}05${txid.length.toString().padStart(2, '0')}${txid}`,
    '6304'
  ].join('')

  const crcValue = crc16(payload)
  return payload + crcValue
}

export function generatePixQRCodeURL(pixCode: string): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(pixCode)}`
}

export function calculateDiscount(subtotal: number, discountType: 'percentage' | 'fixed', discountValue: number): number {
  if (discountType === 'percentage') {
    return subtotal * (discountValue / 100)
  }
  return Math.min(discountValue, subtotal)
}

export function isValidCoupon(coupon: {
  code: string
  valid_from: string
  valid_until: string
  min_order_value?: number
  max_uses?: number
  current_uses?: number
}, orderValue: number): { valid: boolean; error?: string } {
  const now = new Date()
  const validFrom = new Date(coupon.valid_from)
  const validUntil = new Date(coupon.valid_until)

  if (now < validFrom) {
    return { valid: false, error: 'Cupom ainda não está válido' }
  }

  if (now > validUntil) {
    return { valid: false, error: 'Cupom expirado' }
  }

  if (coupon.min_order_value && orderValue < coupon.min_order_value) {
    return { valid: false, error: `Valor mínimo do pedido: ${formatCurrency(coupon.min_order_value)}` }
  }

  if (coupon.max_uses && coupon.current_uses && coupon.current_uses >= coupon.max_uses) {
    return { valid: false, error: 'Cupom esgotado' }
  }

  return { valid: true }
}
