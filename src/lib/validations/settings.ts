import { z } from 'zod'

// Validação de CPF
const validateCPF = (cpf: string) => {
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

// Validação de CNPJ
const validateCNPJ = (cnpj: string) => {
  const cleaned = cnpj.replace(/\D/g, '')
  if (cleaned.length !== 14) return false
  if (/^(\d)\1{13}$/.test(cleaned)) return false
  
  let size = cleaned.length - 2
  let numbers = cleaned.substring(0, size)
  const digits = cleaned.substring(size)
  let sum = 0
  let pos = size - 7
  
  for (let i = size; i >= 1; i--) {
    sum += parseInt(numbers.charAt(size - i)) * pos--
    if (pos < 2) pos = 9
  }
  
  let result = sum % 11 < 2 ? 0 : 11 - (sum % 11)
  if (result !== parseInt(digits.charAt(0))) return false
  
  size = size + 1
  numbers = cleaned.substring(0, size)
  sum = 0
  pos = size - 7
  
  for (let i = size; i >= 1; i--) {
    sum += parseInt(numbers.charAt(size - i)) * pos--
    if (pos < 2) pos = 9
  }
  
  result = sum % 11 < 2 ? 0 : 11 - (sum % 11)
  if (result !== parseInt(digits.charAt(1))) return false
  
  return true
}

// Schema para configurações de PIX
const pixConfigSchema = z.object({
  enabled: z.boolean(),
  keyType: z.enum(['cpf', 'cnpj', 'email', 'phone', 'random']).optional(),
  keyValue: z.string().optional(),
}).refine(
  (data) => {
    if (!data.enabled) return true
    if (!data.keyType || !data.keyValue) return false
    
    switch (data.keyType) {
      case 'cpf':
        return validateCPF(data.keyValue)
      case 'cnpj':
        return validateCNPJ(data.keyValue)
      case 'email':
        return z.string().email().safeParse(data.keyValue).success
      case 'phone':
        const cleaned = data.keyValue.replace(/\D/g, '')
        return cleaned.length >= 10 && cleaned.length <= 11
      case 'random':
        return data.keyValue.length >= 32
      default:
        return false
    }
  },
  {
    message: 'Chave PIX inválida para o tipo selecionado',
    path: ['keyValue'],
  }
)

// Schema para configurações de Delivery
const deliveryConfigSchema = z.object({
  enabled: z.boolean(),
  fee: z.number().min(0, 'Taxa deve ser maior ou igual a zero').optional(),
  minRadius: z.number().min(0, 'Raio deve ser maior ou igual a zero').optional(),
  avgTime: z.number().min(1, 'Tempo deve ser maior que zero').optional(),
}).refine(
  (data) => {
    if (!data.enabled) return true
    return data.fee !== undefined && data.minRadius !== undefined && data.avgTime !== undefined
  },
  {
    message: 'Todos os campos de delivery são obrigatórios quando ativado',
  }
)

// Schema para WhatsApp
const whatsappConfigSchema = z.object({
  enabled: z.boolean(),
  phoneNumber: z.string().optional(),
  apiToken: z.string().optional(),
}).refine(
  (data) => {
    if (!data.enabled) return true
    if (!data.phoneNumber || !data.apiToken) return false
    const cleaned = data.phoneNumber.replace(/\D/g, '')
    return cleaned.length >= 10 && cleaned.length <= 11
  },
  {
    message: 'Número de telefone e token da API são obrigatórios',
  }
)

// Schema para Programa de Fidelidade
const loyaltyConfigSchema = z.object({
  enabled: z.boolean(),
  pointsPerReal: z.number().min(0).optional(),
  minPointsToRedeem: z.number().min(0).optional(),
  rewardValue: z.number().min(0).optional(),
}).refine(
  (data) => {
    if (!data.enabled) return true
    return data.pointsPerReal !== undefined && 
           data.minPointsToRedeem !== undefined && 
           data.rewardValue !== undefined
  },
  {
    message: 'Todos os campos do programa de fidelidade são obrigatórios',
  }
)

// Schema para iFood
const ifoodConfigSchema = z.object({
  enabled: z.boolean(),
  merchantId: z.string().optional(),
  apiKey: z.string().optional(),
}).refine(
  (data) => {
    if (!data.enabled) return true
    return data.merchantId && data.apiKey && data.merchantId.length > 0 && data.apiKey.length > 0
  },
  {
    message: 'Merchant ID e API Key são obrigatórios',
  }
)

// Schema para Rappi
const rappiConfigSchema = z.object({
  enabled: z.boolean(),
  storeId: z.string().optional(),
  apiKey: z.string().optional(),
}).refine(
  (data) => {
    if (!data.enabled) return true
    return data.storeId && data.apiKey && data.storeId.length > 0 && data.apiKey.length > 0
  },
  {
    message: 'Store ID e API Key são obrigatórios',
  }
)

// Schema para Uber Eats
const uberEatsConfigSchema = z.object({
  enabled: z.boolean(),
  storeId: z.string().optional(),
  apiKey: z.string().optional(),
}).refine(
  (data) => {
    if (!data.enabled) return true
    return data.storeId && data.apiKey && data.storeId.length > 0 && data.apiKey.length > 0
  },
  {
    message: 'Store ID e API Key são obrigatórios',
  }
)

// Schema para Checkout
const checkoutConfigSchema = z.object({
  mode: z.enum(['guest', 'phone_required']).default('phone_required'),
})

// Schema principal de configurações
export const settingsFormSchema = z.object({
  // Funcionalidades Principais
  enablePOS: z.boolean().default(true),
  enableKitchen: z.boolean().default(true),
  enableDelivery: z.boolean().default(true),
  enableDineIn: z.boolean().default(true),
  enableTakeout: z.boolean().default(true),
  
  // Formas de Pagamento
  enableCash: z.boolean().default(true),
  enableCreditCard: z.boolean().default(true),
  enableDebitCard: z.boolean().default(true),
  pix: pixConfigSchema,
  
  // Delivery com campos condicionais
  delivery: deliveryConfigSchema,
  
  // Notificações
  enableOrderNotifications: z.boolean().default(true),
  whatsapp: whatsappConfigSchema,
  enableEmail: z.boolean().default(true),
  enableSoundAlerts: z.boolean().default(true),
  
  // Recursos Avançados
  loyalty: loyaltyConfigSchema,
  enableCoupons: z.boolean().default(true),
  enableScheduling: z.boolean().default(false),
  enableTableManagement: z.boolean().default(false),
  enableInventory: z.boolean().default(false),
  
  // Impressão
  enableAutoPrint: z.boolean().default(false),
  enableKitchenPrint: z.boolean().default(true),
  
  // Integrações
  ifood: ifoodConfigSchema,
  rappi: rappiConfigSchema,
  uberEats: uberEatsConfigSchema,
  
  // Checkout
  checkout: checkoutConfigSchema,
})

export type SettingsFormData = z.infer<typeof settingsFormSchema>

export const defaultSettings: SettingsFormData = {
  enablePOS: true,
  enableKitchen: true,
  enableDelivery: true,
  enableDineIn: true,
  enableTakeout: true,
  enableCash: true,
  enableCreditCard: true,
  enableDebitCard: true,
  pix: {
    enabled: false,
  },
  delivery: {
    enabled: false,
  },
  enableOrderNotifications: true,
  whatsapp: {
    enabled: false,
  },
  enableEmail: true,
  enableSoundAlerts: true,
  loyalty: {
    enabled: false,
  },
  enableCoupons: true,
  enableScheduling: false,
  enableTableManagement: false,
  enableInventory: false,
  enableAutoPrint: false,
  enableKitchenPrint: true,
  ifood: {
    enabled: false,
  },
  rappi: {
    enabled: false,
  },
  uberEats: {
    enabled: false,
  },
  checkout: {
    mode: 'phone_required',
  },
}
