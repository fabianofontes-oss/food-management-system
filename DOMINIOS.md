# 🌐 Configuração de Domínios - Pediu Food

**Última atualização:** 21/12/2024

---

## 📊 Estrutura de Domínios

### Domínios Principais

| Domínio | Propósito | Roteamento | Status |
|---------|-----------|------------|--------|
| `pediufood.com` | Landing/Marketing/Blog | Passthrough | ✅ Configurado |
| `pediu.food` | App principal (redirect) | → `pediufood.com` | ✅ Configurado |
| `entregou.food` | Landing motoristas | → `/para-motoristas` | ✅ Configurado |
| `pensou.food` | Marketplace (redirect) | → `pediufood.com/marketplace` | ✅ Configurado |

### Subdomínios Especiais

| Subdomínio | Propósito | Roteamento | Status |
|------------|-----------|------------|--------|
| `admin.pediu.food` | Super Admin | Rewrite → `/admin` | ✅ Configurado |
| `app.pediu.food` | Dashboard multi-loja | Passthrough | ✅ Configurado |
| `driver.entregou.food` | Dashboard motoristas | Rewrite → `/driver/dashboard` | ✅ Configurado |

### Wildcards (Subdomínios Dinâmicos)

| Pattern | Propósito | Exemplo | Roteamento |
|---------|-----------|---------|------------|
| `*.pediu.food` | Cardápio white-label | `pizzaria.pediu.food` | Rewrite → `/s/pizzaria` |
| `*.entregou.food` | Perfil público motorista | `joao.entregou.food` | Rewrite → `/motorista-publico/joao` |

---

## 🔧 Configuração DNS (Cloudflare/Route53)

### Para cada domínio raiz:

```dns
# pediufood.com
A     @     76.76.21.21
CNAME www   cname.vercel-dns.com

# pediu.food
A     @     76.76.21.21
CNAME www   cname.vercel-dns.com
CNAME *     cname.vercel-dns.com    # Wildcard para *.pediu.food

# entregou.food
A     @     76.76.21.21
CNAME www   cname.vercel-dns.com
CNAME *     cname.vercel-dns.com    # Wildcard para *.entregou.food

# pensou.food
A     @     76.76.21.21
CNAME www   cname.vercel-dns.com
```

### Subdomínios específicos:

```dns
# Em pediu.food
CNAME admin   cname.vercel-dns.com
CNAME app     cname.vercel-dns.com

# Em entregou.food
CNAME driver  cname.vercel-dns.com
```

---

## ⚙️ Configuração Vercel

### 1. Adicionar Domínios no Dashboard

Vá em **Settings → Domains** e adicione:

```
✓ pediufood.com
✓ www.pediufood.com
✓ pediufood.com.br (redirect → pediufood.com)
✓ www.pediufood.com.br (redirect → pediufood.com)

✓ pediu.food
✓ www.pediu.food
✓ *.pediu.food (wildcard)
✓ admin.pediu.food
✓ app.pediu.food

✓ entregou.food
✓ www.entregou.food
✓ *.entregou.food (wildcard)
✓ driver.entregou.food

✓ pensou.food (redirect → pediufood.com/marketplace)
✓ www.pensou.food (redirect → pediufood.com/marketplace)
```

### 2. Configurar Redirects no Vercel

Em **Settings → Redirects**, adicione:

```json
[
  {
    "source": "https://pediufood.com.br/:path*",
    "destination": "https://pediufood.com/:path*",
    "permanent": true
  },
  {
    "source": "https://www.pediufood.com.br/:path*",
    "destination": "https://pediufood.com/:path*",
    "permanent": true
  },
  {
    "source": "https://pensou.food/:path*",
    "destination": "https://pediufood.com/marketplace",
    "permanent": true
  },
  {
    "source": "https://www.pensou.food/:path*",
    "destination": "https://pediufood.com/marketplace",
    "permanent": true
  }
]
```

### 3. Variáveis de Ambiente

Certifique-se de que estas variáveis estão configuradas:

```env
NEXT_PUBLIC_APP_URL=https://pediufood.com
NEXT_PUBLIC_API_URL=https://pediufood.com/api
```

---

## 🗺️ Mapa de Roteamento

### pediufood.com (Marketing)

```
https://pediufood.com/
├── /                      → Landing principal
├── /marketplace           → Marketplace de restaurantes
├── /para-motoristas       → Landing motoristas
├── /para-garcons          → Landing garçons
├── /criar-loja            → Onboarding
├── /blog                  → Blog (futuro)
└── /[slug]                → Cardápio público (URL alternativa)
```

### pediu.food (App Principal)

```
https://pediu.food/
├── /login                 → Autenticação
├── /signup                → Cadastro
├── /admin                 → Super admin (via admin.pediu.food)
├── /select-store          → Seleção de loja
└── /[slug]/dashboard      → Dashboard da loja
```

### *.pediu.food (White-label)

```
https://pizzaria.pediu.food/
├── /                      → Cardápio (rewrite → /s/pizzaria)
├── /cart                  → Carrinho
├── /checkout              → Finalizar pedido
└── /order/[id]            → Confirmação
```

### entregou.food (Motoristas)

```
https://entregou.food/
├── /                      → Landing motoristas (rewrite → /para-motoristas)
├── /cadastro-motorista    → Cadastro
└── /login                 → Login

https://driver.entregou.food/
└── /                      → Dashboard (rewrite → /driver/dashboard)

https://joao.entregou.food/
└── /                      → Perfil público (rewrite → /motorista-publico/joao)
```

---

## 🔒 Segurança

### Headers (via vercel.json)

```json
{
  "headers": [
    {
      "source": "/:path*",
      "headers": [
        {"key": "X-Frame-Options", "value": "DENY"},
        {"key": "X-Content-Type-Options", "value": "nosniff"},
        {"key": "X-XSS-Protection", "value": "1; mode=block"},
        {"key": "Referrer-Policy", "value": "strict-origin-when-cross-origin"}
      ]
    }
  ]
}
```

### Proteção de Rotas

- ✅ Middleware valida autenticação
- ✅ RLS no Supabase
- ✅ API routes protegidas
- ✅ CORS configurado

---

## 🧪 Testes Locais

### Simular domínios no localhost:

Edite `/etc/hosts` (Mac/Linux) ou `C:\Windows\System32\drivers\etc\hosts` (Windows):

```
127.0.0.1 pediufood.com
127.0.0.1 pediu.food
127.0.0.1 pizzaria.pediu.food
127.0.0.1 entregou.food
127.0.0.1 joao.entregou.food
127.0.0.1 admin.pediu.food
127.0.0.1 app.pediu.food
```

Depois acesse:
- `http://pediufood.com:3000` → Landing
- `http://pizzaria.pediu.food:3000` → Cardápio white-label
- `http://entregou.food:3000` → Landing motoristas

---

## 📝 Checklist de Deploy

### Antes do Deploy:

- [x] Middleware configurado
- [x] vercel.json criado
- [x] Rotas placeholder criadas
- [x] Build passando
- [ ] DNS configurado
- [ ] Domínios adicionados no Vercel
- [ ] SSL/HTTPS ativo
- [ ] Redirects configurados
- [ ] Variáveis de ambiente setadas

### Após Deploy:

- [ ] Testar cada domínio
- [ ] Testar wildcards
- [ ] Testar redirects
- [ ] Verificar SSL
- [ ] Monitorar logs

---

## 🚀 Ordem de Implementação

### Fase 1 - Infraestrutura (✅ Concluída)
- [x] Middleware multi-domínio
- [x] vercel.json
- [x] Estrutura de pastas
- [x] Placeholders

### Fase 2 - Landing Pages (🚧 Em andamento)
- [ ] Landing motoristas (Stitch/V0)
- [ ] Landing garçons (Stitch/V0)
- [ ] Cadastro motorista (Stitch/V0)
- [ ] Demo garçom (Stitch/V0)

### Fase 3 - DNS e Deploy (⏳ Aguardando)
- [ ] Configurar DNS
- [ ] Adicionar domínios no Vercel
- [ ] Deploy e testes

### Fase 4 - Conteúdo (⏳ Futuro)
- [ ] Blog
- [ ] Marketplace real (integrar com DB)
- [ ] SEO e meta tags

---

## 📞 Suporte

**Dúvidas sobre DNS?**
- Cloudflare: https://dash.cloudflare.com
- Vercel Docs: https://vercel.com/docs/concepts/projects/domains

**Problemas com wildcard?**
- Certifique-se de que o CNAME `*` está configurado
- Aguarde propagação DNS (até 48h)
- Teste com `dig *.pediu.food` ou `nslookup`

---

**Gerado por:** Cascade AI  
**Última atualização:** 21/12/2024
