import os
import re
import shutil
from datetime import datetime

# CONFIGURAÇÃO
PASTA_SRC = "src"
EXTENSOES = {".ts", ".tsx", ".js", ".jsx"}
IGNORE_DIRS = {"node_modules", ".next", "dist", "build", ".git", "_BACKUP_LIXO", "_BACKUP_ZUMBIS", "_BACKUP_BEFORE_FIX"}
BACKUP_DIR = "_BACKUP_BEFORE_FIX"

# Contadores
stats = {
    "arquivos_modificados": 0,
    "localhost_corrigidos": 0,
    "console_comentados": 0,
    "backups_criados": 0
}

def criar_backup(filepath):
    """Cria backup do arquivo antes de modificá-lo"""
    caminho_relativo = os.path.relpath(filepath, ".")
    destino = os.path.join(BACKUP_DIR, caminho_relativo)
    
    os.makedirs(os.path.dirname(destino), exist_ok=True)
    shutil.copy2(filepath, destino)
    stats["backups_criados"] += 1
    return destino

def corrigir_localhost(linha):
    """
    Substitui http://localhost:3000 por variável de ambiente.
    Retorna a linha corrigida e se houve mudança.
    """
    original = linha
    
    # Padrão 1: Dentro de template string `${...}`
    # Ex: `${baseUrl}` onde baseUrl = "http://localhost:3000"
    
    # Padrão 2: String simples com aspas
    # "http://localhost:3000/api" -> `${process.env.NEXT_PUBLIC_APP_URL || ''}/api`
    
    # Detecta se está dentro de aspas simples ou duplas
    patterns = [
        # "http://localhost:3000" ou 'http://localhost:3000'
        (r'["\']http://localhost:3000([^"\']*)["\']', r'`${process.env.NEXT_PUBLIC_APP_URL || ""}\1`'),
        # http://localhost:3000 sem aspas (raro, mas pode acontecer em comentários - ignorar)
    ]
    
    for pattern, replacement in patterns:
        linha = re.sub(pattern, replacement, linha)
    
    changed = linha != original
    return linha, changed

def comentar_console(linha):
    """
    Comenta linhas com console.log (não apaga por segurança).
    Retorna a linha modificada e se houve mudança.
    """
    # Ignora linhas já comentadas
    stripped = linha.lstrip()
    if stripped.startswith("//") or stripped.startswith("/*"):
        return linha, False
    
    # Verifica se tem console.log
    if "console.log(" in linha:
        # Pega a indentação original
        indentacao = len(linha) - len(linha.lstrip())
        espacos = linha[:indentacao]
        
        # Adiciona comentário
        linha_comentada = f"{espacos}// [FAXINEIRO] {linha.lstrip()}"
        return linha_comentada, True
    
    return linha, False

def processar_arquivo(filepath):
    """Processa um arquivo aplicando todas as correções"""
    try:
        with open(filepath, "r", encoding="utf-8") as f:
            linhas = f.readlines()
    except Exception as e:
        print(f"  ❌ Erro ao ler: {e}")
        return False
    
    modificado = False
    novas_linhas = []
    localhost_count = 0
    console_count = 0
    
    for linha in linhas:
        linha_atual = linha
        
        # 1. Corrigir localhost
        linha_atual, localhost_changed = corrigir_localhost(linha_atual)
        if localhost_changed:
            localhost_count += 1
        
        # 2. Comentar console.log
        linha_atual, console_changed = comentar_console(linha_atual)
        if console_changed:
            console_count += 1
        
        novas_linhas.append(linha_atual)
        
        if localhost_changed or console_changed:
            modificado = True
    
    if modificado:
        # Criar backup antes de salvar
        criar_backup(filepath)
        
        # Salvar arquivo modificado
        with open(filepath, "w", encoding="utf-8") as f:
            f.writelines(novas_linhas)
        
        stats["arquivos_modificados"] += 1
        stats["localhost_corrigidos"] += localhost_count
        stats["console_comentados"] += console_count
        
        return True
    
    return False

def listar_arquivos(pasta):
    """Lista todos os arquivos elegíveis para correção"""
    arquivos = []
    for root, dirs, files in os.walk(pasta):
        dirs[:] = [d for d in dirs if d not in IGNORE_DIRS]
        for file in files:
            _, ext = os.path.splitext(file)
            if ext in EXTENSOES:
                arquivos.append(os.path.join(root, file))
    return arquivos

def faxina():
    print("🧹 FAXINEIRO - Correção Automática de Código")
    print("=" * 60)
    print(f"📅 {datetime.now().strftime('%d/%m/%Y %H:%M:%S')}")
    print("=" * 60)
    print()
    print("📋 O que será corrigido:")
    print("   🏠 localhost:3000 → process.env.NEXT_PUBLIC_APP_URL")
    print("   🐛 console.log → comentado com // [FAXINEIRO]")
    print()
    
    arquivos = listar_arquivos(PASTA_SRC)
    print(f"📁 Encontrados {len(arquivos)} arquivos para analisar")
    print()
    
    # Primeira passada: contar o que será alterado
    preview_localhost = 0
    preview_console = 0
    
    for arquivo in arquivos:
        try:
            with open(arquivo, "r", encoding="utf-8") as f:
                conteudo = f.read()
                preview_localhost += len(re.findall(r'http://localhost:3000', conteudo))
                # Conta console.log não comentados
                for linha in conteudo.split('\n'):
                    stripped = linha.lstrip()
                    if 'console.log(' in linha and not stripped.startswith('//') and not stripped.startswith('/*'):
                        preview_console += 1
        except:
            pass
    
    print(f"🔍 Preview das correções:")
    print(f"   🏠 {preview_localhost} URLs localhost encontradas")
    print(f"   🐛 {preview_console} console.logs encontrados")
    print()
    
    if preview_localhost == 0 and preview_console == 0:
        print("✨ Nada para corrigir! Código já está limpo.")
        return
    
    resp = input(f"⚠️  Deseja aplicar as correções? (s/n): ")
    if resp.lower() != 's':
        print("❌ Operação cancelada.")
        return
    
    print()
    print("🚀 Aplicando correções...")
    print("-" * 60)
    
    for arquivo in arquivos:
        caminho_rel = os.path.relpath(arquivo, ".")
        resultado = processar_arquivo(arquivo)
        if resultado:
            print(f"✅ {caminho_rel}")
    
    print("-" * 60)
    print()
    print("📊 RESUMO DA FAXINA:")
    print(f"   📁 Arquivos modificados: {stats['arquivos_modificados']}")
    print(f"   🏠 Localhost corrigidos: {stats['localhost_corrigidos']}")
    print(f"   🐛 Console.logs comentados: {stats['console_comentados']}")
    print(f"   💾 Backups criados em: {BACKUP_DIR}/")
    print()
    print("✨ Faxina concluída!")
    print()
    print("💡 DICA: Se algo quebrou, restaure do backup:")
    print(f"   xcopy /E /Y {BACKUP_DIR}\\* .")

if __name__ == "__main__":
    faxina()
