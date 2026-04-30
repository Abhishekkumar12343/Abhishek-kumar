import express from "express";
import cors from "cors";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import * as gemini from "../server/gemini";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json({ limit: '10mb' }));

  // Gemini API Proxy
  app.post("/api/gemini", async (req, res) => {
    try {
      const { action, params } = req.body;
      let result;

      switch (action) {
        case 'chatWithGemini':
          result = await gemini.chatWithGemini(params.messages, params.options);
          break;
        case 'generateImage':
          result = await gemini.generateImage(params.prompt, params.options);
          break;
        case 'generateVideo':
          result = await gemini.generateVideo(params.prompt, params.imageBase64, params.options);
          break;
        case 'analyzeMedia':
          result = await gemini.analyzeMedia(params.prompt, params.mediaData);
          break;
        case 'transcribeAudio':
          result = await gemini.transcribeAudio(params.audioBase64);
          break;
        case 'textToSpeech':
          result = await gemini.textToSpeech(params.text);
          break;
        case 'generateSimulation':
          result = await gemini.generateSimulation(params.concept, params.imageBase64);
          break;
        default:
          return res.status(400).json({ error: 'Unknown action' });
      }

      res.json(result);
    } catch (error: any) {
      console.error('Gemini API Error:', error);
      res.status(500).json({ error: error.message });
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
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // Export app for Vercel
  if (process.env.NODE_ENV !== "production") {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  }
  
  return app;
}

const appPromise = startServer();
export default async (req: express.Request, res: express.Response) => {
  const app = await appPromise;
  return app(req, res);
};
