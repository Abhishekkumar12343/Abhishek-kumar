import { Request, Response } from "express";
import * as gemini from "./lib/gemini";
import cors from "cors";

// Vercel serverless function entry point
export default async function handler(req: any, res: any) {
  // Simple CORS for Vercel
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

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

    res.status(200).json(result);
  } catch (error: any) {
    console.error('Gemini API Error:', error);
    res.status(500).json({ error: error.message });
  }
}
