import { CreditCard, Smartphone, DollarSign } from 'lucide-react'
import type { UseFormSetValue, FieldErrors } from 'react-hook-form'

interface PaymentsSectionProps {
  paymentsData: {
    pix?: {
      enabled: boolean
      key_type?: string
      key?: string
      receiver_name?: string
    }
    cash?: boolean
    card_on_delivery?: boolean
  }
  errors: FieldErrors<any>
  setValue: UseFormSetValue<any>
}

export function PaymentsSection({ paymentsData, errors, setValue }: PaymentsSectionProps) {
  const paymentsErrors = (errors as any)?.payments

  return (
    <section className="bg-white rounded-2xl p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-6">
        <CreditCard className="w-6 h-6 text-green-600" />
        <h2 className="text-2xl font-bold text-gray-900">Métodos de Pagamento</h2>
      </div>
      <p className="text-sm text-gray-600 mb-4">
        Configure quais formas de pagamento sua loja aceita. Apenas os métodos habilitados aparecerão no checkout.
      </p>
      <div className="space-y-6">
        {/* PIX Manual */}
        <div className="border-2 border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <Smartphone className="w-5 h-5 text-teal-600" />
              <div>
                <h3 className="font-bold text-gray-900">PIX (Manual)</h3>
                <p className="text-sm text-gray-600">Pagamento via QR Code ou copia e cola</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={paymentsData?.pix?.enabled || false}
                onChange={(e) => setValue('payments.pix.enabled', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
            </label>
          </div>

          {paymentsData?.pix?.enabled && (
            <div className="space-y-3 mt-4 pt-4 border-t border-gray-200">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Chave PIX *
                </label>
                <select
                  value={paymentsData?.pix?.key_type || ''}
                  onChange={(e) => setValue('payments.pix.key_type', e.target.value as any)}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-teal-500 focus:outline-none"
                >
                  <option value="">Selecione o tipo</option>
                  <option value="cpf">CPF</option>
                  <option value="cnpj">CNPJ</option>
                  <option value="email">E-mail</option>
                  <option value="phone">Telefone</option>
                  <option value="random">Chave Aleatória</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Chave PIX *
                </label>
                <input
                  type="text"
                  value={paymentsData?.pix?.key || ''}
                  onChange={(e) => setValue('payments.pix.key', e.target.value)}
                  placeholder="Digite sua chave PIX"
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-teal-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome do Recebedor *
                </label>
                <input
                  type="text"
                  value={paymentsData?.pix?.receiver_name || ''}
                  onChange={(e) => setValue('payments.pix.receiver_name', e.target.value)}
                  placeholder="Nome que aparecerá no PIX"
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-teal-500 focus:outline-none"
                />
              </div>
              {paymentsErrors?.pix && (
                <p className="text-red-600 text-sm">{paymentsErrors.pix?.message}</p>
              )}
            </div>
          )}
        </div>

        {/* Dinheiro */}
        <div className="border-2 border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <DollarSign className="w-5 h-5 text-green-600" />
              <div>
                <h3 className="font-bold text-gray-900">Dinheiro</h3>
                <p className="text-sm text-gray-600">Pagamento em espécie na entrega/retirada</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={paymentsData?.cash || false}
                onChange={(e) => setValue('payments.cash', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
            </label>
          </div>
        </div>

        {/* Cartão na Entrega */}
        <div className="border-2 border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CreditCard className="w-5 h-5 text-blue-600" />
              <div>
                <h3 className="font-bold text-gray-900">Cartão na Entrega</h3>
                <p className="text-sm text-gray-600">Pagamento com cartão no momento da entrega/retirada</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={paymentsData?.card_on_delivery || false}
                onChange={(e) => setValue('payments.card_on_delivery', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-800">
            <strong>⚠️ Importante:</strong> Apenas os métodos habilitados aparecerão no checkout público. Configure pelo menos um método de pagamento.
          </p>
        </div>
      </div>
    </section>
  )
}
