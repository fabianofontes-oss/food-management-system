# 🧪 Guia de Testes - Food Management System

## ✅ Checklist de Testes

### 1. **Acesso ao Sistema**
- [ ] Acessar: `http://localhost:3001/acai-sabor-real/dashboard`
- [ ] Verificar se o dashboard principal carrega
- [ ] Verificar se o sidebar aparece

### 2. **Navegação do Sidebar**
Testar cada item do menu:
- [ ] **Painel** - Dashboard principal
- [ ] **Produtos** - Página de produtos com estatísticas
- [ ] **Pedidos** - Página de pedidos com filtros
- [ ] **CRM** - Página de clientes
- [ ] **PDV** - Sistema de vendas
- [ ] **Cozinha** - KDS (Kitchen Display System)
- [ ] **Delivery** - Gestão de entregas
- [ ] **Configurações** - Settings

### 3. **Página de Produtos**
- [ ] Estatísticas aparecem (Total, Ativos, Preço Médio)
- [ ] Busca funciona
- [ ] Filtros expandem/colapsam
- [ ] Filtro por Status funciona
- [ ] Filtro por Preço funciona
- [ ] Botões Grid/List funcionam
- [ ] Botão "Novo Produto" abre modal
- [ ] Criar produto funciona
- [ ] Editar produto funciona
- [ ] Deletar produto pede confirmação

### 4. **Página de Pedidos**
- [ ] Estatísticas aparecem (Receita, Pedidos Hoje, Ticket Médio)
- [ ] Busca funciona
- [ ] Filtros funcionam (Status, Tipo, Período)
- [ ] Ver detalhes abre modal
- [ ] Imprimir pedido funciona
- [ ] Exportar CSV funciona

### 5. **Página de PDV**
- [ ] Estatísticas aparecem
- [ ] Adicionar produto ao carrinho funciona
- [ ] Calcular desconto funciona
- [ ] Calcular troco funciona
- [ ] Finalizar venda funciona
- [ ] Imprimir cupom funciona
- [ ] Sangria/Suprimento funciona
- [ ] Fechamento de caixa funciona
- [ ] Cancelamento com senha funciona

### 6. **Página de Cozinha**
- [ ] Pedidos aparecem em colunas
- [ ] Filtro por canal funciona
- [ ] Mover pedido entre colunas funciona
- [ ] Timer de pedidos funciona
- [ ] Atribuir chef funciona

### 7. **Página de Delivery**
- [ ] Pedidos aparecem em colunas
- [ ] Tempo de entrega real aparece
- [ ] Atribuir entregador funciona
- [ ] Adicionar notas funciona
- [ ] Imprimir etiqueta funciona
- [ ] Copiar endereço funciona
- [ ] Abrir no Maps funciona

## 🐛 Problemas Conhecidos

### Sidebar não navega
**Sintomas:** Clicar nos itens do menu não muda de página

**Soluções:**
1. Limpar cache do navegador (Ctrl + Shift + R)
2. Verificar se está na porta correta (3001)
3. Verificar console do navegador (F12) para erros
4. Reiniciar servidor: `npm run dev`

### Páginas em branco
**Sintomas:** Página carrega mas fica branca

**Soluções:**
1. Verificar console (F12) para erros JavaScript
2. Limpar cache do Next.js: `Remove-Item -Recurse -Force .next`
3. Reiniciar servidor

### Loading infinito
**Sintomas:** Página fica em "Carregando..." indefinidamente

**Soluções:**
1. Verificar conexão com Supabase
2. Verificar console para erros de API
3. Verificar se há dados no banco

## 📝 Notas

- **Porta do servidor:** 3001 (mudou de 3000)
- **URL base:** `http://localhost:3001/acai-sabor-real/dashboard`
- **Supabase:** Deve estar configurado em `.env.local`

## 🚀 Comandos Úteis

```bash
# Reiniciar servidor
npm run dev

# Limpar cache
Remove-Item -Recurse -Force .next

# Ver portas em uso
netstat -ano | findstr :3001

# Matar processo na porta
taskkill /PID <PID> /F
```

## ✅ Status Atual

**Sistema:** 65+ funcionalidades implementadas
**Páginas:** 8 páginas completas
**Status:** Pronto para testes finais
