import os
import shutil

# CONFIGURAÇÃO
PASTA_SRC = "src"
EXTENSOES = {".ts", ".tsx", ".js", ".jsx", ".css", ".scss"}
IGNORE_DIRS = {"node_modules", ".next", "dist", "build", ".git", "scripts"}
BACKUP_DIR = "_BACKUP_ZUMBIS"

# Arquivos que são pontos de entrada e nunca são importados, mas são vitais
PONTOS_DE_ENTRADA = ["page.tsx", "layout.tsx", "loading.tsx", "error.tsx", "not-found.tsx", "route.ts", "middleware.ts", "global.css", "globals.css"]

def listar_arquivos(pasta):
    arquivos_codigo = []
    todos_arquivos = []
    
    for root, dirs, files in os.walk(pasta):
        dirs[:] = [d for d in dirs if d not in IGNORE_DIRS]
        
        for file in files:
            path = os.path.join(root, file)
            _, ext = os.path.splitext(file)
            
            todos_arquivos.append(path)
            if ext in EXTENSOES:
                arquivos_codigo.append(path)
                
    return arquivos_codigo, todos_arquivos

def ler_conteudo_projeto(arquivos_codigo):
    conteudo_total = ""
    print("📖 Lendo todo o código do projeto...")
    for arq in arquivos_codigo:
        try:
            with open(arq, "r", encoding="utf-8") as f:
                conteudo_total += f.read() + "\n"
        except:
            pass
    return conteudo_total

def caçar_zumbis():
    print("🧟‍♂️ INICIANDO CAÇADA DE CÓDIGO ZUMBI...")
    
    codigos, todos = listar_arquivos(PASTA_SRC)
    conteudao = ler_conteudo_projeto(codigos)
    
    zumbis = []
    
    print(f"🔍 Analisando {len(todos)} arquivos...")
    
    for arquivo_path in todos:
        nome_arquivo = os.path.basename(arquivo_path)
        nome_sem_ext, _ = os.path.splitext(nome_arquivo)
        
        # Se for arquivo de sistema do Next.js, ignora (não é zumbi)
        if nome_arquivo in PONTOS_DE_ENTRADA:
            continue
            
        # Lógica de detecção:
        # Se o nome do arquivo (ex: "Button.tsx" ou apenas "Button") NÃO aparece no conteudão,
        # ninguém está importando ele.
        
        # Verifica o nome com e sem extensão
        if (nome_arquivo not in conteudao) and (nome_sem_ext not in conteudao):
            # Filtro extra: ignora index.ts pois geralmente é só export
            if nome_arquivo == "index.ts": continue
            
            print(f"🧟 ZUMBI DETECTADO: {arquivo_path}")
            zumbis.append(arquivo_path)

    if not zumbis:
        print("\n✨ Parabéns! Nenhum zumbi encontrado.")
        return

    print(f"\n🏹 Encontrei {len(zumbis)} arquivos que parecem não estar sendo usados.")
    resp = input(f"Deseja mover esses zumbis para a quarentena em '{BACKUP_DIR}'? (s/n): ")
    
    if resp.lower() == 's':
        if not os.path.exists(BACKUP_DIR):
            os.makedirs(BACKUP_DIR)
            
        for zumbi in zumbis:
            # Mantém a estrutura de pastas no backup para saber de onde veio
            caminho_relativo = os.path.relpath(zumbi, ".")
            destino = os.path.join(BACKUP_DIR, caminho_relativo)
            
            os.makedirs(os.path.dirname(destino), exist_ok=True)
            shutil.move(zumbi, destino)
            print(f"⚰️  Enterrado: {zumbi}")
            
        print("\n🧹 Limpeza concluída! Se quebrou algo, basta restaurar do backup.")

if __name__ == "__main__":
    caçar_zumbis()
