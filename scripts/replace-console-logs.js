/**
 * Script para substituir console.log por logger estruturado
 * Uso: node scripts/replace-console-logs.js
 */

const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '..', 'src');

// Arquivos que devem manter console.log (debug/desenvolvimento)
const whitelist = [
  'admin/audit/page.tsx', // Página de auditoria precisa de console.log
];

function shouldSkip(filePath) {
  return whitelist.some(pattern => filePath.includes(pattern));
}

function replaceConsoleLogs(filePath) {
  if (shouldSkip(filePath)) {
    console.log(`⏭️  Skipping: ${filePath}`);
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // Verificar se já importa logger
  const hasLoggerImport = content.includes("from '@/lib/logger'");

  // Substituir console.log por logger.info
  const logRegex = /console\.log\((.*?)\)/g;
  if (logRegex.test(content)) {
    content = content.replace(logRegex, 'logger.info($1)');
    modified = true;
  }

  // Substituir console.error por logger.error
  const errorRegex = /console\.error\((.*?)\)/g;
  if (errorRegex.test(content)) {
    content = content.replace(errorRegex, 'logger.error($1)');
    modified = true;
  }

  // Substituir console.warn por logger.warn
  const warnRegex = /console\.warn\((.*?)\)/g;
  if (warnRegex.test(content)) {
    content = content.replace(warnRegex, 'logger.warn($1)');
    modified = true;
  }

  // Adicionar import se necessário
  if (modified && !hasLoggerImport) {
    // Encontrar última linha de import
    const lines = content.split('\n');
    let lastImportIndex = -1;
    
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trim().startsWith('import ')) {
        lastImportIndex = i;
      }
    }

    if (lastImportIndex !== -1) {
      lines.splice(lastImportIndex + 1, 0, "import { logger } from '@/lib/logger';");
      content = lines.join('\n');
    }
  }

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Fixed: ${filePath}`);
  }
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      walkDir(filePath);
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      replaceConsoleLogs(filePath);
    }
  });
}

console.log('🔍 Procurando console.logs...\n');
walkDir(srcDir);
console.log('\n✨ Concluído!');
