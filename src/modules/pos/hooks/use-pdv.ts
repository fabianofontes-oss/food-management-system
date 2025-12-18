'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { CartItem, PaymentMethod, DiscountType, PDVStats, CashRegisterSession } from '../types'

interface UsePDVProps {
  storeId: string | null
}

export function usePDV({ storeId }: UsePDVProps) {
  // Estados do carrinho
  const [cart, setCart] = useState<CartItem[]>([])
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash')
  const [cashReceived, setCashReceived] = useState<number>(0)
  const [processing, setProcessing] = useState(false)
  const [success, setSuccess] = useState(false)
  const [lastOrderId, setLastOrderId] = useState<string | null>(null)

  // Estados de cliente/mesa
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [tableNumber, setTableNumber] = useState('')

  // Estados de desconto/taxa
  const [discountType, setDiscountType] = useState<DiscountType>('percent')
  const [discountValue, setDiscountValue] = useState(0)
  const [serviceFee, setServiceFee] = useState(false)
  const [tipPercent, setTipPercent] = useState(0)

  // Atendente e caixa
  const [attendant, setAttendant] = useState('')
  const [cashSession, setCashSession] = useState<CashRegisterSession | null>(null)

  // Estatísticas
  const [stats, setStats] = useState<PDVStats>({ todaySales: 0, todayOrders: 0, ticketMedio: 0 })

  // Carregar estatísticas do dia
  const loadStats = useCallback(async () => {
    if (!storeId) return
    const today = new Date().toISOString().split('T')[0]
    const { data } = await supabase
      .from('orders')
      .select('total_amount')
      .eq('store_id', storeId)
      .gte('created_at', `${today}T00:00:00`)
    
    if (data && data.length > 0) {
      const total = data.reduce((sum, o) => sum + Number(o.total_amount || 0), 0)
      setStats({
        todaySales: total,
        todayOrders: data.length,
        ticketMedio: total / data.length
      })
    }
  }, [storeId])

  useEffect(() => {
    loadStats()
  }, [loadStats, success])

  // Cálculos do carrinho
  const subtotal = useMemo(() => 
    cart.reduce((sum, item) => {
      const addonsTotal = item.addons?.reduce((a, addon) => a + addon.price, 0) || 0
      return sum + ((item.price + addonsTotal) * item.quantity)
    }, 0), [cart])

  const discountAmount = useMemo(() => 
    discountType === 'percent' ? (subtotal * discountValue / 100) : discountValue, 
    [subtotal, discountType, discountValue])

  const serviceFeeAmount = useMemo(() => 
    serviceFee ? subtotal * 0.10 : 0, [subtotal, serviceFee])

  const tipAmount = useMemo(() => 
    subtotal * (tipPercent / 100), [subtotal, tipPercent])

  const total = useMemo(() => 
    Math.max(0, subtotal - discountAmount + serviceFeeAmount + tipAmount), 
    [subtotal, discountAmount, serviceFeeAmount, tipAmount])

  const change = useMemo(() => 
    paymentMethod === 'cash' ? Math.max(0, cashReceived - total) : 0, 
    [paymentMethod, cashReceived, total])

  const itemCount = useMemo(() => 
    cart.reduce((sum, i) => sum + i.quantity, 0), [cart])

  // Funções do carrinho
  const addToCart = useCallback((product: any, addons?: CartItem['addons']) => {
    const existing = cart.find(item => item.id === product.id && !item.obs && !item.addons?.length)
    if (existing && !addons?.length) {
      setCart(cart.map(item => 
        item.id === product.id && !item.obs && !item.addons?.length
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ))
    } else {
      setCart([...cart, {
        id: product.id,
        name: product.name,
        price: product.base_price,
        quantity: 1,
        addons
      }])
    }
  }, [cart])

  const updateQuantity = useCallback((id: string, delta: number, obs?: string) => {
    setCart(prev => prev.map(item => {
      if (item.id === id && item.obs === obs) {
        const newQty = item.quantity + delta
        return newQty > 0 ? { ...item, quantity: newQty } : item
      }
      return item
    }).filter(item => item.quantity > 0))
  }, [])

  const removeItem = useCallback((id: string, obs?: string) => {
    setCart(prev => prev.filter(item => !(item.id === id && item.obs === obs)))
  }, [])

  const addObsToItem = useCallback((id: string, obs: string) => {
    const item = cart.find(i => i.id === id && !i.obs)
    if (item && obs.trim()) {
      setCart([...cart.filter(i => !(i.id === id && !i.obs)), { ...item, obs }])
    }
  }, [cart])

  const clearCart = useCallback(() => {
    setCart([])
    setCashReceived(0)
    setDiscountValue(0)
    setServiceFee(false)
    setTipPercent(0)
    setCustomerName('')
    setCustomerPhone('')
    setTableNumber('')
  }, [])

  // Finalizar venda
  const checkout = useCallback(async () => {
    if (cart.length === 0 || !storeId) return null

    setProcessing(true)
    try {
      const orderCode = tableNumber ? `MESA-${tableNumber}` : `PDV-${Date.now()}`
      
      const notes = [
        attendant && `Atendente: ${attendant}`,
        tableNumber && `Mesa: ${tableNumber}`,
        discountAmount > 0 && `Desconto: R$${discountAmount.toFixed(2)}`,
        serviceFee && `Taxa serviço: R$${serviceFeeAmount.toFixed(2)}`,
        tipPercent > 0 && `Gorjeta ${tipPercent}%: R$${tipAmount.toFixed(2)}`,
      ].filter(Boolean).join(' | ')

      const { data: order, error } = await supabase
        .from('orders')
        .insert({
          store_id: storeId,
          order_code: orderCode,
          customer_name: customerName || 'Cliente PDV',
          customer_phone: customerPhone || '',
          order_type: tableNumber ? 'dine_in' : 'counter',
          payment_method: paymentMethod === 'card' ? 'credit_card' : paymentMethod,
          subtotal,
          discount: discountAmount,
          total_amount: total,
          status: 'confirmed',
          notes: notes || 'Venda via PDV'
        })
        .select('id')
        .single()

      if (error) throw error

      for (const item of cart) {
        await supabase.from('order_items').insert({
          order_id: order.id,
          product_id: item.id,
          quantity: item.quantity,
          unit_price: item.price,
          total_price: item.price * item.quantity,
          notes: item.obs || null
        })
      }

      setLastOrderId(order.id)
      setSuccess(true)
      
      setTimeout(() => {
        setSuccess(false)
        clearCart()
      }, 2000)

      return order.id

    } catch (error) {
      console.error('Erro ao criar pedido:', error)
      throw error
    } finally {
      setProcessing(false)
    }
  }, [cart, storeId, tableNumber, attendant, discountAmount, serviceFee, serviceFeeAmount, tipPercent, tipAmount, customerName, customerPhone, paymentMethod, subtotal, total, clearCart])

  return {
    // Carrinho
    cart,
    addToCart,
    updateQuantity,
    removeItem,
    addObsToItem,
    clearCart,
    itemCount,
    
    // Valores
    subtotal,
    discountAmount,
    serviceFeeAmount,
    tipAmount,
    total,
    change,
    
    // Pagamento
    paymentMethod,
    setPaymentMethod,
    cashReceived,
    setCashReceived,
    
    // Desconto/Taxa
    discountType,
    setDiscountType,
    discountValue,
    setDiscountValue,
    serviceFee,
    setServiceFee,
    tipPercent,
    setTipPercent,
    
    // Cliente
    customerName,
    setCustomerName,
    customerPhone,
    setCustomerPhone,
    tableNumber,
    setTableNumber,
    
    // Atendente/Caixa
    attendant,
    setAttendant,
    cashSession,
    setCashSession,
    
    // Status
    processing,
    success,
    lastOrderId,
    stats,
    
    // Ações
    checkout,
    loadStats
  }
}
