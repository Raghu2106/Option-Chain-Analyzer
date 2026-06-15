import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // API routes
  let cachedCsv: string | null = null;
  let lastFetchTime = 0;
  const CACHE_DURATION_MS = 15000; // 15 seconds

  app.get("/api/live-data", async (req, res) => {
    const now = Date.now();
    
    // If we have cached data and it's fresh, return it immediately
    if (cachedCsv && (now - lastFetchTime < CACHE_DURATION_MS)) {
      return res.type("text/plain").send(cachedCsv);
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000); // 12 seconds server timeout

      const response = await fetch(
        `https://docs.google.com/spreadsheets/d/e/2PACX-1vTA7we5_ncvlBlEr4KyFryQxQjFvFJvSOQqXf3LVYyVMzGFpfjkk6P3plCBiUHhml6VCRAkXogedRNs/pub?output=csv&t=${now}`,
        { 
          signal: controller.signal,
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "text/csv,text/plain,*/*"
          }
        }
      );
      
      clearTimeout(timeoutId);

      if (response.ok) {
        const csvText = await response.text();
        if (csvText && csvText.length > 10) {
          cachedCsv = csvText;
          lastFetchTime = now;
          return res.type("text/plain").send(csvText);
        }
      }
      
      throw new Error(`Failed to fetch from Google Sheets: ${response.status}`);
    } catch (error) {
      console.error("Error proxying live-data, checking cache representation:", error);
      // If we have cached data, fallback to it smoothly
      if (cachedCsv) {
        console.log("Serving stale cached CSV data from memory");
        return res.type("text/plain").send(cachedCsv);
      }
      return res.status(504).json({ error: "Gateway Timeout: Could not retrieve live data" });
    }
  });

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
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

    // Custom middleware to enforce clean URLs (no trailing slashes) for SEO and Google Search Console,
    // explicitly redirecting trailing-slash requests to prevent redirect confusion and duplicate content
    app.use((req, res, next) => {
      const origPath = req.path;

      // If path ends with a slash and is not root, 301 redirect to the non-trailing-slash counterpart
      if (origPath.endsWith('/') && origPath !== '/') {
        const cleanPath = origPath.slice(0, -1);
        const queryString = req.url.slice(origPath.length);
        const redirectUrl = cleanPath + queryString;
        
        console.log(`[SEO Redirect] 301: ${req.url} -> ${redirectUrl}`);
        res.set("Cache-Control", "public, max-age=31536000"); // Standard SEO caching for redirections
        return res.redirect(301, redirectUrl);
      }

      // Serve pre-rendered SEO files directly for clean URLs
      if (origPath !== '/') {
        const potentialFile = path.join(distPath, origPath, 'index.html');
        if (fs.existsSync(potentialFile)) {
          return res.sendFile(potentialFile);
        }
      }
      next();
    });

    app.use(express.static(distPath, { redirect: false }));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
