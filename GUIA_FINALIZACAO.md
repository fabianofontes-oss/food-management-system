# 🚀 Guia de Finalização do Projeto

Este guia foi criado para ajudar você a colocar o sistema no ar (produção), passo a passo, sem precisar de conhecimentos avançados em programação.

## 📋 Pré-requisitos

1. Uma conta no **GitHub** (onde este código está).
2. Uma conta no **Supabase** (para o banco de dados).
3. Uma conta na **Vercel** (para colocar o site no ar).

---

## 1️⃣ Configurando o Banco de Dados (Supabase)

O sistema precisa de um banco de dados para funcionar. Vamos usar o Supabase.

1. Acesse [https://supabase.com](https://supabase.com) e crie um novo projeto.
2. Dê um nome (ex: `food-system`) e defina uma senha forte.
3. Aguarde o projeto ser criado (leva uns minutos).
4. No menu lateral, vá em **Project Settings** (ícone de engrenagem) > **API**.
5. Copie os valores de:
   - `Project URL`
   - `anon` / `public` key
   *(Guarde esses valores, vamos usar no passo 3)*

### Criando as Tabelas

Para facilitar, juntamos todos os comandos necessários em um único arquivo.

1. No painel do Supabase, vá em **SQL Editor** (ícone de folha de papel no menu lateral).
2. Clique em **+ New Query**.
3. Abra o arquivo `supabase/full_schema_dump.sql` que está neste projeto.
4. Copie **todo o conteúdo** desse arquivo.
5. Cole no editor do Supabase.
6. Clique em **Run** (botão verde).
   - *Se der algum erro de timeout, tente rodar em partes, mas geralmente funciona de uma vez.*

---

## 2️⃣ Implantando o Site (Vercel)

Vamos colocar o site no ar usando a Vercel.

1. Acesse [https://vercel.com](https://vercel.com) e faça login (pode usar o GitHub).
2. Clique em **Add New...** > **Project**.
3. Selecione o repositório deste projeto (`Import`).
4. Na tela de configuração:
   - **Framework Preset:** Next.js (já deve estar selecionado).
   - **Environment Variables:** Clique para expandir. Adicione as seguintes variáveis (usando os valores que você copiou do Supabase):
     - `NEXT_PUBLIC_SUPABASE_URL`: (Cole a Project URL)
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: (Cole a chave anon/public)
5. Clique em **Deploy**.

A Vercel vai construir o site. Se tudo der certo, você verá uma tela de "Congratulations!" e o link do seu site (ex: `food-management-system.vercel.app`).

---

## 3️⃣ Acessando o Sistema

Agora que o site está no ar e o banco configurado:

### Site Público (Landing Page)
Acesse o link gerado pela Vercel. Você verá a página inicial completa.

### Painel Administrativo (Super Admin)
Para acessar o painel de administração geral, você precisa ser um usuário "Super Admin".

1. Cadastre-se no site normalmente (`/signup`).
2. Vá no Supabase > **Table Editor** > tabela `users`.
3. Encontre seu usuário e verifique seu ID.
4. **Nota:** O sistema atual verifica se o email está na lista de super admins. Para "se promover", você pode precisar editar o código ou adicionar seu email na variável de ambiente `NEXT_PUBLIC_SUPER_ADMIN_EMAILS` na Vercel (Redeploy necessário).

### Criando uma Loja (Tenant)
A maneira mais fácil de começar é criar uma loja "na mão" ou via SQL para testar, se o painel admin ainda não estiver configurado.

Use este SQL no Supabase para criar sua primeira loja de teste:

```sql
-- Criar um Tenant
INSERT INTO tenants (id, name) VALUES ('e2e00000-0000-0000-0000-000000000001', 'Minha Rede');

-- Criar uma Loja
INSERT INTO stores (id, tenant_id, name, slug, niche, mode)
VALUES (
  'e2e00000-0000-0000-0000-000000000010',
  'e2e00000-0000-0000-0000-000000000001',
  'Açaí da Esquina',
  'acai-esquina',
  'acai',
  'store'
);
```

Depois, acesse `seu-site.vercel.app/acai-esquina` para ver o cardápio!

---

## 🛠️ Solução de Problemas Comuns

- **Erro "Application Error":** Geralmente é falta das variáveis de ambiente na Vercel. Verifique se `NEXT_PUBLIC_SUPABASE_URL` e `KEY` estão certas.
- **Página de Demonstração:** A página `/acai-sabor-real` funciona mesmo sem banco de dados (modo demonstração). Use-a para testar se o site subiu corretamente.

---

**Parabéns!** Seu sistema está pronto para uso inicial.
