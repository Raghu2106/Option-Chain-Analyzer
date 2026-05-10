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
    else if (normalizedSymbol === "FINNIFTY") yahooSymbol = "NIFTY_FIN_SERVICE.NS";
    else if (normalizedSymbol === "MIDCPNIFTY") yahooSymbol = "NIFTY_MID_SELECT.NS";
    else if (normalizedSymbol === "NIFTYIT") yahooSymbol = "^CNXIT";
    else if (!yahooSymbol.includes(".") && !yahooSymbol.startsWith("^")) yahooSymbol = `${yahooSymbol}.NS`;

    try {
      console.log(`[Price-API] Attempting ${normalizedSymbol} as ${yahooSymbol}`);
      
      const response = await axios.get(`https://query2.finance.yahoo.com/v8/finance/chart/${yahooSymbol}`, {
        params: {
          interval: '1m',
          range: '1d'
        },
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'application/json'
        },
        timeout: 5000
      });

      const result = response.data?.chart?.result?.[0];
      
      if (!result?.meta) {
        throw new Error("No metadata in Yahoo response");
      }

      const price = result.meta.regularMarketPrice;
      const instrument = result.meta.symbol;
      
      console.log(`[Price-API] Success: ${instrument} = ${price}`);
      res.json({ price, instrument, timestamp: Date.now(), success: true });
    } catch (error: any) {
      console.error(`[Price-API] Error for ${symbol}:`, error.message);
      res.status(500).json({ error: "Failed to fetch price", message: error.message });
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
