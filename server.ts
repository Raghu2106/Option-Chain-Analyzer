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
