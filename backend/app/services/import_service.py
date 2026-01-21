import pandas as pd
import re
import os
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from app.models.models import Contact, LeadPipeline
import logging

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

def process_excel_import(db: Session, file_path: str):
    print(f"📖 Lendo arquivo para importação: {file_path}")
    
    try:
        # Lê todas as abas, assumindo que a LINHA 1 é cabeçalho
        all_sheets = pd.read_excel(file_path, sheet_name=None, header=0)
    except Exception as e:
        return {"success": False, "error": str(e)}

    total_imported = 0
    total_duplicates = 0
    total_errors = 0
    total_updated = 0
    errors_details = []

    for sheet_name, df in all_sheets.items():
        print(f"   📂 Processando aba: {sheet_name} ({len(df)} linhas)")
        
        # Normaliza nomes de colunas
        df.columns = [str(c).strip().lower() for c in df.columns]
        
        # Identifica colunas
        col_phone = next((c for c in df.columns if c in ['mobilephone', 'telefone', 'celular', 'phone', 'whatsapp']), None)
        col_name = next((c for c in df.columns if c in ['name', 'nome', 'cliente', 'full_name', 'contato']), None)
        col_temp = next((c for c in df.columns if c in ['classificação', 'classificacao', 'temperatura', 'status', 'classification']), None)
        
        # Fallback índices
        if not col_phone and len(df.columns) > 0: col_phone = df.columns[0]
        if not col_name and len(df.columns) > 1: col_name = df.columns[1]
        if not col_temp and len(df.columns) > 3: col_temp = df.columns[3]
        
        print(f"      📍 Mapeamento: Tel='{col_phone}' | Nome='{col_name}' | Temp='{col_temp}'")

        for index, row in df.iterrows():
            try:
                raw_phone = row[col_phone] if col_phone and not pd.isna(row[col_phone]) else None
                raw_name = row[col_name] if col_name and not pd.isna(row[col_name]) else None
                
                # Validação Telefone
                if not raw_phone:
                    continue
                phone = clean_phone(raw_phone)
                if not phone:
                    # Telefone inválido
                    continue

                name = str(raw_name).strip() if raw_name else "Sem Nome"

                # Lógica Temperatura
                raw_temp = row[col_temp] if col_temp and not pd.isna(row[col_temp]) else "off"
                start_temp = str(raw_temp).strip().lower()
                
                if start_temp in ['nan', 'none', '', 'numpy.nan']:
                    final_temp = 'off'
                else:
                    temp_map = {
                        'quente': 'quente', 'hot': 'quente', '🔥': 'quente',
                        'morno': 'morno', 'warm': 'morno', '☁️': 'morno',
                        'frio': 'frio', 'cold': 'frio', '❄️': 'frio',
                        'off': 'off', 'cancelado': 'off', '🚫': 'off'
                    }
                    final_temp = 'off'
                    for k, v in temp_map.items():
                        if k in start_temp:
                            final_temp = v
                            break

                # Verifica Duplicidade e Atualiza
                existing_contact = db.query(Contact).filter(Contact.phone_e164 == phone).first()
                if existing_contact:
                    pipeline = db.query(LeadPipeline).filter(LeadPipeline.contact_id == existing_contact.id).first()
                    if pipeline:
                        if pipeline.temperature != final_temp:
                            pipeline.temperature = final_temp
                            db.commit()
                            total_updated += 1
                        else:
                            total_duplicates += 1
                    else:
                        pipeline = LeadPipeline(contact_id=existing_contact.id, stage='novo', temperature=final_temp)
                        db.add(pipeline)
                        db.commit()
                        total_updated += 1
                    continue

                # Novo Contato
                contact = Contact(
                    full_name=name,
                    phone_e164=phone,
                    source='import_sheets',
                    type='lead'
                )
                db.add(contact)
                db.flush() 
                
                pipeline = LeadPipeline(
                    contact_id=contact.id,
                    stage='novo',
                    temperature=final_temp,
                    notes=f"Importado: {sheet_name}"
                )
                db.add(pipeline)
                db.commit()
                total_imported += 1
                
            except Exception as e:
                db.rollback()
                err_msg = f"Linha {index}: {str(e)}"
                total_errors += 1
                if len(errors_details) < 20:
                    errors_details.append(err_msg)

    return {
        "success": True,
        "imported": total_imported,
        "updated": total_updated,
        "duplicates": total_duplicates,
        "errors": total_errors,
        "error_details": errors_details
    }
