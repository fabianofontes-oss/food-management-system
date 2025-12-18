/**
 * Testes unitários para validateCheckout
 * Garante que a validação do servidor não permite dados manipulados do client
 */

import { CheckoutErrorCodes, type CheckoutPayload } from '../validateCheckout'

// Mock do Supabase
const mockSupabase = {
  from: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  in: jest.fn().mockReturnThis(),
  single: jest.fn(),
}

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => Promise.resolve(mockSupabase)),
}))

// Dados de teste
const mockStore = {
  id: 'store-123',
  tenant_id: 'tenant-123',
  is_active: true,
  latitude: -23.5505,
  longitude: -46.6333,
  scheduling_enabled: false,
  scheduling_min_hours: 2,
  scheduling_max_days: 7,
  scheduling_interval: 30,
  settings: {
    businessHours: [
      { dayOfWeek: 0, isOpen: true, openTime: '08:00', closeTime: '22:00' },
      { dayOfWeek: 1, isOpen: true, openTime: '08:00', closeTime: '22:00' },
      { dayOfWeek: 2, isOpen: true, openTime: '08:00', closeTime: '22:00' },
      { dayOfWeek: 3, isOpen: true, openTime: '08:00', closeTime: '22:00' },
      { dayOfWeek: 4, isOpen: true, openTime: '08:00', closeTime: '22:00' },
      { dayOfWeek: 5, isOpen: true, openTime: '08:00', closeTime: '22:00' },
      { dayOfWeek: 6, isOpen: true, openTime: '08:00', closeTime: '22:00' },
    ],
    sales: {
      delivery: {
        enabled: true,
        fee: 5,
        radius: 10,
        minOrder: 20,
        freeAbove: 50,
      },
    },
  },
  tenants: { timezone: 'America/Sao_Paulo' },
}

const mockProducts = [
  {
    id: 'product-1',
    name: 'Açaí 300ml',
    base_price: 15.00,
    is_active: true,
    store_id: 'store-123',
    track_inventory: false,
    stock_quantity: null,
  },
  {
    id: 'product-2',
    name: 'Açaí 500ml',
    base_price: 25.00,
    is_active: true,
    store_id: 'store-123',
    track_inventory: true,
    stock_quantity: 10,
  },
]

const validPayload: CheckoutPayload = {
  storeId: 'store-123',
  channel: 'TAKEAWAY',
  items: [
    { product_id: 'product-1', quantity: 2 },
  ],
  customer: {
    name: 'Cliente Teste',
    phone: '11999999999',
  },
}

describe('validateCheckout', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Validação de Loja', () => {
    it('deve retornar STORE_NOT_FOUND se loja não existe', async () => {
      mockSupabase.single.mockResolvedValueOnce({ data: null, error: { code: 'PGRST116' } })

      const { validateCheckout } = await import('../validateCheckout')
      const result = await validateCheckout(validPayload)

      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.error.code).toBe(CheckoutErrorCodes.STORE_NOT_FOUND)
      }
    })
  })

  describe('Validação de Itens', () => {
    it('deve recalcular totais ignorando preços do client', async () => {
      mockSupabase.single.mockResolvedValueOnce({ data: mockStore, error: null })
      mockSupabase.in.mockImplementationOnce(() => ({
        then: (cb: any) => cb({ data: mockProducts, error: null }),
      }))

      const payloadWithFakePrice: CheckoutPayload = {
        ...validPayload,
        items: [
          { product_id: 'product-1', quantity: 2, unit_price: 1.00 }, // Preço fake
        ],
      }

      const { validateCheckout } = await import('../validateCheckout')
      const result = await validateCheckout(payloadWithFakePrice)

      if (result.ok) {
        // Deve usar o preço real (15.00), não o fake (1.00)
        expect(result.computedTotals.subtotal).toBe(30.00) // 15 * 2
      }
    })

    it('deve rejeitar produto de outra loja', async () => {
      const productsWithWrongStore = [
        { ...mockProducts[0], store_id: 'other-store' },
      ]
      
      mockSupabase.single.mockResolvedValueOnce({ data: mockStore, error: null })
      mockSupabase.in.mockImplementationOnce(() => ({
        then: (cb: any) => cb({ data: productsWithWrongStore, error: null }),
      }))

      const { validateCheckout } = await import('../validateCheckout')
      const result = await validateCheckout(validPayload)

      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.error.code).toBe(CheckoutErrorCodes.INVALID_ITEMS)
      }
    })

    it('deve rejeitar produto inativo', async () => {
      const inactiveProducts = [
        { ...mockProducts[0], is_active: false },
      ]
      
      mockSupabase.single.mockResolvedValueOnce({ data: mockStore, error: null })
      mockSupabase.in.mockImplementationOnce(() => ({
        then: (cb: any) => cb({ data: inactiveProducts, error: null }),
      }))

      const { validateCheckout } = await import('../validateCheckout')
      const result = await validateCheckout(validPayload)

      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.error.code).toBe(CheckoutErrorCodes.INVALID_ITEMS)
      }
    })

    it('deve rejeitar quantidade maior que estoque', async () => {
      const lowStockProduct = [
        { ...mockProducts[1], stock_quantity: 1 },
      ]
      
      mockSupabase.single.mockResolvedValueOnce({ data: mockStore, error: null })
      mockSupabase.in.mockImplementationOnce(() => ({
        then: (cb: any) => cb({ data: lowStockProduct, error: null }),
      }))

      const payloadWithHighQuantity: CheckoutPayload = {
        ...validPayload,
        items: [
          { product_id: 'product-2', quantity: 5 }, // Estoque: 1
        ],
      }

      const { validateCheckout } = await import('../validateCheckout')
      const result = await validateCheckout(payloadWithHighQuantity)

      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.error.code).toBe(CheckoutErrorCodes.INVALID_ITEMS)
      }
    })
  })

  describe('Validação de Delivery', () => {
    it('deve exigir endereço para DELIVERY', async () => {
      mockSupabase.single.mockResolvedValueOnce({ data: mockStore, error: null })

      const deliveryPayloadNoAddress: CheckoutPayload = {
        ...validPayload,
        channel: 'DELIVERY',
        address: undefined,
      }

      const { validateCheckout } = await import('../validateCheckout')
      const result = await validateCheckout(deliveryPayloadNoAddress)

      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.error.code).toBe(CheckoutErrorCodes.DELIVERY_ADDRESS_REQUIRED)
      }
    })

    it('deve rejeitar pedido abaixo do mínimo para delivery', async () => {
      mockSupabase.single.mockResolvedValueOnce({ data: mockStore, error: null })
      mockSupabase.in.mockImplementationOnce(() => ({
        then: (cb: any) => cb({ data: mockProducts, error: null }),
      }))

      const lowValueDelivery: CheckoutPayload = {
        ...validPayload,
        channel: 'DELIVERY',
        items: [
          { product_id: 'product-1', quantity: 1 }, // R$ 15, mínimo é R$ 20
        ],
        address: {
          street: 'Rua Teste',
          number: '123',
          district: 'Centro',
          city: 'São Paulo',
          state: 'SP',
          zip_code: '01000-000',
        },
      }

      const { validateCheckout } = await import('../validateCheckout')
      const result = await validateCheckout(lowValueDelivery)

      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.error.code).toBe(CheckoutErrorCodes.MIN_ORDER_NOT_MET)
      }
    })
  })

  describe('Códigos de Erro', () => {
    it('deve ter todos os códigos de erro documentados', () => {
      expect(CheckoutErrorCodes).toEqual({
        STORE_NOT_FOUND: 'STORE_NOT_FOUND',
        STORE_CLOSED: 'STORE_CLOSED',
        SCHEDULING_REQUIRED: 'SCHEDULING_REQUIRED',
        SCHEDULE_INVALID: 'SCHEDULE_INVALID',
        INVALID_ITEMS: 'INVALID_ITEMS',
        OUT_OF_DELIVERY_AREA: 'OUT_OF_DELIVERY_AREA',
        OUT_OF_STOCK: 'OUT_OF_STOCK',
        MIN_ORDER_NOT_MET: 'MIN_ORDER_NOT_MET',
        DELIVERY_ADDRESS_REQUIRED: 'DELIVERY_ADDRESS_REQUIRED',
      })
    })
  })
})
