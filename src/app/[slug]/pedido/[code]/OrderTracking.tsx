import { formatCurrency } from '@/lib/utils'

interface OrderTrackingProps {
    order: {
        code: string
        status: string
        total_amount: number
        customer_name?: string
        customer_phone_partial?: string
        delivery_location?: string
        items?: Array<{
            title: string
            quantity: number
            subtotal: number
        }>
        events?: Array<{
            type: string
            message: string
            created_at: string
        }>
    }
}

export function OrderTracking({ order }: OrderTrackingProps) {
    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="container mx-auto max-w-2xl px-4">
                <div className="bg-white rounded-lg shadow p-6">
                    <h1 className="text-2xl font-bold mb-4">Pedido #{order.code}</h1>

                    <div className="mb-6">
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600">Status:</span>
                            <span className="font-semibold text-lg">{order.status}</span>
                        </div>
                        <div className="flex justify-between items-center mt-2">
                            <span className="text-gray-600">Total:</span>
                            <span className="font-bold text-xl">{formatCurrency(order.total_amount)}</span>
                        </div>
                    </div>

                    {order.customer_name && (
                        <div className="mb-6 p-4 bg-gray-50 rounded">
                            <h2 className="font-semibold mb-2">Informações</h2>
                            <p className="text-sm text-gray-600">Cliente: {order.customer_name}</p>
                            {order.customer_phone_partial && (
                                <p className="text-sm text-gray-600">Telefone: {order.customer_phone_partial}</p>
                            )}
                            {order.delivery_location && (
                                <p className="text-sm text-gray-600">Local: {order.delivery_location}</p>
                            )}
                        </div>
                    )}

                    {order.items && order.items.length > 0 && (
                        <div className="mb-6">
                            <h2 className="font-semibold mb-3">Itens do Pedido</h2>
                            <div className="space-y-2">
                                {order.items.map((item, idx) => (
                                    <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                                        <div>
                                            <div className="font-medium">{item.title}</div>
                                            <div className="text-sm text-gray-600">Qtd: {item.quantity}</div>
                                        </div>
                                        <div className="font-semibold">{formatCurrency(item.subtotal)}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {order.events && order.events.length > 0 && (
                        <div>
                            <h2 className="font-semibold mb-3">Histórico</h2>
                            <div className="space-y-2">
                                {order.events.map((event, idx) => (
                                    <div key={idx} className="text-sm border-l-2 border-blue-500 pl-3 py-1">
                                        <div className="font-medium">{event.message}</div>
                                        <div className="text-gray-500 text-xs">
                                            {new Date(event.created_at).toLocaleString('pt-BR')}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
