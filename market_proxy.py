from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import requests
import json

try:
    from dhanhq import dhanhq
except ImportError:
    dhanhq = None

try:
    from NorenRestApiPy.NorenApi import NorenApi
except ImportError:
    NorenApi = None

app = FastAPI(title="Options Visualizer Data Proxy")

# Enable CORS for your React app
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dhan/Shoonya Credentials (Optional)
# If provided, the proxy will prioritize these over Yahoo/MC
DHAN_CLIENT_ID = ""
DHAN_ACCESS_TOKEN = ""

SHOONYA_USER_ID = ""
SHOONYA_PASSWORD = ""
SHOONYA_API_KEY = ""
SHOONYA_IMEI = ""

@app.get("/health")
def health():
    status = {
        "status": "active",
        "dhan_supported": dhanhq is not None,
        "shoonya_supported": NorenApi is not None
    }
    return status

@app.get("/price/{symbol}")
def get_price(symbol: str):
    symbol = symbol.upper()

    # Priority 1: Shoonya (Finvasia) - Very popular for zero brokerage algos
    if NorenApi and SHOONYA_API_KEY:
        try:
            # Login and fetch logic would go here
            # price = ...
            # return {"success": True, "price": price, "source": "Shoonya-Live"}
            pass
        except Exception:
            pass

    # Priority 2: DhanHQ
    if dhanhq and DHAN_ACCESS_TOKEN:
        try:
            # dhan = dhanhq(DHAN_CLIENT_ID, DHAN_ACCESS_TOKEN)
            # price = ... 
            # return {"success": True, "price": price, "source": "Dhan-Live"}
            pass
        except Exception:
            pass

    # Priority 3: Yahoo Finance (Symbol mapping for Nifty is ^NSEI)
    """
    Fetch real-time price using Yahoo Finance or MoneyControl logic.
    When deployed in AWS Mumbai, this acts as an Indian IP exit node.
    """
    symbol = symbol.upper()
    
    # 1. Try Yahoo Finance (Symbol mapping for Nifty is ^NSEI)
    if symbol in ["NIFTY", "NIFTY50"]:
        yt_symbol = "%5ENSEI"
    elif symbol == "BANKNIFTY":
        yt_symbol = "%5ENSEBANK"
    else:
        yt_symbol = f"{symbol}.NS"

    try:
        url = f"https://query1.finance.yahoo.com/v8/finance/chart/{yt_symbol}?interval=1m&range=1d"
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
        }
        res = requests.get(url, headers=headers, timeout=5)
        data = res.json()
        price = data['chart']['result'][0]['meta']['regularMarketPrice']
        return {
            "success": True,
            "symbol": symbol,
            "price": price,
            "source": "Yahoo-Mumbai-Proxy"
        }
    except Exception as e:
        print(f"Yahoo failed in proxy: {e}")

    # 2. Fallback to MoneyControl (Stealth Attempt)
    try:
        # Nifty 50 ID is usually 9
        mc_id = "9" if symbol in ["NIFTY", "NIFTY50"] else ""
        if mc_id:
            url = "https://www.moneycontrol.com/mc/widget/indian-indices/get_values"
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
                'Referer': 'https://www.moneycontrol.com/'
            }
            # This endpoint is tricky, but when coming from an Indian IP (AWS Mumbai), it's much more stable
            res = requests.get(url, headers=headers, timeout=5)
            # Note: Mc usually returns a structured string or JSON
            # Parsing logic would go here depending on the specific MC widget response
            pass

    except Exception as e:
        print(f"MC failed in proxy: {e}")

    raise HTTPException(status_code=404, detail="Could not fetch price from any proxy source")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
