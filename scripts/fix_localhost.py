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

def corrigir_localhost(conteudo):
    """
    Substitui http://localhost:3000 por variável de ambiente.
    Retorna o conteúdo corrigido e quantidade de substituições.
    """
    count = 0
    
    # Padrão: "http://localhost:3000..." ou 'http://localhost:3000...'
    def replacer(match):
        nonlocal count
        count += 1
        path = match.group(1) or ""
        return f'`${{process.env.NEXT_PUBLIC_APP_URL || ""}}{path}`'
    
    # Substitui strings com aspas simples ou duplas
    novo_conteudo = re.sub(
        r'["\']http://localhost:3000([^"\']*)["\']',
        replacer,
        conteudo
    )
    
    return novo_conteudo, count

def processar_arquivo(filepath):
    """Processa um arquivo corrigindo localhost"""
    try:
        with open(filepath, "r", encoding="utf-8") as f:
            conteudo = f.read()
    except Exception as e:
        return False, 0
    
    novo_conteudo, count = corrigir_localhost(conteudo)
    
    if count > 0:
        # Criar backup antes de salvar
        criar_backup(filepath)
        
        # Salvar arquivo modificado
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(novo_conteudo)
        
        stats["arquivos_modificados"] += 1
        stats["localhost_corrigidos"] += count
        
        return True, count
    
    return False, 0

def listar_arquivos(pasta):
    """Lista todos os arquivos elegíveis"""
    arquivos = []
    for root, dirs, files in os.walk(pasta):
        dirs[:] = [d for d in dirs if d not in IGNORE_DIRS]
        for file in files:
            _, ext = os.path.splitext(file)
            if ext in EXTENSOES:
                arquivos.append(os.path.join(root, file))
    return arquivos

def executar():
    """Executa a correção de localhost"""
    print("🔗 FIX LOCALHOST - Correção de URLs")
    print("=" * 50)
    
    arquivos = listar_arquivos(PASTA_SRC)
    arquivos_corrigidos = []
    
    for arquivo in arquivos:
        caminho_rel = os.path.relpath(arquivo, ".")
        modificado, count = processar_arquivo(arquivo)
        if modificado:
            arquivos_corrigidos.append({
                "arquivo": caminho_rel,
                "correcoes": count
            })
            print(f"✅ {caminho_rel} ({count} correções)")
    
    print()
    print("=" * 50)
    print(f"📊 RESUMO:")
    print(f"   Arquivos modificados: {stats['arquivos_modificados']}")
    print(f"   URLs corrigidas: {stats['localhost_corrigidos']}")
    print(f"   Backups criados em: {BACKUP_DIR}/")
    print("=" * 50)
    
    # Retorna JSON para a API
    return {
        "success": True,
        "arquivos_modificados": stats["arquivos_modificados"],
        "urls_corrigidas": stats["localhost_corrigidos"],
        "detalhes": arquivos_corrigidos
    }

if __name__ == "__main__":
    import json
    resultado = executar()
    print()
    print("JSON:", json.dumps(resultado, indent=2))
