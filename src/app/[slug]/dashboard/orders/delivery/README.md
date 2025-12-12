# Módulo Delivery - Estrutura Modular

## 📁 Estrutura de Pastas

```
delivery/
├── components/          # Componentes React reutilizáveis
│   ├── DeliveryHeader.tsx
│   └── DeliveryStats.tsx
├── hooks/              # Hooks customizados
│   └── useDeliveryStats.ts
├── types/              # Interfaces e tipos TypeScript
│   └── index.ts
├── utils/              # Funções utilitárias
│   └── deliveryHelpers.ts
├── page.tsx            # Página principal (a ser refatorada)
└── README.md           # Documentação

```

## 🎯 Componentes

### DeliveryHeader
Header da página com título e controles (som, etc)

**Props:**
- `soundEnabled: boolean` - Estado do som
- `onToggleSound: () => void` - Callback para alternar som

### DeliveryStats
Cards de estatísticas de entregas

**Props:**
- `pendingCount: number` - Pedidos aguardando
- `inTransitCount: number` - Pedidos em rota
- `deliveredToday: number` - Entregas hoje
- `avgDeliveryTime: number` - Tempo médio de entrega

## 🪝 Hooks

### useDeliveryStats
Hook para calcular estatísticas de entregas em tempo real

**Parâmetros:**
- `deliveryOrders: any[]` - Array de pedidos de delivery

**Retorna:**
- `DeliveryStats` - Objeto com estatísticas calculadas

## 🛠️ Utils

### deliveryHelpers.ts
Funções utilitárias para operações de delivery:

- `getElapsedTime(dateString: string): string` - Calcula tempo decorrido
- `getTimerColor(minutes: number): string` - Retorna cor baseada no tempo
- `getProgressPercentage(dateString: string, maxMinutes?: number): number` - Calcula progresso
- `copyAddress(address: string): void` - Copia endereço para clipboard
- `openInMaps(address: string): void` - Abre endereço no Google Maps
- `printDeliveryLabel(order, orderItems, deliveryNotes): void` - Imprime etiqueta

## 📝 Types

### DeliveryOrder
Interface para pedidos de delivery

### DeliveryStats
Interface para estatísticas de delivery

### DeliveryState
Interface para estado do componente

## 🚀 Próximos Passos

1. Refatorar `page.tsx` para usar os componentes modulares
2. Criar componentes adicionais:
   - `DeliveryCard` - Card individual de pedido
   - `DeliveryColumn` - Coluna de status (Aguardando, Em Rota, etc)
   - `NoteModal` - Modal de notas de entrega
3. Extrair mais lógica para hooks customizados
4. Adicionar testes unitários

## 💡 Benefícios da Estrutura Modular

- ✅ **Reutilização**: Componentes podem ser usados em outras páginas
- ✅ **Manutenção**: Código organizado e fácil de encontrar
- ✅ **Testabilidade**: Componentes e funções isoladas são mais fáceis de testar
- ✅ **Escalabilidade**: Fácil adicionar novas funcionalidades
- ✅ **Legibilidade**: Código mais limpo e compreensível
