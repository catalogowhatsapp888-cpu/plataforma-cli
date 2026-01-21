import pandas as pd
import os

def debug_excel():
    base_dir = os.path.dirname(__file__)
    target_file = os.path.join(base_dir, 'planilhas leads', 'Leads_clinica.xlsx')
    
    print(f"🔍 Verificando arquivo: {target_file}")
    
    if not os.path.exists(target_file):
        target_file = os.path.join(base_dir, 'dados_entrada', 'leads.xlsx')

    try:
        df = pd.read_excel(target_file, header=0) # Ler com cabeçalho
        print("\n📋 Colunas Detectadas:")
        for i, col in enumerate(df.columns):
            print(f"   [{i}] '{col}' (Tipo: {type(col)})")
            
        # Simulação de Busca
        normalized_cols = [str(c).strip().lower() for c in df.columns]
        print(f"\n📋 Colunas Normalizadas: {normalized_cols}")
        
        col_temp = next((c for c in df.columns if str(c).strip().lower() in ['classificação', 'classificacao', 'temperatura', 'status', 'classification']), None)
        
        print(f"\n🌡️ Coluna de Temperatura Identificada: '{col_temp}'")
        
        if col_temp:
            print("\n🔬 Amostra da Coluna de Temperatura:")
            print(df[col_temp].head(10))
            
            print("\n🧪 Teste de Parse (Amostra):")
            temp_map = {'quente': 'Q', 'morno': 'M', 'frio': 'F', 'off': 'O'}
            for val in df[col_temp].head(10):
                raw = str(val).strip().lower()
                res = 'OFF'
                found = False
                for k in temp_map:
                    if k in raw:
                        res = k.upper()
                        found = True
                        break
                print(f"   '{val}' -> {res}")
        else:
            print("❌ Nenhuma coluna de temperatura encontrada pelos nomes padrão.")
            # Fallback índice 3
            if len(df.columns) > 3:
                print(f"⚠️ Usando fallback índice 3: '{df.columns[3]}'")
                print(df.iloc[:, 3].head(5))

    except Exception as e:
        print(f"❌ Erro: {e}")

if __name__ == "__main__":
    debug_excel()
