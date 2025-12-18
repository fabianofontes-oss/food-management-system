# PROJECT INTAKE

## System
18/12/2025 15:36:12
PWD: C:\Users\User\CascadeProjects\food-management-system

## Node
v24.12.0
11.6.2

## Git
main
## main...origin/main
?? _intake/

f6b41d2 (HEAD -> main, origin/main) feat: redesenha painel de Sa+¦de do C+¦digo com controle granular
810fec6 fix: ajusta painel de auditoria para funcionar em produ+º+úo
cd6b5ee feat: adiciona painel de auditoria de c+¦digo e scripts de limpeza
f40f9ea feat: remover PDVs duplicados e criar novo layout moderno do PDV
da1bdec feat: adicionar correcao automatica de problemas no sistema de saude
d817d8a feat: integrar diagnostico automatico na pagina principal de saude
b73ab16 fix: corrigir nomes de tabelas e logica do diagnostico de saude
ff0479e feat: criar sistema de diagnostico automatico no Super Admin
17a2f28 fix: remover PDV duplicado e consolidar configuracoes em settings/pdv
93a2728 feat: libera todos os modulos no modo demo para menu completo
f3259c7 fix: adiciona modo demo no layout do dashboard para acesso sem login
d771bf5 fix: corrige link do botao Ver demonstracao no Hero para /demo/dashboard
5b51a20 fix: libera acesso automatico ao slug demo sem depender do banco
9205075 feat: adiciona secao Loja Demo destacada na pagina de Saude do Sistema
a46edb9 feat: adiciona URLs demo na lista de paginas publicas em saude do sistema

## package.json (first 220 lines)
{
  "name": "food-management-system",
  "version": "1.0.0",
  "description": "Sistema multi-loja e multi-nicho para gestÃ£o completa de pedidos de negÃ³cios de alimentaÃ§Ã£o",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "type-check": "tsc --noEmit",
    "backup:code": "node scripts/backup_project.mjs",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:headed": "playwright test --headed"
  },
  "dependencies": {
    "@hookform/resolvers": "^5.2.2",
    "@radix-ui/react-collapsible": "^1.1.12",
    "@radix-ui/react-dialog": "^1.1.15",
    "@radix-ui/react-label": "^2.1.8",
    "@radix-ui/react-scroll-area": "^1.2.10",
    "@radix-ui/react-select": "^2.2.6",
    "@radix-ui/react-slot": "^1.2.4",
    "@radix-ui/react-switch": "^1.2.6",
    "@supabase/ssr": "^0.5.2",
    "@supabase/supabase-js": "^2.45.4",
    "@tanstack/react-query": "^5.59.16",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.1",
    "date-fns": "^4.1.0",
    "date-fns-tz": "^3.2.0",
    "dotenv": "^17.2.3",
    "lucide-react": "^0.454.0",
    "next": "14.2.18",
    "qrcode.react": "^4.2.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-hook-form": "^7.68.0",
    "recharts": "^3.5.1",
    "sonner": "^2.0.7",
    "tailwind-merge": "^2.5.4",
    "zod": "^3.25.76",
    "zustand": "^4.5.5"
  },
  "devDependencies": {
    "@playwright/test": "^1.57.0",
    "@types/node": "^22.9.0",
    "@types/react": "^18.3.12",
    "@types/react-dom": "^18.3.1",
    "archiver": "^7.0.1",
    "autoprefixer": "^10.4.20",
    "eslint": "^8.57.1",
    "eslint-config-next": "14.2.18",
    "postcss": "^8.4.47",
    "tailwindcss": "^3.4.14",
    "tailwindcss-animate": "^1.0.7",
    "typescript": "^5.6.3"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}

## Top-level


    Diretório: C:\Users\User\CascadeProjects\food-management-system


Mode                 LastWriteTime         Length Name                                                                                                
----                 -------------         ------ ----                                                                                                
d-----        17/12/2025     11:52                .github                                                                                             
d-----        18/12/2025     14:55                .next                                                                                               
d-----        17/12/2025     23:37                docs                                                                                                
d-----        12/12/2025     15:59                migrations                                                                                          
d-----        17/12/2025     11:43                node_modules                                                                                        
d-----        18/12/2025     14:47                public                                                                                              
d-----        18/12/2025     15:30                scripts                                                                                             
d-----        15/12/2025     15:30                src                                                                                                 
d-----        18/12/2025     02:26                supabase                                                                                            
d-----        18/12/2025     02:08                test-results                                                                                        
d-----        17/12/2025     11:46                tests                                                                                               
d-----        18/12/2025     14:03                _BACKUP_LIXO                                                                                        
d-----        18/12/2025     14:42                _BACKUP_ZUMBIS                                                                                      
d-----        18/12/2025     15:36                _intake                                                                                             
-a----        13/12/2025     23:12            468 .env.local                                                                                          
-a----        17/12/2025     14:19            274 .eslintrc.json                                                                                      
-a----        11/12/2025     00:12            363 .gitignore                                                                                          
-a----        11/12/2025     15:36            122 .gitignore_temp                                                                                     
-a----        12/12/2025     10:56           5465 ACESSO-LOCAL.md                                                                                     
-a----        18/12/2025     13:47          15813 ARQUITETURA_ATUAL.md                                                                                
-a----        12/12/2025     10:50           9568 AUDITORIA-CATEGORIAS.md                                                                             
-a----        17/12/2025     02:49          26695 AUDIT_REPORT.md                                                                                     
-a----        12/12/2025     10:54           4673 COMO-APLICAR-MIGRATIONS.md                                                                          
-a----        11/12/2025     00:17            363 components.json                                                                                     
-a----        11/12/2025     14:36           5049 CONFIGURACOES.md                                                                                    
-a----        12/12/2025     13:44           2504 DELIVERY-IMPROVEMENTS.md                                                                            
-a----        11/12/2025     09:45           6504 IMPLEMENTATION-COMPLETE.md                                                                          
-a----        17/12/2025     11:13           4235 middleware.ts                                                                                       
-a----        18/12/2025     15:11            168 netlify.toml                                                                                        
-a----        11/12/2025     21:34            233 next-env.d.ts                                                                                       
-a----        11/12/2025     09:26            502 next.config.js                                                                                      
-a----        11/12/2025     15:35           1283 organize.ps1                                                                                        
-a----        17/12/2025     11:43         305889 package-lock.json                                                                                   
-a----        17/12/2025     14:18           1948 package.json                                                                                        
-a----        17/12/2025     11:44           1750 playwright.config.ts                                                                                
-a----        11/12/2025     00:12             88 postcss.config.js                                                                                   
-a----        11/12/2025     08:59          12292 PROJECT-COMPLETE.md                                                                                 
-a----        11/12/2025     08:52           7607 README-MODULES.md                                                                                   
-a----        11/12/2025     00:17           7899 README.md                                                                                           
-a----        18/12/2025     14:47           6585 relatorio_auditoria.txt                                                                             
-a----        11/12/2025     02:17           5687 SETUP.md                                                                                            
-a----        14/12/2025     07:56           2417 tailwind.config.ts                                                                                  
-a----        12/12/2025     01:59           3512 TESTE.md                                                                                            
-a----        11/12/2025     09:38           9773 TROPICAL-FREEZE-FEATURES.md                                                                         
-a----        17/12/2025     23:28            681 tsconfig.json                                                                                       
-a----        17/12/2025     23:29         259762 tsconfig.tsbuildinfo                                                                                
-a----        11/12/2025     02:42           2692 VERCEL_FIX.md                                                                                       




## src/app routes
- C:\Users\User\CascadeProjects\food-management-system\src\app\error.tsx
- C:\Users\User\CascadeProjects\food-management-system\src\app\layout.tsx
- C:\Users\User\CascadeProjects\food-management-system\src\app\page.tsx
- C:\Users\User\CascadeProjects\food-management-system\src\app\(auth)\login\page.tsx
- C:\Users\User\CascadeProjects\food-management-system\src\app\(auth)\logout\route.ts
- C:\Users\User\CascadeProjects\food-management-system\src\app\(auth)\reset-password\page.tsx
- C:\Users\User\CascadeProjects\food-management-system\src\app\(auth)\signup\page.tsx
- C:\Users\User\CascadeProjects\food-management-system\src\app\(auth)\update-password\page.tsx
- C:\Users\User\CascadeProjects\food-management-system\src\app\(public)\landing\page.tsx
- C:\Users\User\CascadeProjects\food-management-system\src\app\(public)\profile\page.tsx
- C:\Users\User\CascadeProjects\food-management-system\src\app\(super-admin)\layout.tsx
- C:\Users\User\CascadeProjects\food-management-system\src\app\(super-admin)\admin\page.tsx
- C:\Users\User\CascadeProjects\food-management-system\src\app\(super-admin)\admin\analytics\page.tsx
- C:\Users\User\CascadeProjects\food-management-system\src\app\(super-admin)\admin\audit\page.tsx
- C:\Users\User\CascadeProjects\food-management-system\src\app\(super-admin)\admin\automations\page.tsx
- C:\Users\User\CascadeProjects\food-management-system\src\app\(super-admin)\admin\billing\page.tsx
- C:\Users\User\CascadeProjects\food-management-system\src\app\(super-admin)\admin\demanda\page.tsx
- C:\Users\User\CascadeProjects\food-management-system\src\app\(super-admin)\admin\features\page.tsx
- C:\Users\User\CascadeProjects\food-management-system\src\app\(super-admin)\admin\health\page.tsx
- C:\Users\User\CascadeProjects\food-management-system\src\app\(super-admin)\admin\health\audit\page.tsx
- C:\Users\User\CascadeProjects\food-management-system\src\app\(super-admin)\admin\health\builder\page.tsx
- C:\Users\User\CascadeProjects\food-management-system\src\app\(super-admin)\admin\health\database\page.tsx
- C:\Users\User\CascadeProjects\food-management-system\src\app\(super-admin)\admin\health\files\page.tsx
- C:\Users\User\CascadeProjects\food-management-system\src\app\(super-admin)\admin\health\images\page.tsx
- C:\Users\User\CascadeProjects\food-management-system\src\app\(super-admin)\admin\health\monitor\page.tsx
- C:\Users\User\CascadeProjects\food-management-system\src\app\(super-admin)\admin\health\pages\page.tsx
- C:\Users\User\CascadeProjects\food-management-system\src\app\(super-admin)\admin\health\printing\page.tsx
- C:\Users\User\CascadeProjects\food-management-system\src\app\(super-admin)\admin\health\slugs\page.tsx
- C:\Users\User\CascadeProjects\food-management-system\src\app\(super-admin)\admin\integrations\page.tsx
- C:\Users\User\CascadeProjects\food-management-system\src\app\(super-admin)\admin\logs\page.tsx
- C:\Users\User\CascadeProjects\food-management-system\src\app\(super-admin)\admin\partners\page.tsx
- C:\Users\User\CascadeProjects\food-management-system\src\app\(super-admin)\admin\plans\page.tsx
- C:\Users\User\CascadeProjects\food-management-system\src\app\(super-admin)\admin\plans\new\page.tsx
- C:\Users\User\CascadeProjects\food-management-system\src\app\(super-admin)\admin\plans\[planId]\page.tsx
- C:\Users\User\CascadeProjects\food-management-system\src\app\(super-admin)\admin\reports\page.tsx
- C:\Users\User\CascadeProjects\food-management-system\src\app\(super-admin)\admin\settings\page.tsx
- C:\Users\User\CascadeProjects\food-management-system\src\app\(super-admin)\admin\stores\page.tsx
- C:\Users\User\CascadeProjects\food-management-system\src\app\(super-admin)\admin\tenants\page.tsx
- C:\Users\User\CascadeProjects\food-management-system\src\app\(super-admin)\admin\tickets\page.tsx
- C:\Users\User\CascadeProjects\food-management-system\src\app\(super-admin)\admin\users\page.tsx
- C:\Users\User\CascadeProjects\food-management-system\src\app\api\admin\audit\fix\route.ts
- C:\Users\User\CascadeProjects\food-management-system\src\app\api\admin\audit\fix-localhost\route.ts
- C:\Users\User\CascadeProjects\food-management-system\src\app\api\admin\audit\run\route.ts
- C:\Users\User\CascadeProjects\food-management-system\src\app\api\admin\demo-setup\route.ts
- C:\Users\User\CascadeProjects\food-management-system\src\app\api\billing\generate\route.ts
- C:\Users\User\CascadeProjects\food-management-system\src\app\api\cron\billing\route.ts
- C:\Users\User\CascadeProjects\food-management-system\src\app\api\health\audit\route.ts
- C:\Users\User\CascadeProjects\food-management-system\src\app\api\health\database\route.ts
- C:\Users\User\CascadeProjects\food-management-system\src\app\api\health\diagnostic\route.ts
- C:\Users\User\CascadeProjects\food-management-system\src\app\api\health\files\route.ts
- C:\Users\User\CascadeProjects\food-management-system\src\app\api\health\fix\route.ts
- C:\Users\User\CascadeProjects\food-management-system\src\app\api\health\pages\route.ts
- C:\Users\User\CascadeProjects\food-management-system\src\app\api\health\status\route.ts
- C:\Users\User\CascadeProjects\food-management-system\src\app\api\integrations\google\callback\route.ts
- C:\Users\User\CascadeProjects\food-management-system\src\app\api\integrations\google\sync\route.ts
- C:\Users\User\CascadeProjects\food-management-system\src\app\api\upload\logo\route.ts
- C:\Users\User\CascadeProjects\food-management-system\src\app\api\webhooks\mercadopago\route.ts
- C:\Users\User\CascadeProjects\food-management-system\src\app\mapa-do-site\page.tsx
- C:\Users\User\CascadeProjects\food-management-system\src\app\qa\page.tsx
- C:\Users\User\CascadeProjects\food-management-system\src\app\select-store\page.tsx
- C:\Users\User\CascadeProjects\food-management-system\src\app\unauthorized\page.tsx
- C:\Users\User\CascadeProjects\food-management-system\src\app\[slug]\layout.tsx
- C:\Users\User\CascadeProjects\food-management-system\src\app\[slug]\page.tsx
- C:\Users\User\CascadeProjects\food-management-system\src\app\[slug]\avaliar\[deliveryId]\page.tsx
- C:\Users\User\CascadeProjects\food-management-system\src\app\[slug]\cart\page.tsx
- C:\Users\User\CascadeProjects\food-management-system\src\app\[slug]\checkout\page.tsx
- C:\Users\User\CascadeProjects\food-management-system\src\app\[slug]\dashboard\error.tsx
- C:\Users\User\CascadeProjects\food-management-system\src\app\[slug]\dashboard\layout.tsx
- C:\Users\User\CascadeProjects\food-management-system\src\app\[slug]\dashboard\loading.tsx
- C:\Users\User\CascadeProjects\food-management-system\src\app\[slug]\dashboard\page.tsx
- C:\Users\User\CascadeProjects\food-management-system\src\app\[slug]\dashboard\addons\page.tsx
- C:\Users\User\CascadeProjects\food-management-system\src\app\[slug]\dashboard\analytics\page.tsx
- C:\Users\User\CascadeProjects\food-management-system\src\app\[slug]\dashboard\appearance\page.tsx
- C:\Users\User\CascadeProjects\food-management-system\src\app\[slug]\dashboard\coupons\page.tsx
- C:\Users\User\CascadeProjects\food-management-system\src\app\[slug]\dashboard\crm\page.tsx
- C:\Users\User\CascadeProjects\food-management-system\src\app\[slug]\dashboard\custom-orders\page.tsx
- C:\Users\User\CascadeProjects\food-management-system\src\app\[slug]\dashboard\delivery\page.tsx
- C:\Users\User\CascadeProjects\food-management-system\src\app\[slug]\dashboard\financial\page.tsx
- C:\Users\User\CascadeProjects\food-management-system\src\app\[slug]\dashboard\inventory\page.tsx
- C:\Users\User\CascadeProjects\food-management-system\src\app\[slug]\dashboard\kitchen\page.tsx
- C:\Users\User\CascadeProjects\food-management-system\src\app\[slug]\dashboard\kits\page.tsx
- C:\Users\User\CascadeProjects\food-management-system\src\app\[slug]\dashboard\marketing\page.tsx
- C:\Users\User\CascadeProjects\food-management-system\src\app\[slug]\dashboard\onboarding\page.tsx
- C:\Users\User\CascadeProjects\food-management-system\src\app\[slug]\dashboard\orders\page.tsx
- C:\Users\User\CascadeProjects\food-management-system\src\app\[slug]\dashboard\pos\page.tsx
- C:\Users\User\CascadeProjects\food-management-system\src\app\[slug]\dashboard\products\page.tsx
- C:\Users\User\CascadeProjects\food-management-system\src\app\[slug]\dashboard\reports\page.tsx
- C:\Users\User\CascadeProjects\food-management-system\src\app\[slug]\dashboard\reservations\page.tsx
- C:\Users\User\CascadeProjects\food-management-system\src\app\[slug]\dashboard\reviews\page.tsx
- C:\Users\User\CascadeProjects\food-management-system\src\app\[slug]\dashboard\reviews\integrations\page.tsx
- C:\Users\User\CascadeProjects\food-management-system\src\app\[slug]\dashboard\settings\layout.tsx
- C:\Users\User\CascadeProjects\food-management-system\src\app\[slug]\dashboard\settings\page.tsx
- C:\Users\User\CascadeProjects\food-management-system\src\app\[slug]\dashboard\settings\appearance\page.tsx
- C:\Users\User\CascadeProjects\food-management-system\src\app\[slug]\dashboard\settings\complete\page.tsx
- C:\Users\User\CascadeProjects\food-management-system\src\app\[slug]\dashboard\settings\index\page.tsx
- C:\Users\User\CascadeProjects\food-management-system\src\app\[slug]\dashboard\settings\integrations\page.tsx
- C:\Users\User\CascadeProjects\food-management-system\src\app\[slug]\dashboard\settings\loyalty\page.tsx
- C:\Users\User\CascadeProjects\food-management-system\src\app\[slug]\dashboard\settings\modules\page.tsx
- C:\Users\User\CascadeProjects\food-management-system\src\app\[slug]\dashboard\settings\niche\page.tsx
- C:\Users\User\CascadeProjects\food-management-system\src\app\[slug]\dashboard\settings\pdv\page.tsx
- C:\Users\User\CascadeProjects\food-management-system\src\app\[slug]\dashboard\settings\platforms\page.tsx
- C:\Users\User\CascadeProjects\food-management-system\src\app\[slug]\dashboard\settings\scheduling\page.tsx
- C:\Users\User\CascadeProjects\food-management-system\src\app\[slug]\dashboard\settings\store\page.tsx
- C:\Users\User\CascadeProjects\food-management-system\src\app\[slug]\dashboard\tables\page.tsx
- C:\Users\User\CascadeProjects\food-management-system\src\app\[slug]\dashboard\team\page.tsx
- C:\Users\User\CascadeProjects\food-management-system\src\app\[slug]\dashboard\waiters\page.tsx
- C:\Users\User\CascadeProjects\food-management-system\src\app\[slug]\encomenda\page.tsx
- C:\Users\User\CascadeProjects\food-management-system\src\app\[slug]\garcom\page.tsx
- C:\Users\User\CascadeProjects\food-management-system\src\app\[slug]\mesa\[numero]\page.tsx
- C:\Users\User\CascadeProjects\food-management-system\src\app\[slug]\mimo\[token]\page.tsx
- C:\Users\User\CascadeProjects\food-management-system\src\app\[slug]\minha-conta\page.tsx
- C:\Users\User\CascadeProjects\food-management-system\src\app\[slug]\minha-conta\fidelidade\page.tsx
- C:\Users\User\CascadeProjects\food-management-system\src\app\[slug]\motorista\page.tsx
- C:\Users\User\CascadeProjects\food-management-system\src\app\[slug]\order\[orderId]\page.tsx
- C:\Users\User\CascadeProjects\food-management-system\src\app\[slug]\pedido\[code]\page.tsx
- C:\Users\User\CascadeProjects\food-management-system\src\app\[slug]\rastreio\[id]\page.tsx
- C:\Users\User\CascadeProjects\food-management-system\src\app\[slug]\tv\[code]\page.tsx
- C:\Users\User\CascadeProjects\food-management-system\src\app\[slug]\waiter\page.tsx

## Env keys referenced in code

## TODO/FIXME/HACK (first 200)

## Output files


    Diretório: C:\Users\User\CascadeProjects\food-management-system\_intake


Mode                 LastWriteTime         Length Name                                                                                                
----                 -------------         ------ ----                                                                                                
-a----        18/12/2025     15:36           9635 build.log                                                                                           
-a----        18/12/2025     15:36             94 lint.log                                                                                            
-a----        18/12/2025     15:36          22436 REPORT.md                                                                                           



