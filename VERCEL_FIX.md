# 🔧 Fix para Deploy na Vercel

## Problema

O build na Vercel está falhando porque o `tailwindcss-animate` não está instalado como dependência.

## Solução

### Opção 1: Instalar a dependência faltante (Recomendado)

Execute no seu terminal local:

```bash
npm install --save-dev tailwindcss-animate
```

Depois faça commit e push:

```bash
git add package.json package-lock.json
git commit -m "Add tailwindcss-animate dependency"
git push
```

### Opção 2: Remover o plugin do Tailwind

Se você não precisa das animações, pode remover o plugin do `tailwind.config.ts`:

**Antes:**
```typescript
plugins: [require("tailwindcss-animate")],
```

**Depois:**
```typescript
plugins: [],
```

E também remover as animações do tema:

**Remover estas linhas do `tailwind.config.ts`:**
```typescript
keyframes: {
  "accordion-down": {
    from: { height: "0" },
    to: { height: "var(--radix-accordion-content-height)" },
  },
  "accordion-up": {
    from: { height: "var(--radix-accordion-content-height)" },
    to: { height: "0" },
  },
},
animation: {
  "accordion-down": "accordion-down 0.2s ease-out",
  "accordion-up": "accordion-up 0.2s ease-out",
},
```

## Verificação Local

Antes de fazer deploy, teste o build localmente:

```bash
npm run build
```

Se o build passar sem erros, o deploy na Vercel deve funcionar.

## Variáveis de Ambiente na Vercel

Não esqueça de configurar as variáveis de ambiente no painel da Vercel:

1. Acesse seu projeto na Vercel
2. Vá em **Settings** → **Environment Variables**
3. Adicione:
   - `NEXT_PUBLIC_SUPABASE_URL` = sua URL do Supabase
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = sua chave anônima do Supabase

## Troubleshooting Adicional

### Se o erro persistir:

1. **Limpe o cache da Vercel:**
   - No painel da Vercel, vá em Deployments
   - Clique nos 3 pontos do último deploy
   - Selecione "Redeploy"
   - Marque "Clear Build Cache"

2. **Verifique a versão do Node:**
   - A Vercel usa Node 18 por padrão
   - Nosso `package.json` já especifica `"node": ">=18.0.0"`

3. **Verifique se todos os arquivos estão commitados:**
   ```bash
   git status
   ```

## Arquivos Atualizados

O `package.json` foi atualizado para incluir:

```json
"devDependencies": {
  "tailwindcss-animate": "^1.0.7",
  ...
}
```

## Próximos Passos

Após o deploy bem-sucedido:

1. Configure o domínio personalizado (se necessário)
2. Teste o fluxo completo em produção
3. Configure o Supabase para aceitar requisições do domínio da Vercel
4. Habilite Row Level Security (RLS) no Supabase para produção
