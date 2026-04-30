import { GoogleGenAI, Modality, ThinkingLevel, Type } from "@google/genai";

const callGeminiApi = async (action: string, params: any) => {
  const response = await fetch('/api/gemini', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, params })
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'API request failed');
  }
  return response.json();
};

// 1. Chat with Thinking Mode, Search, and Maps
export const chatWithGemini = async (messages: { role: string, parts: { text: string }[] }[], options: { 
  useThinking?: boolean, 
  useSearch?: boolean, 
  useMaps?: boolean,
  location?: { latitude: number, longitude: number }
} = {}) => {
  return callGeminiApi('chatWithGemini', { messages, options });
};

// 2. Image Generation
export const generateImage = async (prompt: string, options: { 
  model: "gemini-3-pro-image-preview" | "gemini-3.1-flash-image-preview",
  aspectRatio?: string,
  imageSize?: "1K" | "2K" | "4K"
}) => {
  return callGeminiApi('generateImage', { prompt, options });
};

// 3. Video Generation (Veo)
export const generateVideo = async (prompt: string, imageBase64?: string, options: {
  aspectRatio: "16:9" | "9:16"
} = { aspectRatio: "16:9" }) => {
  return callGeminiApi('generateVideo', { prompt, imageBase64, options });
};

// 4. Image/Video Analysis
export const analyzeMedia = async (prompt: string, mediaData: { data: string, mimeType: string }) => {
  return callGeminiApi('analyzeMedia', { prompt, mediaData });
};

// 5. Audio Transcription
export const transcribeAudio = async (audioBase64: string) => {
  return callGeminiApi('transcribeAudio', { audioBase64 });
};

// 6. Text to Speech
export const textToSpeech = async (text: string) => {
  return callGeminiApi('textToSpeech', { text });
};

// 7. Simulation Generation (P5.js)
export const generateSimulation = async (concept: string, imageBase64?: string) => {
  return callGeminiApi('generateSimulation', { concept, imageBase64 });
};
