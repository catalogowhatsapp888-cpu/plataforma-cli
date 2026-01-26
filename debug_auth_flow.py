import requests
from jose import jwt

BASE_URL = "http://127.0.0.1:8000/api/v1"
EMAIL = "eduschefer@icloud.com"
PASS = "123456"

def debug_flow():
    print(f"1. Attempting Login with {EMAIL}...")
    try:
        resp = requests.post(f"{BASE_URL}/auth/login/access-token", 
                             data={"username": EMAIL, "password": PASS, "grant_type": "password"})
        
        if resp.status_code != 200:
            print(f"❌ Login Failed: {resp.status_code} - {resp.text}")
            return
            
        data = resp.json()
        token = data.get("access_token")
        print(f"✅ Login Success. Token: {token[:20]}...")
        
        # Decode check
        try:
            decoded = jwt.get_unverified_claims(token)
            print(f"🔍 Decoded Token: {decoded}")
        except Exception as e:
            print(f"⚠️ Failed to decode (client side check): {e}")

        # 2. Test Protected Endpoint
        print("\n2. Testing Protected Endpoint (/users/)...")
        headers = {"Authorization": f"Bearer {token}"}
        resp2 = requests.get(f"{BASE_URL}/users/", headers=headers)
        
        if resp2.status_code == 200:
            print(f"✅ Protected Access Success! Users: {len(resp2.json())}")
        else:
            print(f"❌ Protected Access Failed: {resp2.status_code} - {resp2.text}")
            
    except Exception as e:
        print(f"❌ Exception: {e}")

if __name__ == "__main__":
    debug_flow()
