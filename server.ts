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
    else if (!symbol.includes(".") && !symbol.startsWith("^")) yahooSymbol = `${symbol}.NS`;

    try {
      const response = await axios.get(`https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}`);
      const result = response.data.chart.result[0];
      const price = result.meta.regularMarketPrice;
      const instrument = result.meta.symbol;
      
      res.json({ price, instrument, timestamp: Date.now() });
    } catch (error) {
      console.error(`Error fetching price for ${symbol}:`, error);
      res.status(500).json({ error: "Failed to fetch price" });
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
