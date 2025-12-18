import type { CheckoutFormData, CheckoutMode } from '../types'

export interface ValidationResult {
  isValid: boolean
  errors: string[]
}

export function validateCheckoutForm(
  formData: CheckoutFormData,
  checkoutMode: CheckoutMode
): ValidationResult {
  const errors: string[] = []

  // Validar nome
  if (!formData.name.trim()) {
    errors.push('Nome é obrigatório')
  }

  // Validar telefone baseado no modo
  if (checkoutMode === 'phone_required' && !formData.phone.trim()) {
    errors.push('Telefone é obrigatório')
  }

  // Validar endereço se for delivery
  if (formData.channel === 'DELIVERY') {
    if (!formData.zipCode.trim()) {
      errors.push('CEP é obrigatório')
    }
    if (!formData.street.trim()) {
      errors.push('Rua é obrigatória')
    }
    if (!formData.number.trim()) {
      errors.push('Número é obrigatório')
    }
    if (!formData.district.trim()) {
      errors.push('Bairro é obrigatório')
    }
    if (!formData.city.trim()) {
      errors.push('Cidade é obrigatória')
    }
    if (!formData.state.trim()) {
      errors.push('Estado é obrigatório')
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

export function validateEmail(email: string): boolean {
  if (!email) return true // Email é opcional
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function validatePhone(phone: string): boolean {
  if (!phone) return true // Pode ser opcional dependendo do modo
  const phoneRegex = /^\(?[1-9]{2}\)?\s?9?\d{4}-?\d{4}$/
  return phoneRegex.test(phone.replace(/\s/g, ''))
}

export function validateZipCode(zipCode: string): boolean {
  if (!zipCode) return false
  const cleanZip = zipCode.replace(/\D/g, '')
  return cleanZip.length === 8
}
