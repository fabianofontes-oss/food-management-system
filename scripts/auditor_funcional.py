import os
import re
import json
from datetime import datetime

# CONFIGURAÇÃO
PASTA_SRC = "src"
EXTENSOES = {".ts", ".tsx"}
IGNORE_DIRS = {"node_modules", ".next", "dist", "build", ".git", "_BACKUP_LIXO", "_BACKUP_ZUMBIS"}
RELATORIO_FILE = "relatorio_auditoria.txt"
JSON_FILE = os.path.join("public", "audit-report.json")

# PADRÕES A DETECTAR
PADROES = {
    # Botões Fantasmas
    "botao_vazio": {
        "regex": r'onClick=\{\s*\(\)\s*=>\s*\{\s*\}\s*\}',
        "emoji": "👻",
        "desc": "Botão sem ação (onClick vazio)"
    },
    "href_vazio": {
        "regex": r'href=["\'](#|)["\']',
        "emoji": "👻",
        "desc": "Link sem destino (href='#' ou vazio)"
    },
    "console_log": {
        "regex": r'console\.log\s*\(',
        "emoji": "🐛",
        "desc": "Console.log esquecido"
    },
    
    # Mocks e Dados Falsos
    "mock_data": {
        "regex": r'\b(const|let|var)\s+\w*(mock|Mock|MOCK|dummy|Dummy|faker|Faker|fake|Fake)\w*\s*=',
        "emoji": "🤡",
        "desc": "Dados Mock/Fake detectados"
    },
    "todo_comment": {
        "regex": r'(//|/\*|\*)\s*(TODO|FIXME|XXX|HACK)',
        "emoji": "📝",
        "desc": "Comentário TODO/FIXME pendente"
    },
    
    # Redirecionamentos Suspeitos
    "router_push_vazio": {
        "regex": r'router\.push\s*\(\s*["\']["\']',
        "emoji": "🔀",
        "desc": "Router.push vazio"
    },
    "localhost_hardcoded": {
        "regex": r'https?://localhost(:\d+)?',
        "emoji": "🏠",
        "desc": "URL localhost hardcoded"
    },
    "href_localhost": {
        "regex": r'href=["\']https?://localhost',
        "emoji": "🏠",
        "desc": "Link com localhost hardcoded"
    }
}

def listar_arquivos(pasta):
    arquivos = []
    for root, dirs, files in os.walk(pasta):
        dirs[:] = [d for d in dirs if d not in IGNORE_DIRS]
        for file in files:
            _, ext = os.path.splitext(file)
            if ext in EXTENSOES:
                arquivos.append(os.path.join(root, file))
    return arquivos

def auditar_arquivo(filepath):
    problemas = []
    try:
        with open(filepath, "r", encoding="utf-8") as f:
            linhas = f.readlines()
            
        for num_linha, linha in enumerate(linhas, 1):
            for nome_padrao, config in PADROES.items():
                if re.search(config["regex"], linha):
                    # Extrai um trecho da linha para contexto
                    trecho = linha.strip()[:60] + "..." if len(linha.strip()) > 60 else linha.strip()
                    problemas.append({
                        "linha": num_linha,
                        "emoji": config["emoji"],
                        "desc": config["desc"],
                        "trecho": trecho
                    })
    except Exception as e:
        pass
    
    return problemas

def gerar_relatorio():
    print("🔍 AUDITOR FUNCIONAL - Iniciando varredura...")
    print("=" * 60)
    
    arquivos = listar_arquivos(PASTA_SRC)
    print(f"📁 Encontrados {len(arquivos)} arquivos para analisar\n")
    
    relatorio = []
    total_problemas = 0
    arquivos_com_problemas = 0
    
    # Estrutura JSON
    json_errors = []
    contadores = {
        "botao_vazio": 0,
        "href_vazio": 0,
        "console_log": 0,
        "mock_data": 0,
        "todo_comment": 0,
        "router_push_vazio": 0,
        "localhost_hardcoded": 0,
        "href_localhost": 0
    }
    
    # Cabeçalho do relatório
    relatorio.append("=" * 60)
    relatorio.append(f"📋 RELATÓRIO DE AUDITORIA FUNCIONAL")
    relatorio.append(f"📅 Data: {datetime.now().strftime('%d/%m/%Y %H:%M:%S')}")
    relatorio.append(f"📁 Arquivos analisados: {len(arquivos)}")
    relatorio.append("=" * 60)
    relatorio.append("")
    
    for arquivo in arquivos:
        problemas = auditar_arquivo(arquivo)
        
        if problemas:
            arquivos_com_problemas += 1
            total_problemas += len(problemas)
            
            # Caminho relativo para exibição
            caminho_rel = os.path.relpath(arquivo, ".")
            
            # Console
            print(f"📂 {caminho_rel}")
            relatorio.append(f"📂 {caminho_rel}")
            
            for p in problemas:
                linha_saida = f"   [Linha {p['linha']:4d}] {p['emoji']} {p['desc']}"
                print(linha_saida)
                relatorio.append(linha_saida)
                
                # Adicionar ao JSON
                json_errors.append({
                    "file": caminho_rel.replace("\\", "/"),
                    "line": p["linha"],
                    "type": p["tipo"] if "tipo" in p else p["desc"].split("(")[0].strip(),
                    "category": p.get("categoria", "other"),
                    "message": p["desc"],
                    "emoji": p["emoji"]
                })
                
            print()
            relatorio.append("")
    
    # Resumo
    resumo = [
        "=" * 60,
        "📊 RESUMO",
        "=" * 60,
        f"   Total de arquivos analisados: {len(arquivos)}",
        f"   Arquivos com problemas: {arquivos_com_problemas}",
        f"   Total de problemas encontrados: {total_problemas}",
        "",
        "📌 LEGENDA:",
        "   👻 Botão/Link fantasma (sem ação)",
        "   🐛 Debug esquecido (console.log)",
        "   🤡 Dados mock/fake",
        "   📝 TODO/FIXME pendente",
        "   🔀 Redirecionamento suspeito",
        "   🏠 URL localhost hardcoded",
        "=" * 60
    ]
    
    for linha in resumo:
        print(linha)
        relatorio.append(linha)
    
    # Salvar arquivo TXT
    with open(RELATORIO_FILE, "w", encoding="utf-8") as f:
        f.write("\n".join(relatorio))
    
    # Contar por categoria
    broken_buttons = sum(1 for e in json_errors if "fantasma" in e["message"].lower() or "vazio" in e["message"].lower())
    todos_count = sum(1 for e in json_errors if "TODO" in e["message"] or "FIXME" in e["message"])
    console_count = sum(1 for e in json_errors if "console" in e["message"].lower())
    mock_count = sum(1 for e in json_errors if "mock" in e["message"].lower() or "fake" in e["message"].lower())
    localhost_count = sum(1 for e in json_errors if "localhost" in e["message"].lower())
    
    # Estrutura JSON final
    json_data = {
        "timestamp": datetime.now().isoformat(),
        "generated_at": datetime.now().strftime("%d/%m/%Y %H:%M:%S"),
        "errors": json_errors,
        "summary": {
            "total_errors": total_problemas,
            "files_scanned": len(arquivos),
            "files_with_problems": arquivos_com_problemas,
            "broken_buttons": broken_buttons,
            "todos_pending": todos_count,
            "console_logs": console_count,
            "mock_data": mock_count,
            "localhost_urls": localhost_count
        }
    }
    
    # Garantir que a pasta public existe
    os.makedirs(os.path.dirname(JSON_FILE), exist_ok=True)
    
    # Salvar arquivo JSON
    with open(JSON_FILE, "w", encoding="utf-8") as f:
        json.dump(json_data, f, ensure_ascii=False, indent=2)
    
    print(f"\n💾 Relatório TXT salvo em: {RELATORIO_FILE}")
    print(f"📊 Relatório JSON salvo em: {JSON_FILE}")

if __name__ == "__main__":
    gerar_relatorio()
