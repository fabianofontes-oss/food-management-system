'use client'

import { useState, useEffect } from 'react'
import { Search, Filter, Calendar, Package, Eye, Printer, Download, TrendingUp, Clock, DollarSign, ShoppingBag, Loader2, X, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils'
import { useOrders } from '@/hooks/useOrders'
import { useLanguage } from '@/lib/LanguageContext'
import { supabase } from '@/lib/supabase'

type OrderItem = {
  id: string
  product_id: string
  quantity: number
  unit_price: number
  products: {
    name: string
  }
}

export default function OrdersPage() {
  const { t, formatCurrency: formatCurrencyI18n } = useLanguage()
  const { orders, loading } = useOrders()
  const [orderItems, setOrderItems] = useState<Record<string, OrderItem[]>>({})
  
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [dateFilter, setDateFilter] = useState<string>('all')
  const [paymentFilter, setPaymentFilter] = useState<string>('all')
  const [showFilters, setShowFilters] = useState(false)
  
  const [selectedOrder, setSelectedOrder] = useState<any>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  
  const [totalRevenue, setTotalRevenue] = useState(0)
  const [todayOrders, setTodayOrders] = useState(0)
  const [avgOrderValue, setAvgOrderValue] = useState(0)

  useEffect(() => {
    async function loadOrderItems() {
      const orderIds = orders.map(o => o.id)
      if (orderIds.length === 0) return

      const { data } = await supabase
        .from('order_items')
        .select('id, order_id, product_id, quantity, unit_price, products(name)')
        .in('order_id', orderIds)

      if (data) {
        const itemsByOrder: Record<string, OrderItem[]> = {}
        data.forEach((item: any) => {
          const orderId = item.order_id
          if (!itemsByOrder[orderId]) itemsByOrder[orderId] = []
          itemsByOrder[orderId].push(item)
        })
        setOrderItems(itemsByOrder)
      }
    }
    loadOrderItems()
  }, [orders])

  useEffect(() => {
    const today = new Date().toDateString()
    const todayOrdersList = orders.filter(o => new Date(o.created_at).toDateString() === today)
    
    setTotalRevenue(orders.reduce((sum, o) => sum + o.total_amount, 0))
    setTodayOrders(todayOrdersList.length)
    setAvgOrderValue(orders.length > 0 ? orders.reduce((sum, o) => sum + o.total_amount, 0) / orders.length : 0)
  }, [orders])

  // Calcular pagamentos pendentes (últimas 48h)
  const pendingPaymentsCount = orders.filter(order => {
    const orderDate = new Date(order.created_at)
    const now = new Date()
    const hoursDiff = (now.getTime() - orderDate.getTime()) / (1000 * 60 * 60)
    return (order.payment_status === 'pending' || !order.payment_status) && hoursDiff <= 48
  }).length

  const filteredOrders = orders.filter(order => {
    const matchSearch = searchTerm === '' || 
      order.order_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.customer_phone && order.customer_phone.includes(searchTerm))

    const matchStatus = statusFilter === 'all' || order.status === statusFilter
    const matchType = typeFilter === 'all' || order.order_type === typeFilter
    
    const matchPayment = paymentFilter === 'all' || 
      (paymentFilter === 'pending' && (order.payment_status === 'pending' || !order.payment_status)) ||
      (paymentFilter === 'paid' && order.payment_status === 'paid')

    let matchDate = true
    if (dateFilter !== 'all') {
      const orderDate = new Date(order.created_at)
      const today = new Date()
      
      if (dateFilter === 'today') {
        matchDate = orderDate.toDateString() === today.toDateString()
      } else if (dateFilter === 'week') {
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
        matchDate = orderDate >= weekAgo
      } else if (dateFilter === 'month') {
        const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
        matchDate = orderDate >= monthAgo
      }
    }

    return matchSearch && matchStatus && matchType && matchPayment && matchDate
  })

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'delivered': 'bg-green-100 text-green-700',
      'preparing': 'bg-yellow-100 text-yellow-700',
      'pending': 'bg-red-100 text-red-700',
      'confirmed': 'bg-blue-100 text-blue-700',
      'ready': 'bg-purple-100 text-purple-700',
      'out_for_delivery': 'bg-indigo-100 text-indigo-700',
      'cancelled': 'bg-gray-100 text-gray-700',
    }
    return colors[status] || 'bg-gray-100 text-gray-700'
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      'delivered': 'Entregue',
      'preparing': 'Em Preparo',
      'pending': 'Pendente',
      'confirmed': 'Confirmado',
      'ready': 'Pronto',
      'out_for_delivery': 'Saiu para Entrega',
      'cancelled': 'Cancelado',
    }
    return labels[status] || status
  }

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'delivery': 'Delivery',
      'dine_in': 'Mesa',
      'takeout': 'Viagem',
    }
    return labels[type] || type
  }

  const getPaymentMethodLabel = (method: string) => {
    const labels: Record<string, string> = {
      'pix': 'PIX',
      'cash': 'Dinheiro',
      'card': 'Cartão',
      'card_on_delivery': 'Cartão na Entrega',
      'online': 'Online'
    }
    return labels[method] || method
  }

  const getPaymentStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      'pending': 'Pendente',
      'paid': 'Pago',
      'cancelled': 'Cancelado'
    }
    return labels[status] || status
  }

  const getPaymentStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'paid': 'bg-green-100 text-green-800',
      'cancelled': 'bg-red-100 text-red-800'
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const markAsPaid = async (orderId: string) => {
    if (!confirm('Confirmar pagamento recebido?')) return

    try {
      const { error } = await supabase
        .from('orders')
        .update({ payment_status: 'paid' })
        .eq('id', orderId)

      if (error) throw error

      alert('Pagamento confirmado com sucesso!')
      
      // Atualizar estado local
      if (selectedOrder?.id === orderId) {
        setSelectedOrder({ ...selectedOrder, payment_status: 'paid' })
      }
      
      // Recarregar pedidos
      window.location.reload()
    } catch (err) {
      console.error('Erro ao confirmar pagamento:', err)
      alert('Erro ao confirmar pagamento')
    }
  }

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      'delivery': 'bg-purple-100 text-purple-700',
      'dine_in': 'bg-green-100 text-green-700',
      'takeout': 'bg-blue-100 text-blue-700',
    }
    return colors[type] || 'bg-gray-100 text-gray-700'
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('pt-BR', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const printOrder = (order: any) => {
    const printWindow = window.open('', '', 'width=300,height=600')
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Pedido #${order.order_code}</title>
            <style>
              body { font-family: monospace; font-size: 12px; margin: 10px; }
              h2 { text-align: center; margin: 5px 0; }
              .section { margin: 10px 0; }
              hr { border: 1px dashed #000; }
            </style>
          </head>
          <body>
            <h2>PEDIDO #${order.order_code}</h2>
            <hr>
            <div class="section">
              <strong>Data:</strong> ${formatDate(order.created_at)}<br>
              <strong>Cliente:</strong> ${order.customer_name}<br>
              <strong>Telefone:</strong> ${order.customer_phone || 'N/A'}<br>
              <strong>Tipo:</strong> ${getTypeLabel(order.order_type)}<br>
              <strong>Status:</strong> ${getStatusLabel(order.status)}
            </div>
            <hr>
            <strong>ITENS:</strong><br>
            ${orderItems[order.id]?.map(item => `
              ${item.quantity}x ${item.products?.name || 'Produto'} - ${formatCurrencyI18n(item.unit_price)}<br>
            `).join('') || 'Carregando itens...'}
            <hr>
            <div class="section">
              <strong>Subtotal:</strong> ${formatCurrencyI18n(order.subtotal || order.total_amount)}<br>
              ${order.discount > 0 ? `<strong>Desconto:</strong> -${formatCurrencyI18n(order.discount)}<br>` : ''}
              ${order.delivery_fee > 0 ? `<strong>Taxa Entrega:</strong> ${formatCurrencyI18n(order.delivery_fee)}<br>` : ''}
              <strong>TOTAL:</strong> ${formatCurrencyI18n(order.total_amount)}
            </div>
            <hr>
            ${order.notes ? `<strong>OBS:</strong> ${order.notes}<hr>` : ''}
            <p style="text-align: center; margin-top: 20px;">*** OBRIGADO ***</p>
          </body>
        </html>
      `)
      printWindow.document.close()
      printWindow.print()
    }
  }

  const exportToCSV = () => {
    const headers = ['Código', 'Data', 'Cliente', 'Tipo', 'Status', 'Total']
    const rows = filteredOrders.map(order => [
      order.order_code,
      formatDate(order.created_at),
      order.customer_name,
      getTypeLabel(order.order_type),
      getStatusLabel(order.status),
      order.total_amount.toString()
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `pedidos_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 flex items-center justify-center">
        <div className="text-center bg-white/80 backdrop-blur-sm p-8 rounded-3xl shadow-xl shadow-slate-200/50">
          <Loader2 className="w-14 h-14 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-600 text-lg font-medium">Carregando pedidos...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-800 flex items-center gap-3">
                <div className="p-2.5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg shadow-blue-500/25">
                  <ShoppingBag className="w-6 h-6 md:w-7 md:h-7 text-white" />
                </div>
                Pedidos
              </h1>
              <p className="text-slate-500 mt-2 ml-14">Gestão completa de pedidos</p>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={exportToCSV}
                className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-lg shadow-emerald-500/25"
              >
                <Download className="w-4 h-4 mr-2" />
                Exportar
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
            <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-5 text-white shadow-xl shadow-emerald-500/20 hover:shadow-2xl hover:shadow-emerald-500/30 transition-all duration-300 hover:-translate-y-0.5">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <DollarSign className="w-5 h-5" />
                </div>
                <span className="text-sm font-medium text-white/90">Receita Total</span>
              </div>
              <div className="text-3xl font-bold tracking-tight">{formatCurrencyI18n(totalRevenue)}</div>
            </div>
            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-5 text-white shadow-xl shadow-blue-500/20 hover:shadow-2xl hover:shadow-blue-500/30 transition-all duration-300 hover:-translate-y-0.5">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <Package className="w-5 h-5" />
                </div>
                <span className="text-sm font-medium text-white/90">Pedidos Hoje</span>
              </div>
              <div className="text-3xl font-bold tracking-tight">{todayOrders}</div>
            </div>
            <div className="bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl p-5 text-white shadow-xl shadow-violet-500/20 hover:shadow-2xl hover:shadow-violet-500/30 transition-all duration-300 hover:-translate-y-0.5">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <span className="text-sm font-medium text-white/90">Ticket Médio</span>
              </div>
              <div className="text-3xl font-bold tracking-tight">{formatCurrencyI18n(avgOrderValue)}</div>
            </div>
          </div>
        </div>

        {/* Alerta de Pagamentos Pendentes */}
        {pendingPaymentsCount > 0 && (
          <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-2xl p-5 mb-6 shadow-lg shadow-amber-100/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 rounded-xl">
                  <DollarSign className="w-5 h-5 text-amber-600" />
                </div>
                <span className="font-bold text-amber-800">
                  Pagamentos Pendentes: {pendingPaymentsCount}
                </span>
              </div>
              <Button
                onClick={() => setPaymentFilter(paymentFilter === 'pending' ? 'all' : 'pending')}
                className={paymentFilter === 'pending' ? 'bg-amber-700 hover:bg-amber-800 shadow-lg shadow-amber-500/25' : 'bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 shadow-lg shadow-amber-500/25'}
              >
                {paymentFilter === 'pending' ? 'Mostrar Todos' : 'Mostrar Pendentes'}
              </Button>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100 p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar por código, cliente ou telefone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:outline-none transition-all"
              />
            </div>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-6 py-3.5 bg-slate-100 hover:bg-slate-200 rounded-xl font-medium transition-all flex items-center gap-2 hover:shadow-md"
            >
              <Filter className="w-5 h-5 text-slate-600" />
              Filtros
              <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-4 border-t">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">Todos</option>
                  <option value="pending">Pendente</option>
                  <option value="confirmed">Confirmado</option>
                  <option value="preparing">Em Preparo</option>
                  <option value="ready">Pronto</option>
                  <option value="out_for_delivery">Saiu para Entrega</option>
                  <option value="delivered">Entregue</option>
                  <option value="cancelled">Cancelado</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tipo</label>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">Todos</option>
                  <option value="delivery">Delivery</option>
                  <option value="dine_in">Mesa</option>
                  <option value="takeout">Viagem</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Período</label>
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">Todos</option>
                  <option value="today">Hoje</option>
                  <option value="week">Última Semana</option>
                  <option value="month">Último Mês</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Pagamento</label>
                <select
                  value={paymentFilter}
                  onChange={(e) => setPaymentFilter(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">Todos</option>
                  <option value="pending">Pendente</option>
                  <option value="paid">Pago</option>
                </select>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100 p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-bold text-slate-800">
              {filteredOrders.length} {filteredOrders.length === 1 ? 'Pedido' : 'Pedidos'}
            </h2>
          </div>

          {filteredOrders.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 mx-auto mb-4 bg-slate-100 rounded-2xl flex items-center justify-center">
                <Package className="w-10 h-10 text-slate-300" />
              </div>
              <p className="text-slate-400 font-medium text-lg">Nenhum pedido encontrado</p>
              <p className="text-slate-400 text-sm mt-1">Ajuste os filtros ou aguarde novos pedidos</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between p-5 bg-gradient-to-r from-slate-50 to-slate-100/50 rounded-xl border border-slate-200/50 hover:shadow-md hover:border-slate-200 transition-all"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-bold text-lg">#{order.order_code}</span>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(order.status)}`}>
                        {getStatusLabel(order.status)}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getTypeColor(order.order_type)}`}>
                        {getTypeLabel(order.order_type)}
                      </span>
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                        {getPaymentMethodLabel(order.payment_method || 'cash')}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getPaymentStatusColor(order.payment_status || 'pending')}`}>
                        {getPaymentStatusLabel(order.payment_status || 'pending')}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 mb-1">
                      <strong>{order.customer_name}</strong>
                      {order.customer_phone && ` • ${order.customer_phone}`}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDate(order.created_at)}
                      </span>
                      {orderItems[order.id] && (
                        <span>{orderItems[order.id].length} {orderItems[order.id].length === 1 ? 'item' : 'itens'}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right mr-4">
                      <div className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                        {formatCurrencyI18n(order.total_amount)}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setSelectedOrder(order)
                          setShowDetailsModal(true)
                        }}
                        className="p-2.5 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-xl transition-all hover:shadow-md"
                        title="Ver Detalhes"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => printOrder(order)}
                        className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-all hover:shadow-md"
                        title="Imprimir"
                      >
                        <Printer className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showDetailsModal && selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowDetailsModal(false)}>
          <div className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900">Detalhes do Pedido</h3>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-500">Código</div>
                    <div className="font-bold text-lg">#{selectedOrder.order_code}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Data</div>
                    <div className="font-medium">{formatDate(selectedOrder.created_at)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Status</div>
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(selectedOrder.status)}`}>
                      {getStatusLabel(selectedOrder.status)}
                    </span>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Tipo</div>
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getTypeColor(selectedOrder.order_type)}`}>
                      {getTypeLabel(selectedOrder.order_type)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <h4 className="font-bold text-blue-900 mb-3">Pagamento</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-blue-700">Método</div>
                    <div className="font-medium text-blue-900">{getPaymentMethodLabel(selectedOrder.payment_method || 'cash')}</div>
                  </div>
                  <div>
                    <div className="text-sm text-blue-700">Status</div>
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getPaymentStatusColor(selectedOrder.payment_status || 'pending')}`}>
                      {getPaymentStatusLabel(selectedOrder.payment_status || 'pending')}
                    </span>
                  </div>
                </div>
                {selectedOrder.payment_method === 'pix' && (selectedOrder.payment_status === 'pending' || !selectedOrder.payment_status) && (
                  <div className="mt-3 text-sm text-blue-700">
                    💡 PIX manual: confirme após receber o pagamento
                  </div>
                )}
                {(selectedOrder.payment_status === 'pending' || !selectedOrder.payment_status) && (
                  <div className="mt-4">
                    <Button
                      onClick={() => markAsPaid(selectedOrder.id)}
                      className="w-full bg-green-600 hover:bg-green-700"
                    >
                      ✓ Marcar como Pago
                    </Button>
                  </div>
                )}
              </div>

              <div className="bg-gray-50 rounded-xl p-4">
                <h4 className="font-bold text-gray-900 mb-2">Cliente</h4>
                <div className="space-y-1">
                  <div><strong>Nome:</strong> {selectedOrder.customer_name}</div>
                  {selectedOrder.customer_phone && <div><strong>Telefone:</strong> {selectedOrder.customer_phone}</div>}
                  {selectedOrder.customer_email && <div><strong>Email:</strong> {selectedOrder.customer_email}</div>}
                  {selectedOrder.delivery_address && <div><strong>Endereço:</strong> {selectedOrder.delivery_address}</div>}
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-4">
                <h4 className="font-bold text-gray-900 mb-3">Itens do Pedido</h4>
                <div className="space-y-2">
                  {orderItems[selectedOrder.id]?.map((item) => (
                    <div key={item.id} className="flex justify-between items-center py-2 border-b border-gray-200 last:border-0">
                      <div>
                        <div className="font-medium">{item.quantity}x {item.products?.name || 'Produto'}</div>
                        <div className="text-sm text-gray-500">{formatCurrencyI18n(item.unit_price)} cada</div>
                      </div>
                      <div className="font-bold">{formatCurrencyI18n(item.unit_price * item.quantity)}</div>
                    </div>
                  )) || <div className="text-gray-500">Carregando itens...</div>}
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span className="font-medium">{formatCurrencyI18n(selectedOrder.subtotal || selectedOrder.total_amount)}</span>
                  </div>
                  {selectedOrder.discount > 0 && (
                    <div className="flex justify-between text-yellow-600">
                      <span>Desconto</span>
                      <span className="font-medium">-{formatCurrencyI18n(selectedOrder.discount)}</span>
                    </div>
                  )}
                  {selectedOrder.delivery_fee > 0 && (
                    <div className="flex justify-between">
                      <span>Taxa de Entrega</span>
                      <span className="font-medium">{formatCurrencyI18n(selectedOrder.delivery_fee)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-xl font-bold pt-2 border-t-2 border-gray-300">
                    <span>TOTAL</span>
                    <span className="text-green-600">{formatCurrencyI18n(selectedOrder.total_amount)}</span>
                  </div>
                </div>
              </div>

              {selectedOrder.notes && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                  <h4 className="font-bold text-yellow-900 mb-2">Observações</h4>
                  <p className="text-yellow-800">{selectedOrder.notes}</p>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <Button
                  onClick={() => printOrder(selectedOrder)}
                  className="flex-1 bg-gray-600 hover:bg-gray-700"
                >
                  <Printer className="w-4 h-4 mr-2" />
                  Imprimir
                </Button>
                <Button
                  onClick={() => setShowDetailsModal(false)}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  Fechar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
