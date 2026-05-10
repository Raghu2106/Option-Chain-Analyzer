import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import axios from "axios";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // API routes
  app.get("/api/price/:symbol", async (req, res) => {
    const { symbol } = req.params;
    const normalizedSymbol = symbol.toUpperCase().trim().replace(/\s+/g, '');
    
    let yahooSymbol = normalizedSymbol;
    if (normalizedSymbol === "NIFTY") yahooSymbol = "^NSEI";
    else if (normalizedSymbol === "BANKNIFTY") yahooSymbol = "^NSEBANK";
    else if (normalizedSymbol === "FINNIFTY") yahooSymbol = "^CNXFIN";
    else if (normalizedSymbol === "MIDCPNIFTY") yahooSymbol = "^NIFTYMDCP100";
    else if (normalizedSymbol === "NIFTYIT") yahooSymbol = "^CNXIT";
    else if (!yahooSymbol.includes(".") && !yahooSymbol.startsWith("^")) yahooSymbol = `${yahooSymbol}.NS`;

    try {
      const cacheBuster = Date.now();
      console.log(`[Price-API] Fetching ${normalizedSymbol} as ${yahooSymbol}`);
      
      // Try charts endpoint first as it has more data but can be restricted
      try {
        const response = await axios.get(`https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}`, {
          params: {
            interval: '1m',
            range: '1d',
            includePrePost: 'false',
            useYf: 'true',
            _cb: cacheBuster
          },
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
            'Accept': 'application/json',
            'Referer': 'https://finance.yahoo.com/quote/' + yahooSymbol,
            'Origin': 'https://finance.yahoo.com'
          },
          timeout: 8000
        });

        const result = response.data?.chart?.result?.[0];
        if (result?.meta?.regularMarketPrice) {
          const price = result.meta.regularMarketPrice;
          const instrument = result.meta.symbol;
          console.log(`[Price-API] Success (Chart): ${instrument} = ${price}`);
          res.json({ price, instrument, timestamp: Date.now(), success: true });
          return;
        }
      } catch (chartErr) {
        console.warn(`[Price-API] Chart endpoint failed for ${yahooSymbol}, trying Quote...`);
      }

      // Fallback to Quote endpoint (v7) which is often more reliable for current price
      const quoteResponse = await axios.get(`https://query1.finance.yahoo.com/v7/finance/quote`, {
        params: {
          symbols: yahooSymbol,
          _cb: cacheBuster
        },
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          'Accept': 'application/json',
          'Referer': 'https://finance.yahoo.com/quote/' + yahooSymbol,
          'Origin': 'https://finance.yahoo.com'
        },
        timeout: 8000
      });

      const quote = quoteResponse.data?.quoteResponse?.result?.[0];
      
      if (!quote) {
        throw new Error(`No data found for ${yahooSymbol} on Yahoo Finance`);
      }

      const price = quote.regularMarketPrice;
      const instrument = quote.symbol;
      
      console.log(`[Price-API] Success (Quote): ${instrument} = ${price}`);
      res.json({ price, instrument, timestamp: Date.now(), success: true });
    } catch (error: any) {
      const status = error.response?.status || 500;
      const message = error.response?.data?.chart?.error?.description || error.message;
      console.error(`[Price-API] Error ${status} for ${symbol}:`, message);
      res.status(status).json({ 
        error: "Failed to fetch price", 
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
