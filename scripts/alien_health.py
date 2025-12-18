import os
import shutil

DIR_ALVO = os.path.join("src", "app", "(super-admin)", "admin", "health")
ARQUIVO_CHEFE = os.path.join(DIR_ALVO, "page.tsx")
DIR_BACKUP = "_BACKUP_HEALTH"

def alien_trabalhando():
    print(f"👽 Alien analisando: {DIR_ALVO}")
    
    if not os.path.exists(ARQUIVO_CHEFE):
        print("❌ Erro: page.tsx não encontrado.")
        return

    with open(ARQUIVO_CHEFE, 'r', encoding='utf-8') as f:
        conteudo = f.read()

    subpastas = [f.name for f in os.scandir(DIR_ALVO) if f.is_dir()]
    lixo = []

    print("-" * 40)
    for pasta in subpastas:
        if pasta.startswith('.'): continue
        
        # Se o nome da pasta não está escrito no page.tsx, é lixo
        if pasta not in conteudo:
            print(f"⚠️  LIXO DETECTADO: {pasta}")
            lixo.append(pasta)
        else:
            print(f"✅  EM USO: {pasta}")
    print("-" * 40)

    if lixo:
        resp = input(f"Encontrei {len(lixo)} pastas inúteis. Mover para {DIR_BACKUP}? (S/N): ")
        if resp.lower() == 's':
            if not os.path.exists(DIR_BACKUP): os.makedirs(DIR_BACKUP)
            for item in lixo:
                shutil.move(os.path.join(DIR_ALVO, item), os.path.join(DIR_BACKUP, item))
            print("🚀 Limpeza concluída!")
    else:
        print("✨ Nada para limpar.")

if __name__ == "__main__":
    alien_trabalhando()
