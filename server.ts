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
    let yahooSymbol = symbol;

    // Map common index names to Yahoo Finance symbols
    if (symbol === "NIFTY") yahooSymbol = "^NSEI";
    else if (symbol === "BANKNIFTY") yahooSymbol = "^NSEBANK";
    else if (symbol === "FINNIFTY") yahooSymbol = "NIFTY_FIN_SERVICE.NS";
    else if (symbol === "MIDCPNIFTY") yahooSymbol = "NIFTY_MID_SELECT.NS";
    else if (symbol === "NIFTYIT") yahooSymbol = "^CNXIT";
    else if (!symbol.includes(".") && !symbol.startsWith("^")) yahooSymbol = `${symbol}.NS`;

    try {
      console.log(`[API] Fetching price for ${symbol} using Yahoo symbol: ${yahooSymbol}`);
      const response = await axios.get(`https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });
      const result = response.data.chart.result[0];
      if (!result) {
        throw new Error("No data found for symbol");
      }
      const price = result.meta.regularMarketPrice;
      const instrument = result.meta.symbol;
      
      res.json({ price, instrument, timestamp: Date.now() });
    } catch (error: any) {
      console.error(`Error fetching price for ${symbol} (Yahoo: ${yahooSymbol}):`, error.message);
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
