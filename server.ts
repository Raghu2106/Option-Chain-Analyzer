import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import axios from "axios";
import "dotenv/config";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Simple in-memory cache to mitigate 429 errors from Yahoo
  const priceCache: Record<string, { price: number, timestamp: number }> = {};
  const CACHE_TTL = 15000; // 15 seconds cache to avoid hitting rate limits too hard

  // API routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // New Centralized Price Logic
  app.get("/api/live-price", async (req, res) => {
    const symbol = String(req.query.symbol || "NIFTY").toUpperCase();
    const normalizedSymbol = symbol.trim().replace(/\s+/g, '');
    
    // 1. Check Cache
    const cached = priceCache[normalizedSymbol];
    if (cached && Date.now() - cached.timestamp < 10000) {
      return res.json({ success: true, price: cached.price, source: 'Cache' });
    }

    // 2. High Priority: Google Apps Script Proxy (Bypass for Cloud IP Blocking)
    const GAS_URL = process.env.GAS_PROXY_URL;
    if (GAS_URL) {
      try {
        console.log(`[Live-Price] Routing ${normalizedSymbol} through GAS Proxy...`);
        const gasRes = await axios.get(`${GAS_URL}?symbol=${normalizedSymbol}`, { timeout: 6000 });
        if (gasRes.data?.success) {
          const price = gasRes.data.price;
          priceCache[normalizedSymbol] = { price, timestamp: Date.now() };
          return res.json({ success: true, price, source: gasRes.data.source || 'GAS Proxy' });
        }
      } catch (e: any) {
        console.warn(`[Live-Price] GAS Proxy failed: ${e.message}`);
      }
    }

    // 3. Medium Priority: Python Proxy if configured
    const PROXY_URL = process.env.MARKET_PROXY_URL;
    if (PROXY_URL) {
      try {
        const proxyRes = await axios.get(`${PROXY_URL}/price/${normalizedSymbol}`, { timeout: 4000 });
        if (proxyRes.data?.success) {
          const price = proxyRes.data.price;
          priceCache[normalizedSymbol] = { price, timestamp: Date.now() };
          return res.json({ success: true, price, source: proxyRes.data.source || 'Proxy' });
        }
      } catch (e) {
        console.warn(`[Live-Price] Proxy check failed for ${normalizedSymbol}`);
      }
    }

    // Internal Helper for TradingView (High Priority)
    async function tryTradingView(sym: string) {
      const tickerMap: Record<string, string> = { 
        "NIFTY": "NSE:NIFTY", 
        "NIFTY50": "NSE:NIFTY", 
        "BANKNIFTY": "NSE:BANKNIFTY" 
      };
      
      const ticker = tickerMap[sym] || `NSE:${sym}`;
      const url = 'https://scanner.tradingview.com/india/scan';
      
      const payload = {
          "symbols": { "tickers": [ticker], "query": { "types": [] } },
          "columns": ["close"]
      };

      const response = await axios.post(url, payload, {
          headers: { 'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0' },
          timeout: 4000
      });
      
      if (response.data?.data?.[0]?.d?.[0]) {
        return parseFloat(response.data.data[0].d[0]);
      }
      return null;
    }

    // Internal Helper for MC
    async function tryMC(sym: string) {
      const indexMap: Record<string, string> = { "NIFTY": "in%3BNSX", "NIFTY50": "in%3BNSX", "BANKNIFTY": "in%3BNBK" };
      const url = indexMap[sym] ? 
        `https://priceapi.moneycontrol.com/pricefeed/nse/indices/${indexMap[sym]}` : 
        `https://priceapi.moneycontrol.com/pricefeed/nse/stock_inventory/${sym}`;
      
      const response = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 3000 });
      const data = response.data?.data;
      const priceStr = data?.lastprice || data?.price;
      if (priceStr) return parseFloat(String(priceStr).replace(/,/g, ''));
      return null;
    }

    // Internal Helper for Yahoo
    async function tryYahoo(sym: string) {
      const symbolMap: Record<string, string> = { "NIFTY": "^NSEI", "BANKNIFTY": "^NSEBANK" };
      const ySym = symbolMap[sym] || `${sym}.NS`;
      const response = await axios.get(`https://query1.finance.yahoo.com/v8/finance/chart/${ySym}?interval=1m&range=1d`, { timeout: 3000 });
      return response.data?.chart?.result?.[0]?.meta?.regularMarketPrice;
    }

    try {
      // 1. Primary: TradingView
      const tvPrice = await tryTradingView(normalizedSymbol).catch(() => null);
      if (tvPrice) {
        priceCache[normalizedSymbol] = { price: tvPrice, timestamp: Date.now() };
        return res.json({ success: true, price: tvPrice, source: 'TradingView' });
      }

      // 2. Secondary: MC
      const mcPrice = await tryMC(normalizedSymbol).catch(() => null);
      if (mcPrice) {
        priceCache[normalizedSymbol] = { price: mcPrice, timestamp: Date.now() };
        return res.json({ success: true, price: mcPrice, source: 'MoneyControl' });
      }

      // 3. Tertiary: Yahoo
      const yahooPrice = await tryYahoo(normalizedSymbol).catch(() => null);
      if (yahooPrice) {
        priceCache[normalizedSymbol] = { price: yahooPrice, timestamp: Date.now() };
        return res.json({ success: true, price: yahooPrice, source: 'Yahoo Finance' });
      }

      res.status(404).json({ success: false, error: "Price not found" });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.get("/api/price-mc/:symbol", async (req, res) => {
    const { symbol } = req.params;
    const normalizedSymbol = symbol.toUpperCase().trim().replace(/\s+/g, '');

    // Mapping for MoneyControl
    const indexMap: Record<string, string> = {
      "NIFTY": "in%3BNSX",
      "NIFTY50": "in%3BNSX",
      "BANKNIFTY": "in%3BNBK",
      "FINNIFTY": "in%3BNFS",
      "MIDCPNIFTY": "in%3BNMS",
      "NIFTYIT": "in%3BNIT"
    };

    const stockMap: Record<string, string> = {
      "RELIANCE": "RELIANCE",
      "HDFCBANK": "HDF01",
      "ICICIBANK": "ICI02",
      "INFY": "INF04",
      "TCS": "TCS"
    };

    try {
      let url = "";
      let isIndex = !!indexMap[normalizedSymbol];
      
      if (isIndex) {
        url = `https://priceapi.moneycontrol.com/pricefeed/nse/indices/${indexMap[normalizedSymbol]}`;
      } else {
        const mcStockId = stockMap[normalizedSymbol] || normalizedSymbol;
        url = `https://priceapi.moneycontrol.com/pricefeed/nse/stock_inventory/${mcStockId}`;
      }

      console.log(`[Price-MC] Attempting fetch for ${normalizedSymbol} via ${url}`);
      
      // Attempt 1: Specific endpoint
      try {
        const response = await axios.get(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
          },
          timeout: 3000
        });

        if (response.data?.data) {
          const data = response.data.data;
          const priceStr = data.lastprice || data.price || data.price_200days;
          if (priceStr) {
            const price = parseFloat(String(priceStr).replace(/,/g, ''));
            if (!isNaN(price) && price > 0) {
              priceCache[normalizedSymbol] = { price, timestamp: Date.now() };
              return res.json({ success: true, price, symbol: normalizedSymbol, source: 'MoneyControl' });
            }
          }
        }
      } catch (e) {
        console.warn(`[Price-MC] Primary attempt failed for ${normalizedSymbol}`);
      }

      // Attempt 2: "Notlisted" fallback for stocks
      if (!isIndex) {
         try {
           const altUrl = `https://priceapi.moneycontrol.com/pricefeed/notlisted/stockprice/${normalizedSymbol}`;
           const altRes = await axios.get(altUrl, { timeout: 3000 });
           if (altRes.data?.data?.lastprice) {
              const price = parseFloat(altRes.data.data.lastprice.replace(/,/g, ''));
              if (!isNaN(price) && price > 0) {
                 priceCache[normalizedSymbol] = { price, timestamp: Date.now() };
                 return res.json({ success: true, price, symbol: normalizedSymbol, source: 'MoneyControl-Alt' });
              }
           }
         } catch (e) {}
      }

      // If we are here, MoneyControl failed or returned no data
      res.json({ success: false, error: "Price data not found in MoneyControl" });
    } catch (error: any) {
      console.error(`[Price-MC] Error for ${symbol}:`, error.message);
      res.json({ success: false, error: error.message });
    }
  });

  app.get("/api/price/:symbol", async (req, res) => {
    const { symbol } = req.params;
    const normalizedSymbol = symbol.toUpperCase().trim().replace(/\s+/g, '');
    
    // Check cache first
    const cached = priceCache[normalizedSymbol];
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      console.log(`[Price-API] Serving from cache: ${normalizedSymbol} = ${cached.price}`);
      return res.json({ 
        price: cached.price, 
        instrument: normalizedSymbol, 
        timestamp: cached.timestamp, 
        success: true,
        cached: true 
      });
    }

    // Improved Mapping for common NSE symbols to Yahoo Finance
    const symbolMap: Record<string, string> = {
      "NIFTY": "^NSEI",
      "BANKNIFTY": "^NSEBANK",
      "FINNIFTY": "NIFTY_FIN_SERVICE.NS",
      "MIDCPNIFTY": "NIFTY_MID_SELECT.NS",
      "NIFTYIT": "^CNXIT",
      "RELIANCE": "RELIANCE.NS",
      "HDFCBANK": "HDFCBANK.NS",
      "ICICIBANK": "ICICIBANK.NS",
      "INFY": "INFY.NS",
      "TCS": "TCS.NS"
    };

    let yahooSymbol = symbolMap[normalizedSymbol] || normalizedSymbol;
    if (!yahooSymbol.includes(".") && !yahooSymbol.startsWith("^")) {
      yahooSymbol = `${yahooSymbol}.NS`;
    }

    try {
      const cacheBuster = Math.floor(Math.random() * 1000000);
      console.log(`[Price-API] Attempting fetch for ${normalizedSymbol} (mapped: ${yahooSymbol})`);
      
      const response = await axios.get(`https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}`, {
        params: {
          interval: '1m',
          range: '1d',
          includePrePost: 'false',
          _cb: cacheBuster
        },
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          'Cache-Control': 'no-cache',
          'Prerender-Mode': 'no-render'
        },
        timeout: 10000
      });

      const result = response.data?.chart?.result?.[0];
      
      if (!result?.meta) {
        throw new Error(`Invalid response format for ${yahooSymbol}`);
      }

      let price = result.meta.regularMarketPrice;
      
      if (price === undefined || price === null) {
        // Try to get the latest close from indicators if regularMarketPrice is missing
        const quotes = result.indicators?.quote?.[0];
        const lastPrice = quotes?.close?.filter((c: any) => c !== null).pop();
        if (lastPrice) {
          price = lastPrice;
        } else {
          throw new Error(`Price not available for ${yahooSymbol}`);
        }
      }

      // Update cache
      priceCache[normalizedSymbol] = { price, timestamp: Date.now() };
      
      console.log(`[Price-API] Success: ${yahooSymbol} = ${price}`);
      res.json({ price, instrument: yahooSymbol, timestamp: Date.now(), success: true });
      
    } catch (error: any) {
      const status = error.response?.status || 500;
      const message = error.response?.data?.chart?.error?.description || error.message;
      console.error(`[Price-API] Error ${status} for ${symbol}:`, message);
      
      // If we have a stale cache, serve it on error
      if (priceCache[normalizedSymbol]) {
        console.log(`[Price-API] Serving potentially STALE cache due to error: ${normalizedSymbol}`);
        return res.json({ 
          price: priceCache[normalizedSymbol].price, 
          instrument: normalizedSymbol, 
          timestamp: priceCache[normalizedSymbol].timestamp, 
          success: true,
          stale: true,
          error: message
        });
      }

      // Return a 200 with error info so client can handle it gracefully
      res.status(200).json({ 
        success: false,
        error: "Fetch failed", 
        message,
        symbol: symbol,
        mapped: yahooSymbol
      });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
