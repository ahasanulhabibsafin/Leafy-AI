import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // PlantNet Proxy to avoid CORS issues
  app.post("/api/identify", async (req, res) => {
    try {
      const { image, organs } = req.body;
      const API_KEY = process.env.VITE_PLANTNET_API_KEY;

      if (!API_KEY) {
        return res.status(500).json({ error: "PlantNet API key not configured on server" });
      }

      // Convert base64 to buffer for fetch
      const base64Data = image.split(",")[1];
      const buffer = Buffer.from(base64Data, 'base64');
      
      const formData = new FormData();
      // In Node.js environment, we can use Blob from 'buffer' or global
      const blob = new Blob([buffer], { type: 'image/jpeg' });
      formData.append('images', blob, 'image.jpg');
      formData.append('organs', organs || 'auto');

      const url = `https://my-api.plantnet.org/v2/identify/all?api-key=${API_KEY}`;
      const response = await fetch(url, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("PlantNet API error:", response.status, errorText);
        return res.status(response.status).send(errorText);
      }

      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("Proxy error:", error);
      res.status(500).json({ error: "Failed to proxy request to PlantNet" });
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
