# 📦 Backup Local do Projeto

Este documento descreve como fazer backup local do código do projeto e restaurá-lo quando necessário.

## 🎯 Objetivo

Criar backups locais do código-fonte do projeto em sua máquina Windows, permitindo:
- Versionamento local independente do Git
- Recuperação rápida em caso de problemas
- Arquivamento de estados específicos do projeto
- Backup antes de mudanças significativas

---

## 🚀 Como Fazer Backup

### Pré-requisitos

1. Node.js 18+ instalado
2. Dependências do projeto instaladas (`npm install`)

### Executar Backup

```bash
npm run backup:code
```

### O que acontece?

O script irá:
1. ✅ Criar uma pasta `backups/YYYY-MM-DD_HH-mm/` com timestamp
2. ✅ Compactar todo o código em `project.zip`
3. ✅ Excluir automaticamente:
   - `node_modules/`
   - `.next/`
   - `dist/`
   - `.turbo/`
   - `.vercel/`
   - `coverage/`
   - `backups/` (evita backup recursivo)
   - `.git/`
   - Arquivos de log
   - `.env.local` e variantes
4. ✅ Incluir:
   - `src/` (código-fonte)
   - `migrations/` (migrações do banco)
   - `public/` (assets públicos)
   - `package.json` e `package-lock.json`
   - `next.config.*`
   - `tailwind.config.*`
   - `tsconfig.json`
   - Documentação (`docs/`, `README.md`)
   - Configurações do projeto

---

## 📂 Estrutura de Backups

```
food-management-system/
├── backups/
│   ├── 2025-12-12_14-30/
│   │   └── project.zip (15.2 MB)
│   ├── 2025-12-11_09-15/
│   │   └── project.zip (14.8 MB)
│   └── 2025-12-10_16-45/
│       └── project.zip (14.5 MB)
```

**Localização:** `backups/` na raiz do projeto

**Nomenclatura:** `YYYY-MM-DD_HH-mm` (ano-mês-dia_hora-minuto)

---

## 🔄 Como Restaurar um Backup

### Opção 1: Restauração Completa (Nova Pasta)

```bash
# 1. Criar nova pasta para restauração
mkdir food-management-system-restored
cd food-management-system-restored

# 2. Descompactar o backup
# No Windows: Clique com botão direito no project.zip > Extrair Tudo
# Ou use PowerShell:
Expand-Archive -Path "C:\path\to\backups\2025-12-12_14-30\project.zip" -DestinationPath .

# 3. Instalar dependências
npm install

# 4. Configurar variáveis de ambiente
# Copie .env.example para .env.local e configure

# 5. Executar o projeto
npm run dev
```

### Opção 2: Restauração Seletiva (Arquivos Específicos)

```bash
# 1. Abrir o project.zip com WinRAR, 7-Zip ou Windows Explorer

# 2. Extrair apenas os arquivos necessários
# Exemplo: restaurar apenas src/components/

# 3. Substituir os arquivos na pasta atual
```

---

## ⚠️ Avisos Importantes

### ❌ O que NÃO está no backup:

- **`node_modules/`** - Reinstale com `npm install`
- **`.env.local`** - Reconfigure manualmente (contém secrets)
- **`.next/`** - Será recriado no `npm run dev` ou `npm run build`
- **Banco de dados** - Veja `scripts/backup_supabase.md` para backup do DB

### ✅ Boas Práticas:

1. **Faça backup antes de:**
   - Grandes refatorações
   - Atualizações de dependências principais
   - Mudanças na estrutura do projeto
   - Deploy para produção

2. **Mantenha backups organizados:**
   - Mantenha apenas os últimos 5-10 backups
   - Delete backups antigos manualmente quando necessário
   - Considere mover backups importantes para outra pasta

3. **Teste a restauração:**
   - Periodicamente, teste restaurar um backup
   - Verifique se todos os arquivos críticos estão incluídos

---

## 🛠️ Troubleshooting

### Erro: "Cannot find module 'archiver'"

```bash
# Instale as dependências
npm install
```

### Erro: "Permission denied"

```bash
# Execute o terminal como Administrador
# Ou verifique permissões da pasta backups/
```

### Backup muito grande (> 50 MB)

- Verifique se `node_modules/` está sendo excluído
- Verifique se `.next/` está sendo excluído
- Limpe arquivos de log grandes antes do backup

### Backup falhou no meio

- Verifique espaço em disco
- Feche arquivos abertos no projeto
- Tente novamente

---

## 📊 Tamanho Esperado do Backup

- **Projeto limpo:** ~10-20 MB
- **Com assets/imagens:** ~20-50 MB
- **Se > 50 MB:** Verifique exclusões

---

## 🔗 Recursos Relacionados

- **Backup do Banco de Dados:** Veja `scripts/backup_supabase.md`
- **Controle de Versão:** Use Git para versionamento diário
- **Deploy:** Backups automáticos no Vercel/Supabase

---

## 💡 Dicas

### Automatizar Backups Semanais (Opcional)

**Windows Task Scheduler:**
1. Abra "Agendador de Tarefas"
2. Criar Tarefa Básica
3. Nome: "Backup Food Management System"
4. Gatilho: Semanal (ex: Domingo 23:00)
5. Ação: Iniciar programa
   - Programa: `node`
   - Argumentos: `scripts/backup_project.mjs`
   - Iniciar em: `C:\path\to\food-management-system`

### Backup para Nuvem (Opcional)

Após criar o backup local, você pode:
- Copiar `backups/` para OneDrive/Google Drive
- Usar Dropbox para sincronização automática
- Fazer upload para um bucket S3/Azure

---

## 📝 Changelog

- **2025-12-12:** Criação do sistema de backup local
- Script compatível com Windows
- Exclusões otimizadas para Next.js

---

**✅ Backup configurado e pronto para uso!**

Execute `npm run backup:code` sempre que precisar criar um snapshot do projeto.
