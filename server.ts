import express from "express";
import { createServer as createViteServer } from "vite";
import fetch from "node-fetch";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

// API routes go here
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// Proxy for NewsCatcher API
app.get("/api/news", async (req, res) => {
  const apiKey = process.env.VITE_NEWSCATCHER_API_KEY;
  
  if (!apiKey) {
    console.error("Server Error: Missing VITE_NEWSCATCHER_API_KEY in environment variables");
    return res.status(500).json({ error: "Server Configuration Error: Missing API Key" });
  }

  const query = req.query;
  // Remove any undefined or null values from query
  Object.keys(query).forEach(key => query[key] === undefined && delete query[key]);
  
  const urlParams = new URLSearchParams(query as any);
  // Use v3 endpoint
  const targetUrl = `https://v3-api.newscatcherapi.com/api/search?${urlParams.toString()}`;

  console.log(`Proxying request to: ${targetUrl}`);

  try {
    // Use node-fetch explicitly
    const response = await fetch(targetUrl, {
      headers: {
        // v3 uses x-api-token
        'x-api-token': apiKey,
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("NewsCatcher API Error:", response.status, errorText);
      return res.status(response.status).json({ 
        error: "Upstream API Error", 
        details: errorText,
        status: response.status 
      });
    }

    const data = await response.json();
    res.json(data);
  } catch (error: any) {
    console.error("NewsCatcher Proxy Network Error:", error);
    res.status(500).json({ 
      error: "Internal Proxy Error", 
      message: error.message,
      stack: error.stack
    });
  }
});

// Vite middleware setup
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // In production, serve static files from dist
    app.use(express.static("dist"));
    // Fallback for SPA
    app.get("*", (_req, res) => {
      res.sendFile("index.html", { root: "dist" });
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`API Key configured: ${!!process.env.VITE_NEWSCATCHER_API_KEY}`);
  });
}

startServer();
