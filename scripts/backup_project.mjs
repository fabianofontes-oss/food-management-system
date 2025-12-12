#!/usr/bin/env node

import { createWriteStream, mkdirSync, existsSync, readdirSync, statSync } from 'fs';
import { join, resolve, relative } from 'path';
import { createGzip } from 'zlib';
import archiver from 'archiver';

// Configuração
const BACKUP_DIR = 'backups';
const EXCLUDE_PATTERNS = [
  'node_modules',
  '.next',
  'dist',
  '.turbo',
  '.vercel',
  'coverage',
  'backups',
  '.git',
  '.DS_Store',
  'Thumbs.db',
  '*.log',
  '.env.local',
  '.env.*.local'
];

// Criar timestamp para o backup
const now = new Date();
const timestamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}`;

const backupFolder = join(BACKUP_DIR, timestamp);
const projectRoot = resolve(process.cwd());

console.log('🔄 Iniciando backup do projeto...');
console.log(`📁 Pasta de destino: ${backupFolder}`);

// Criar pasta de backup
if (!existsSync(BACKUP_DIR)) {
  mkdirSync(BACKUP_DIR, { recursive: true });
}

if (!existsSync(backupFolder)) {
  mkdirSync(backupFolder, { recursive: true });
}

// Verificar se deve excluir o arquivo/pasta
function shouldExclude(filePath) {
  const relativePath = relative(projectRoot, filePath);
  
  for (const pattern of EXCLUDE_PATTERNS) {
    if (pattern.includes('*')) {
      // Pattern com wildcard
      const regex = new RegExp(pattern.replace(/\*/g, '.*'));
      if (regex.test(relativePath)) return true;
    } else {
      // Pattern exato
      if (relativePath.includes(pattern)) return true;
    }
  }
  
  return false;
}

// Criar arquivo ZIP
const outputPath = join(backupFolder, 'project.zip');
const output = createWriteStream(outputPath);
const archive = archiver('zip', {
  zlib: { level: 9 } // Máxima compressão
});

// Event handlers
output.on('close', () => {
  const sizeInMB = (archive.pointer() / 1024 / 1024).toFixed(2);
  console.log(`✅ Backup concluído com sucesso!`);
  console.log(`📦 Tamanho: ${sizeInMB} MB`);
  console.log(`📂 Local: ${outputPath}`);
  console.log(`\n💡 Para restaurar: descompacte o arquivo e execute 'npm install'`);
});

archive.on('error', (err) => {
  console.error('❌ Erro ao criar backup:', err);
  process.exit(1);
});

archive.on('warning', (err) => {
  if (err.code === 'ENOENT') {
    console.warn('⚠️  Aviso:', err);
  } else {
    throw err;
  }
});

// Pipe archive data to the file
archive.pipe(output);

// Adicionar arquivos ao ZIP
console.log('📝 Coletando arquivos...');

function addFilesToArchive(dir, baseDir = '') {
  const files = readdirSync(dir);
  
  for (const file of files) {
    const filePath = join(dir, file);
    const archivePath = join(baseDir, file);
    
    if (shouldExclude(filePath)) {
      continue;
    }
    
    const stat = statSync(filePath);
    
    if (stat.isDirectory()) {
      addFilesToArchive(filePath, archivePath);
    } else {
      archive.file(filePath, { name: archivePath });
    }
  }
}

try {
  addFilesToArchive(projectRoot);
  
  // Finalizar o arquivo
  archive.finalize();
} catch (error) {
  console.error('❌ Erro ao processar arquivos:', error);
  process.exit(1);
}
