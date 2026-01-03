import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const APP_DIR = path.join(path.dirname(__dirname), "src", "app");

function walk(dir) {
  const out = [];
  try {
    for (const item of fs.readdirSync(dir)) {
      const p = path.join(dir, item);
      const stat = fs.statSync(p);
      if (stat.isDirectory()) out.push(...walk(p));
      else out.push(p);
    }
  } catch (e) {
    console.warn(`Skipping ${dir}: ${e.message}`);
  }
  return out;
}

function toRoute(file) {
  const rel = file.replace(APP_DIR, "").replace(/\\/g, "/");
  if (!/(page|route|layout)\.(ts|tsx)$/.test(rel)) return null;

  const type = rel.match(/\/(page|route|layout)\.(ts|tsx)$/)?.[1];
  
  let r = rel.replace(/\/(page|route|layout)\.(ts|tsx)$/, "");
  r = r.replace(/\/\([^/]+\)/g, "");
  r = r.replace(/\[([^\]]+)\]/g, ":$1");
  
  return { route: r === "" ? "/" : r, file: rel, type };
}

const files = walk(APP_DIR);
const routes = files.map(toRoute).filter(Boolean);

// Agrupar por tipo
const byType = {
  page: routes.filter(r => r.type === 'page'),
  route: routes.filter(r => r.type === 'route'),
  layout: routes.filter(r => r.type === 'layout')
};

// Análise de domínios baseada no middleware
const analysis = {
  // pediufood.com rotas
  marketing: routes.filter(r => 
    r.route === '/' ||
    r.route === '/marketplace' ||
    r.route === '/para-motoristas' ||
    r.route === '/blog' ||
    r.route === '/criar-loja'
  ),
  
  // admin.pediu.food → /admin/*
  admin: routes.filter(r => r.route.startsWith('/admin')),
  
  // app.pediu.food (multi-tenant app)
  app_auth: routes.filter(r => 
    r.route.startsWith('/login') || 
    r.route.startsWith('/signup') ||
    r.route.startsWith('/select-store') ||
    r.route.startsWith('/onboarding')
  ),
  
  // {slug}.pediu.food → /s/:slug
  white_label_store: routes.filter(r => r.route.startsWith('/s/:slug')),
  
  // :slug.entregou.food → /motorista-publico/:slug
  driver_profile: routes.filter(r => r.route.startsWith('/motorista-publico/:slug')),
  
  // driver.entregou.food → /driver/*
  driver_dashboard: routes.filter(r => r.route.startsWith('/driver')),
  
  // Dashboard de lojas (/:slug/dashboard)
  store_dashboard: routes.filter(r => r.route.includes('/:slug/dashboard')),
  
  // API routes
  api: routes.filter(r => r.route.startsWith('/api')),
  
  // Órfãs: rotas que não se encaixam em nenhuma categoria
  orphaned: []
};

// Detectar rotas órfãs
const categorized = new Set([
  ...analysis.marketing,
  ...analysis.admin,
  ...analysis.app_auth,
  ...analysis.white_label_store,
  ...analysis.driver_profile,
  ...analysis.driver_dashboard,
  ...analysis.store_dashboard,
  ...analysis.api
].map(r => r.route));

analysis.orphaned = routes.filter(r => !categorized.has(r.route) && r.type === 'page');

const report = {
  generated_at: new Date().toISOString(),
  total_routes: routes.length,
  breakdown: {
    pages: byType.page.length,
    api_routes: byType.route.length,
    layouts: byType.layout.length
  },
  by_domain: {
    marketing_pediufood_com: analysis.marketing.length,
    admin_pediu_food: analysis.admin.length,
    app_pediu_food_auth: analysis.app_auth.length,
    white_label_slug_pediu_food: analysis.white_label_store.length,
    driver_profile_slug_entregou_food: analysis.driver_profile.length,
    driver_dashboard_entregou_food: analysis.driver_dashboard.length,
    store_dashboard_slug: analysis.store_dashboard.length,
    api: analysis.api.length,
    orphaned: analysis.orphaned.length
  },
  routes_by_category: {
    marketing: analysis.marketing.map(r => r.route),
    admin: analysis.admin.map(r => r.route),
    app_auth: analysis.app_auth.map(r => r.route),
    white_label: analysis.white_label_store.map(r => r.route),
    driver_profile: analysis.driver_profile.map(r => r.route),
    driver_dashboard: analysis.driver_dashboard.map(r => r.route),
    store_dashboard: analysis.store_dashboard.map(r => r.route),
    api: analysis.api.map(r => r.route),
    orphaned: analysis.orphaned.map(r => ({ route: r.route, file: r.file }))
  },
  all_routes: routes.sort((a, b) => a.route.localeCompare(b.route))
};

fs.writeFileSync("AUDIT_ROUTES.json", JSON.stringify(report, null, 2));

console.log("✅ AUDITORIA DE ROTAS CONCLUÍDA");
console.log(`📊 Total: ${report.total_routes} rotas`);
console.log(`📄 Pages: ${report.breakdown.pages}`);
console.log(`🔌 API Routes: ${report.breakdown.api_routes}`);
console.log(`📐 Layouts: ${report.breakdown.layouts}`);
console.log(`\n🌐 Por Domínio:`);
console.log(`   Marketing (pediufood.com): ${report.by_domain.marketing_pediufood_com}`);
console.log(`   Admin (admin.pediu.food): ${report.by_domain.admin_pediu_food}`);
console.log(`   App Auth (app.pediu.food): ${report.by_domain.app_pediu_food_auth}`);
console.log(`   White-label ({slug}.pediu.food): ${report.by_domain.white_label_slug_pediu_food}`);
console.log(`   Driver Profile ({slug}.entregou.food): ${report.by_domain.driver_profile_slug_entregou_food}`);
console.log(`   Driver Dashboard (driver.entregou.food): ${report.by_domain.driver_dashboard_entregou_food}`);
console.log(`   Store Dashboard (/:slug/dashboard): ${report.by_domain.store_dashboard_slug}`);
console.log(`   API: ${report.by_domain.api}`);
console.log(`   Órfãs: ${report.by_domain.orphaned}`);
console.log(`\n💾 Salvo em: AUDIT_ROUTES.json`);

if (analysis.orphaned.length > 0) {
  console.log(`\n⚠️  ROTAS ÓRFÃS DETECTADAS:`);
  analysis.orphaned.forEach(r => {
    console.log(`   ${r.route} (${r.file})`);
  });
}
