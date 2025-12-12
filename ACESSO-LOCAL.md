# 🖥️ Como Acessar o Sistema Localmente

## ✅ Servidor Rodando!

O servidor de desenvolvimento está **ATIVO** em:

```
http://localhost:3000
```

---

## 🌐 URLs de Acesso Local

### **Dashboard Principal**
```
http://localhost:3000/[slug-da-loja]/dashboard
```

### **Produtos (onde você quer chegar)**
```
http://localhost:3000/[slug-da-loja]/dashboard/products
```

### **PDV (Ponto de Venda)**
```
http://localhost:3000/[slug-da-loja]/dashboard/pos
```

### **Pedidos**
```
http://localhost:3000/[slug-da-loja]/dashboard/orders
```

### **CRM**
```
http://localhost:3000/[slug-da-loja]/dashboard/crm
```

### **Cozinha**
```
http://localhost:3000/[slug-da-loja]/dashboard/kitchen
```

### **Configurações**
```
http://localhost:3000/[slug-da-loja]/dashboard/settings
```

---

## 🏪 Descobrir o Slug da Sua Loja

Execute no **Supabase SQL Editor**:

```sql
SELECT slug, name FROM stores;
```

**Exemplo de resultado:**
```
slug              | name
------------------|------------------
acai-da-praia     | Açaí da Praia
burger-house      | Burger House
tropical-freeze   | Tropical Freeze
```

Então você acessaria:
```
http://localhost:3000/acai-da-praia/dashboard/products
http://localhost:3000/burger-house/dashboard/products
http://localhost:3000/tropical-freeze/dashboard/products
```

---

## 🚀 Comandos Úteis

### **Iniciar o servidor** (já está rodando)
```bash
npm run dev
```

### **Parar o servidor**
Pressione `Ctrl + C` no terminal

### **Reiniciar o servidor**
```bash
# Parar (Ctrl + C)
# Depois:
npm run dev
```

### **Limpar cache e reiniciar**
```bash
npm run build
npm run dev
```

---

## 🔍 Verificar se Está Funcionando

### 1. **Abrir no navegador**
```
http://localhost:3000
```

Você deve ver a página inicial do sistema.

### 2. **Testar uma loja específica**
```
http://localhost:3000/acai-da-praia
```

Deve carregar o cardápio público da loja.

### 3. **Acessar o dashboard**
```
http://localhost:3000/acai-da-praia/dashboard
```

Deve mostrar o dashboard administrativo.

---

## ⚠️ Problemas Comuns

### **Erro: "Loja não encontrada"**

**Causa:** O slug não existe no banco de dados.

**Solução:**
1. Verifique os slugs disponíveis no Supabase:
```sql
SELECT slug, name, is_active FROM stores;
```

2. Use um slug que existe e está ativo (`is_active = true`)

### **Erro: "Cannot connect to Supabase"**

**Causa:** Variáveis de ambiente não configuradas.

**Solução:**
1. Verifique se existe o arquivo `.env.local` na raiz do projeto
2. Deve conter:
```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-aqui
```

3. Se não existe, crie o arquivo com suas credenciais do Supabase

### **Erro: "Port 3000 already in use"**

**Causa:** Outra aplicação está usando a porta 3000.

**Solução:**
```bash
# Parar o processo na porta 3000
npx kill-port 3000

# Ou usar outra porta
npm run dev -- -p 3001
```

Então acesse: `http://localhost:3001`

### **Página em branco ou erro 404**

**Causa:** Rota não existe ou slug incorreto.

**Solução:**
1. Verifique se digitou o slug corretamente
2. Verifique se a loja está ativa no banco
3. Limpe o cache do navegador (Ctrl + Shift + R)

---

## 📱 Testar Responsividade

### **Modo Mobile no Chrome**
1. Abra o DevTools (F12)
2. Clique no ícone de dispositivo móvel (Ctrl + Shift + M)
3. Escolha um dispositivo (iPhone, iPad, etc)

### **Testar em Dispositivo Real**
1. Descubra seu IP local:
```bash
ipconfig
```

2. Procure por "IPv4 Address" (ex: 192.168.1.100)

3. No celular, acesse:
```
http://192.168.1.100:3000/acai-da-praia/dashboard
```

⚠️ **Importante:** Celular e computador devem estar na mesma rede Wi-Fi.

---

## 🎯 Fluxo Completo de Teste

### **1. Verificar se o servidor está rodando**
```bash
# Deve mostrar "Ready in XXXXms"
```

### **2. Abrir o navegador**
```
http://localhost:3000
```

### **3. Descobrir o slug da loja**
- Vá no Supabase SQL Editor
- Execute: `SELECT slug FROM stores LIMIT 1;`
- Copie o slug

### **4. Acessar o dashboard**
```
http://localhost:3000/[slug-copiado]/dashboard
```

### **5. Navegar para produtos**
- Clique em "Produtos" no menu lateral
- Ou acesse direto: `http://localhost:3000/[slug]/dashboard/products`

---

## 🔧 Aplicar a Migration 004

**IMPORTANTE:** Antes de testar categorias, você precisa aplicar a migration no Supabase:

1. Acesse: https://supabase.com/dashboard
2. Vá em **SQL Editor**
3. Copie o conteúdo de `migrations/004_fix_categories_conflict.sql`
4. Cole e execute no SQL Editor
5. Aguarde a confirmação de sucesso

Depois disso, as categorias vão aparecer no dashboard de produtos!

---

## 📊 Monitorar Logs em Tempo Real

No terminal onde o servidor está rodando, você verá:
- ✅ Requisições HTTP
- ⚠️ Avisos (warnings)
- ❌ Erros
- 🔄 Hot reload (quando você edita arquivos)

---

## 🎉 Pronto para Desenvolver!

Agora você pode:
- ✅ Testar o sistema localmente
- ✅ Ver mudanças em tempo real (hot reload)
- ✅ Debugar com DevTools
- ✅ Testar em diferentes dispositivos
- ✅ Desenvolver novas features

---

**Servidor ativo em:** http://localhost:3000  
**Status:** ✅ RODANDO
