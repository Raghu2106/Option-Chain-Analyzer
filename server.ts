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
      
      const fetchFromYahoo = async (baseUrl: string, endpoint: string) => {
        const url = `${baseUrl}/v8/finance/chart/${yahooSymbol}`;
        const response = await axios.get(url, {
          params: {
            interval: '1m',
            range: '1d',
            includePrePost: 'false',
            useYf: 'true',
            _cb: cacheBuster
          },
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
            'Accept': 'application/json, text/plain, */*',
            'Accept-Language': 'en-US,en;q=0.9',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
            'Referer': 'https://finance.yahoo.com/quote/' + yahooSymbol,
            'Origin': 'https://finance.yahoo.com',
            'Sec-Fetch-Dest': 'empty',
            'Sec-Fetch-Mode': 'cors',
            'Sec-Fetch-Site': 'same-site'
          },
          timeout: 10000
        });
        return response.data;
      };

      const fetchQuoteFromYahoo = async (baseUrl: string) => {
        const url = `${baseUrl}/v7/finance/quote`;
        const response = await axios.get(url, {
          params: {
            symbols: yahooSymbol,
            _cb: cacheBuster
          },
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
            'Accept': 'application/json',
            'Referer': 'https://finance.yahoo.com/quote/' + yahooSymbol
          },
          timeout: 10000
        });
        return response.data;
      };

      // Attempt sequence:
      // 1. Query2 Chart
      // 2. Query1 Chart
      // 3. Query2 Quote
      // 4. Query1 Quote

      let data: any = null;
      let method = "";

      try {
        data = await fetchFromYahoo('https://query2.finance.yahoo.com', 'chart');
        method = "Chart-Q2";
      } catch (e) {
        try {
          data = await fetchFromYahoo('https://query1.finance.yahoo.com', 'chart');
          method = "Chart-Q1";
        } catch (e2) {
          try {
            data = await fetchQuoteFromYahoo('https://query2.finance.yahoo.com');
            method = "Quote-Q2";
          } catch (e3) {
            data = await fetchQuoteFromYahoo('https://query1.finance.yahoo.com');
            method = "Quote-Q1";
          }
        }
      }

      if (method.startsWith("Chart")) {
        const result = data?.chart?.result?.[0];
        if (result?.meta?.regularMarketPrice) {
          const price = result.meta.regularMarketPrice;
          const instrument = result.meta.symbol;
          console.log(`[Price-API] Success (${method}): ${instrument} = ${price}`);
          res.json({ price, instrument, timestamp: Date.now(), success: true });
          return;
        }
      } else if (method.startsWith("Quote")) {
        const quote = data?.quoteResponse?.result?.[0];
        if (quote?.regularMarketPrice) {
          const price = quote.regularMarketPrice;
          const instrument = quote.symbol;
          console.log(`[Price-API] Success (${method}): ${instrument} = ${price}`);
          res.json({ price, instrument, timestamp: Date.now(), success: true });
          return;
        }
      }

      throw new Error(`No valid price data found for ${yahooSymbol} after multiple attempts`);
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
