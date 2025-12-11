# 🎛️ Sistema de Configurações

## 📋 Visão Geral

O sistema de configurações permite que cada loja personalize as funcionalidades disponíveis, formas de pagamento, notificações e parâmetros operacionais.

## 🗄️ Estrutura do Banco de Dados

A tabela `store_settings` armazena todas as configurações por loja:

```sql
- enable_pos, enable_kitchen, enable_delivery, etc. (BOOLEAN)
- minimum_order_value, delivery_fee, etc. (DECIMAL/INTEGER)
- Trigger automático cria configurações padrão ao criar nova loja
- RLS policies garantem isolamento multi-tenant
```

## 🔧 Como Usar nas Páginas

### 1. Importar o Hook

```typescript
import { useSettings } from '@/hooks/useSettings'
import { useSettingsHelper } from '@/lib/settingsHelper'
import { useStores } from '@/hooks/useStores'
```

### 2. Usar no Componente

```typescript
export default function MinhaPage() {
  const { stores } = useStores()
  const currentStore = stores[0]
  const { settings, loading, error } = useSettings(currentStore?.id)
  const helper = useSettingsHelper(settings)

  if (loading) return <LoadingSpinner />
  if (error) return <ErrorMessage />

  // Verificar se funcionalidade está habilitada
  if (!helper.isPOSEnabled) {
    return <div>PDV desabilitado nas configurações</div>
  }

  return (
    <div>
      {/* Seu conteúdo aqui */}
    </div>
  )
}
```

### 3. Exemplos de Uso

#### Ocultar Formas de Pagamento Desabilitadas

```typescript
<div className="payment-methods">
  {helper.isCashEnabled && (
    <button>Dinheiro</button>
  )}
  {helper.isCreditCardEnabled && (
    <button>Cartão de Crédito</button>
  )}
  {helper.isPixEnabled && (
    <button>PIX</button>
  )}
</div>
```

#### Validar Pedido Mínimo

```typescript
const handleCheckout = () => {
  if (!helper.isOrderValueValid(cartTotal)) {
    alert(`Pedido mínimo: R$ ${helper.minimumOrderValue}`)
    return
  }
  // Processar pedido
}
```

#### Calcular Taxa de Entrega

```typescript
const deliveryFee = helper.calculateDeliveryFee(distanceKm)
if (deliveryFee === -1) {
  alert(`Fora da área de entrega (máx ${helper.deliveryRadius}km)`)
  return
}
```

#### Mostrar Notificações Condicionalmente

```typescript
useEffect(() => {
  if (helper.areOrderNotificationsEnabled) {
    showNotification('Novo pedido!')
  }
  
  if (helper.areSoundAlertsEnabled) {
    playSound()
  }
  
  if (helper.areWhatsAppNotificationsEnabled) {
    sendWhatsApp()
  }
}, [newOrder])
```

#### Ocultar Links na Sidebar

```typescript
const menuItems = [
  { label: 'Dashboard', href: '/admin', show: true },
  { label: 'PDV', href: '/pos', show: helper.isPOSEnabled },
  { label: 'Cozinha', href: '/kitchen', show: helper.isKitchenEnabled },
  { label: 'Delivery', href: '/delivery', show: helper.isDeliveryEnabled },
].filter(item => item.show)
```

## 🎯 Configurações Disponíveis

### Funcionalidades Principais
- ✅ PDV (Point of Sale)
- ✅ Cozinha / KDS
- ✅ Delivery
- ✅ Consumo no Local
- ✅ Retirada

### Formas de Pagamento
- ✅ Dinheiro
- ✅ Cartão de Crédito
- ✅ Cartão de Débito
- ✅ PIX

### Notificações
- ✅ Notificações de Pedidos
- ✅ WhatsApp
- ✅ E-mail
- ✅ Alertas Sonoros

### Recursos Avançados
- ✅ Programa de Fidelidade
- ✅ Cupons de Desconto
- ✅ Agendamento de Pedidos
- ✅ Gestão de Mesas
- ✅ Controle de Estoque

### Impressão
- ✅ Impressão Automática
- ✅ Impressora da Cozinha

### Integrações
- ✅ iFood
- ✅ Rappi
- ✅ Uber Eats

### Operação
- 📊 Pedido Mínimo (R$)
- 📊 Taxa de Entrega (R$)
- 📊 Raio de Entrega (km)
- 📊 Tempo de Preparo (min)

## 🔄 Atualizar Configurações

```typescript
const { updateSettings } = useSettings(storeId)

// Atualizar uma configuração
await updateSettings({
  enable_delivery: false,
  delivery_fee: 8.00
})

// Restaurar padrões
await resetToDefaults()
```

## 🎨 UX Recomendada

1. **Feedback Visual**: Mostrar mensagem de sucesso ao salvar
2. **Validações**: Impedir desabilitar todas as formas de pagamento
3. **Tooltips**: Explicar cada configuração
4. **Confirmação**: Pedir confirmação para mudanças críticas
5. **Loading States**: Mostrar spinners durante carregamento
6. **Error Handling**: Mensagens claras de erro

## 🚀 Benefícios

- ✅ **Flexibilidade**: Cada loja configura o que precisa
- ✅ **Performance**: Não carrega funcionalidades desabilitadas
- ✅ **UX**: Interface limpa sem opções desnecessárias
- ✅ **Multi-tenant**: Isolamento completo entre lojas
- ✅ **Persistência**: Configurações salvas no Supabase
- ✅ **Type-safe**: TypeScript com tipos completos

## 📝 Próximos Passos

1. Aplicar lógica condicional em todas as páginas
2. Adicionar validações de negócio
3. Implementar audit log de mudanças
4. Criar testes automatizados
5. Documentar APIs de integração
