import pandas as pd
import os

def debug_excel():
    base_dir = os.path.dirname(__file__)
    target_file = os.path.join(base_dir, 'planilhas leads', 'Leads_clinica.xlsx')
    
    print(f"🔍 Verificando arquivo: {target_file}")
    
    if not os.path.exists(target_file):
        print("❌ Arquivo não encontrado!")
        # Fallback
        target_file = os.path.join(base_dir, 'dados_entrada', 'leads.xlsx')
        print(f"🔍 Tentando fallback: {target_file}")
        if not os.path.exists(target_file):
            print("❌ Arquivo de fallback também não encontrado.")
            return

    try:
        df = pd.read_excel(target_file, header=None)
        print("\n📊 Primeiras 10 linhas da planilha (Raw):")
        print(df.head(10))
        
        print("\n🧪 Análise da Coluna C (Índice 2):")
        if len(df.columns) > 2:
            print(df[2].head(10))
            
            # Teste do Parser
            print("\n🔬 Teste do Parser de Temperatura:")
            temp_map = {
                'quente': 'quente', 'hot': 'quente', '🔥': 'quente',
                'morno': 'morno', 'warm': 'morno', '☁️': 'morno',
                'frio': 'frio', 'cold': 'frio', '❄️': 'frio',
                'off': 'off', 'cancelado': 'off', '🚫': 'off'
            }
            
            for i, val in enumerate(df[2].head(10)):
                raw = str(val).strip().lower()
                final = 'frio (default)'
                for k, v in temp_map.items():
                    if k in raw:
                        final = v
                        break
                print(f"   Linha {i}: '{val}' -> {final}")
        else:
            print("⚠️ A planilha tem menos de 3 colunas! O sistema assume 'frio' por padrão.")

    except Exception as e:
        print(f"❌ Erro ao ler Excel: {e}")

if __name__ == "__main__":
    debug_excel()
