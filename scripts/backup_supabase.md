# 🗄️ Backup do Banco de Dados Supabase

Este documento descreve como fazer backup manual das tabelas críticas do Supabase.

## 🎯 Objetivo

Criar backups locais dos dados do banco de dados Supabase, permitindo:
- Recuperação de dados em caso de problemas
- Migração entre ambientes (dev/staging/prod)
- Auditoria e análise de dados históricos
- Backup antes de migrações ou mudanças estruturais

---

## 📋 Tabelas Críticas para Backup

### **Alta Prioridade** (Backup Semanal)
- `tenants` - Dados dos tenants
- `stores` - Configurações das lojas
- `users` - Usuários do sistema
- `customers` - Clientes
- `orders` - Pedidos
- `order_items` - Itens dos pedidos
- `products` - Produtos do cardápio
- `categories` - Categorias de produtos

### **Média Prioridade** (Backup Mensal)
- `deliveries` - Entregas
- `drivers` - Motoristas
- `customer_addresses` - Endereços de clientes
- `coupons` - Cupons de desconto
- `loyalty_points` - Pontos de fidelidade

### **Baixa Prioridade** (Backup Trimestral)
- `notifications` - Notificações (dados temporários)
- `audit_logs` - Logs de auditoria

---

## 🚀 Método 1: Export via Supabase Dashboard (Recomendado)

### Passo a Passo

1. **Acessar o Dashboard**
   - Acesse: https://supabase.com/dashboard
   - Login com suas credenciais
   - Selecione seu projeto

2. **Abrir SQL Editor**
   - Menu lateral: `SQL Editor`
   - Clique em `New query`

3. **Exportar Tabela Específica**

   ```sql
   -- Exemplo: Exportar tabela orders
   COPY (
     SELECT * FROM orders
     ORDER BY created_at DESC
   ) TO STDOUT WITH CSV HEADER;
   ```

4. **Executar e Baixar**
   - Execute a query
   - Clique em `Download CSV`
   - Salve em `backups/database/YYYY-MM-DD/orders.csv`

5. **Repetir para Cada Tabela Crítica**

---

## 🔧 Método 2: Export via pg_dump (Avançado)

### Pré-requisitos

- PostgreSQL Client instalado
- Credenciais de conexão do Supabase

### Obter Credenciais de Conexão

1. Dashboard Supabase > `Settings` > `Database`
2. Copie a `Connection string` (modo URI)
3. Formato: `postgresql://postgres:[PASSWORD]@[HOST]:[PORT]/postgres`

### Executar Backup Completo

```bash
# Windows (PowerShell)
$env:PGPASSWORD="sua_senha_aqui"
pg_dump -h db.xxxxx.supabase.co -U postgres -d postgres -F c -f backups/database/backup_completo.dump

# Backup de tabela específica
pg_dump -h db.xxxxx.supabase.co -U postgres -d postgres -t orders -F c -f backups/database/orders.dump
```

### Restaurar Backup

```bash
# Restaurar backup completo
pg_restore -h db.xxxxx.supabase.co -U postgres -d postgres -c backups/database/backup_completo.dump

# Restaurar tabela específica
pg_restore -h db.xxxxx.supabase.co -U postgres -d postgres -t orders backups/database/orders.dump
```

---

## 📊 Método 3: Export via Supabase API (Programático)

### Script Node.js para Export

```javascript
// scripts/export_table.mjs
import { createClient } from '@supabase/supabase-js'
import { writeFileSync } from 'fs'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // Use service role key
)

async function exportTable(tableName) {
  const { data, error } = await supabase
    .from(tableName)
    .select('*')
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error(`Erro ao exportar ${tableName}:`, error)
    return
  }
  
  const timestamp = new Date().toISOString().split('T')[0]
  const filename = `backups/database/${timestamp}/${tableName}.json`
  
  writeFileSync(filename, JSON.stringify(data, null, 2))
  console.log(`✅ ${tableName} exportado: ${data.length} registros`)
}

// Exportar tabelas críticas
const tables = ['orders', 'customers', 'products', 'stores']
for (const table of tables) {
  await exportTable(table)
}
```

**Executar:**
```bash
node scripts/export_table.mjs
```

---

## 📁 Estrutura de Backups do Banco

```
backups/
├── database/
│   ├── 2025-12-12/
│   │   ├── orders.csv (ou .json)
│   │   ├── customers.csv
│   │   ├── products.csv
│   │   └── stores.csv
│   ├── 2025-12-05/
│   │   └── ...
│   └── full_backup_2025-12-01.dump
```

---

## 🔄 Como Restaurar Dados

### Restaurar CSV via Dashboard

1. Supabase Dashboard > `Table Editor`
2. Selecione a tabela
3. Clique em `Insert` > `Import data from CSV`
4. Selecione o arquivo CSV
5. Mapeie as colunas
6. Clique em `Import`

### Restaurar JSON via Script

```javascript
// scripts/import_table.mjs
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function importTable(tableName, filename) {
  const data = JSON.parse(readFileSync(filename, 'utf-8'))
  
  const { error } = await supabase
    .from(tableName)
    .insert(data)
  
  if (error) {
    console.error(`Erro ao importar ${tableName}:`, error)
    return
  }
  
  console.log(`✅ ${tableName} importado: ${data.length} registros`)
}

await importTable('orders', 'backups/database/2025-12-12/orders.json')
```

---

## ⚠️ Avisos Importantes

### 🔒 Segurança

- **NUNCA** commite backups de banco no Git
- **NUNCA** compartilhe arquivos de backup publicamente
- Backups contêm dados sensíveis (CPF, telefones, emails)
- Adicione `backups/database/` no `.gitignore`

### 📝 Boas Práticas

1. **Frequência de Backup:**
   - Produção: Diário (automático via Supabase)
   - Manual: Antes de migrações ou mudanças críticas

2. **Retenção:**
   - Mantenha últimos 7 backups diários
   - Mantenha 1 backup mensal por 6 meses
   - Delete backups antigos manualmente

3. **Teste de Restauração:**
   - Teste restaurar em ambiente de desenvolvimento
   - Valide integridade dos dados
   - Documente problemas encontrados

---

## 🛡️ Backup Automático do Supabase

O Supabase já faz backups automáticos:

- **Plano Free:** Backups diários (7 dias de retenção)
- **Plano Pro:** Backups diários (30 dias de retenção)
- **Plano Enterprise:** Backups configuráveis

**Acessar Backups Automáticos:**
1. Dashboard > `Settings` > `Database`
2. Seção `Backups`
3. Clique em `Download` no backup desejado

---

## 🔗 Recursos Adicionais

- [Supabase Backup Docs](https://supabase.com/docs/guides/platform/backups)
- [PostgreSQL pg_dump](https://www.postgresql.org/docs/current/app-pgdump.html)
- [Supabase Management API](https://supabase.com/docs/reference/api)

---

## 💡 Dicas

### Backup Incremental

Para tabelas grandes, faça backup incremental:

```sql
-- Backup apenas registros dos últimos 7 dias
COPY (
  SELECT * FROM orders
  WHERE created_at >= NOW() - INTERVAL '7 days'
  ORDER BY created_at DESC
) TO STDOUT WITH CSV HEADER;
```

### Compressão

Comprima backups grandes:

```bash
# Windows (PowerShell)
Compress-Archive -Path backups/database/2025-12-12 -DestinationPath backups/database/2025-12-12.zip
```

### Verificação de Integridade

Após backup, verifique:
- Número de registros exportados
- Tamanho do arquivo
- Capacidade de abrir/ler o arquivo

---

## 📝 Checklist de Backup

- [ ] Identificar tabelas críticas
- [ ] Escolher método de backup (Dashboard/pg_dump/API)
- [ ] Executar backup
- [ ] Verificar integridade dos arquivos
- [ ] Armazenar em local seguro
- [ ] Documentar data e conteúdo do backup
- [ ] Testar restauração (opcional, mas recomendado)

---

**✅ Backup do banco de dados configurado!**

Lembre-se: O backup do código (`npm run backup:code`) e o backup do banco são complementares. Ambos são necessários para uma recuperação completa do sistema.
