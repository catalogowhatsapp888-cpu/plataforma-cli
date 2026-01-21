import sys
import os
import pandas as pd
import re
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
import uuid

# Adiciona o diretório backend ao path para conseguir importar os módulos do sistema
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from app.db.session import SessionLocal
from app.models.models import Contact, LeadPipeline

def clean_phone(phone_raw):
    """
    Padroniza telefones para o formato E.164 (+55DDDxxxxxxxxx)
    """
    if not phone_raw:
        return None
    
    # Converte para string e remove tudo que não é número
    phone_str = str(phone_raw)
    digits = re.sub(r'\D', '', phone_str)
    
    # Se não tiver dígitos suficientes, descarta
    if len(digits) < 10:
        return None
        
    # Assume Brasil (+55) se não começar com 55 e tiver 10 ou 11 dígitos
    if len(digits) in [10, 11]:
        digits = '55' + digits
        
    return f"+{digits}"

def import_excel(file_path):
    print(f"📖 Lendo arquivo: {file_path}")
    
    try:
        # Lê todas as abas (sheet_name=None retorna um dict de dataframes)
        all_sheets = pd.read_excel(file_path, sheet_name=None, header=None)
    except Exception as e:
        print(f"❌ Erro ao ler arquivo: {e}")
        return

    db: Session = SessionLocal()
    total_imported = 0
    total_duplicates = 0
    total_errors = 0

    print("🔄 Iniciando processamento...")

    for sheet_name, df in all_sheets.items():
        print(f"   📂 Processando aba: {sheet_name} ({len(df)} linhas)")
        
        # Pula cabeçalho se houver (assumindo que linha 0 possa ser cabeçalho ou dados)
        # O usuário disse A: Nome, B: Telefone. Vamos iterar linha a linha.
        
        for index, row in df.iterrows():
            try:
                # Pega colunas A (0) e B (1)
                raw_name = row[0] if len(row) > 0 else None
                raw_phone = row[1] if len(row) > 1 else None
                
                # Pula linhas vazias
                if pd.isna(raw_name) and pd.isna(raw_phone):
                    continue
                    
                # Sanitiza
                name = str(raw_name).strip() if not pd.isna(raw_name) else "Sem Nome"
                phone = clean_phone(raw_phone)
                
                if not phone:
                    # print(f"      ⚠️ Telefone inválido na linha {index}: {raw_phone}")
                    total_errors += 1
                    continue
                
                # Tenta inserir
                contact = Contact(
                    full_name=name,
                    phone_e164=phone,
                    source='import_sheets',
                    type='lead'
                )
                
                db.add(contact)
                db.flush() # Tenta persistir para pegar ID
                
                # Cria entrada no pipeline também
                pipeline = LeadPipeline(
                    contact_id=contact.id,
                    stage='novo',
                    temperature='frio',
                    notes=f"Importado da aba {sheet_name}"
                )
                db.add(pipeline)
                db.commit()
                total_imported += 1
                
            except IntegrityError:
                db.rollback()
                # Duplicado
                total_duplicates += 1
                # Aqui poderíamos atualizar o lead existente se quiséssemos
            except Exception as e:
                db.rollback()
                print(f"      ❌ Erro na linha {index}: {e}")
                total_errors += 1

    print("\n📊 Resumo da Importação:")
    print(f"✅ Leads Importados: {total_imported}")
    print(f"♻️  Duplicados (ignorados): {total_duplicates}")
    print(f"⚠️  Erros / Inválidos: {total_errors}")
    
    db.close()

if __name__ == "__main__":
    # Caminho do arquivo padrão solicitado pelo usuário
    base_dir = os.path.dirname(__file__)
    default_file = os.path.join(base_dir, 'planilhas leads', 'Leads_clinica.xlsx')
    
    if os.path.exists(default_file):
        print(f"🎯 Arquivo padrão encontrado: {default_file}")
        import_excel(default_file)
    else:
        # Fallback: Procura na pasta dados_entrada
        input_dir = os.path.join(base_dir, 'dados_entrada')
        if os.path.exists(input_dir):
            files = [f for f in os.listdir(input_dir) if f.endswith('.xlsx')]
            
            if not files:
                print(f"❌ Arquivo padrão '{default_file}' não encontrado.")
                print(f"❌ E nenhum arquivo .xlsx encontrado em '{input_dir}'")
            else:
                file_path = os.path.join(input_dir, files[0])
                import_excel(file_path)
        else:
            print(f"❌ Diretórios de importação não encontrados.")
