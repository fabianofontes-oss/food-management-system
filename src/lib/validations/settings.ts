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

// Schema para configurações de PIX (simplificado - permite salvar sem validar chave)
const pixConfigSchema = z.object({
  enabled: z.boolean(),
  keyType: z.enum(['cpf', 'cnpj', 'email', 'phone', 'random']).optional(),
  keyValue: z.string().optional(),
})

// Schema para configurações de Delivery (simplificado)
const deliveryConfigSchema = z.object({
  enabled: z.boolean(),
  fee: z.number().min(0).optional(),
  minRadius: z.number().min(0).optional(),
  avgTime: z.number().min(1).optional(),
})

// Schema para WhatsApp (simplificado)
const whatsappConfigSchema = z.object({
  enabled: z.boolean(),
  phoneNumber: z.string().optional(),
  apiToken: z.string().optional(),
})

// Schema para Programa de Fidelidade (simplificado)
const loyaltyConfigSchema = z.object({
  enabled: z.boolean(),
  pointsPerReal: z.number().min(0).optional(),
  minPointsToRedeem: z.number().min(0).optional(),
  rewardValue: z.number().min(0).optional(),
})

// Schema para iFood (simplificado)
const ifoodConfigSchema = z.object({
  enabled: z.boolean(),
  merchantId: z.string().optional(),
  apiKey: z.string().optional(),
})

// Schema para Rappi (simplificado)
const rappiConfigSchema = z.object({
  enabled: z.boolean(),
  storeId: z.string().optional(),
  apiKey: z.string().optional(),
})

// Schema para Uber Eats (simplificado)
const uberEatsConfigSchema = z.object({
  enabled: z.boolean(),
  storeId: z.string().optional(),
  apiKey: z.string().optional(),
})

// Schema para Checkout
const checkoutConfigSchema = z.object({
  mode: z.enum(['guest', 'phone_required']).default('phone_required'),
})

// Schema para Payments (MVP - simplificado)
const paymentsConfigSchema = z.object({
  pix: z.object({
    enabled: z.boolean(),
    key_type: z.enum(['cpf', 'cnpj', 'email', 'phone', 'random']).optional(),
    key: z.string().optional(),
    receiver_name: z.string().optional(),
  }).optional(),
  cash: z.boolean().optional(),
  card_on_delivery: z.boolean().optional(),
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
  
  // Payments (MVP)
  payments: paymentsConfigSchema,
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
    keyType: undefined,
    keyValue: '',
  },
  delivery: {
    enabled: false,
    fee: 5,
    minRadius: 5,
    avgTime: 30,
  },
  enableOrderNotifications: true,
  whatsapp: {
    enabled: false,
    phoneNumber: '',
    apiToken: '',
  },
  enableEmail: true,
  enableSoundAlerts: true,
  loyalty: {
    enabled: false,
    pointsPerReal: 1,
    minPointsToRedeem: 100,
    rewardValue: 10,
  },
  enableCoupons: true,
  enableScheduling: false,
  enableTableManagement: false,
  enableInventory: false,
  enableAutoPrint: false,
  enableKitchenPrint: true,
  ifood: {
    enabled: false,
    merchantId: '',
    apiKey: '',
  },
  rappi: {
    enabled: false,
    storeId: '',
    apiKey: '',
  },
  uberEats: {
    enabled: false,
    storeId: '',
    apiKey: '',
  },
  checkout: {
    mode: 'phone_required',
  },
  payments: {
    pix: {
      enabled: false,
      key: '',
      receiver_name: '',
      key_type: undefined,
    },
    cash: true,
    card_on_delivery: false,
  },
}
