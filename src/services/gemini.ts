import { GoogleGenAI, Modality, ThinkingLevel, Type } from "@google/genai";

const getAI = () => new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

// 1. Chat with Thinking Mode, Search, and Maps
export const chatWithGemini = async (messages: { role: string, parts: { text: string }[] }[], options: { 
  useThinking?: boolean, 
  useSearch?: boolean, 
  useMaps?: boolean,
  location?: { latitude: number, longitude: number }
} = {}) => {
  const ai = getAI();
  
  // Maps grounding is only supported in Gemini 2.5 series models.
  let model = options.useThinking ? "gemini-3.1-pro-preview" : "gemini-3.1-flash-lite-preview";
  if (options.useMaps) {
    model = "gemini-2.5-flash";
  }
  
  const tools: any[] = [];
  if (options.useSearch) tools.push({ googleSearch: {} });
  if (options.useMaps) tools.push({ googleMaps: {} });

  const config: any = {
    tools: tools.length > 0 ? tools : undefined,
  };

  if (options.useThinking) {
    config.thinkingConfig = { thinkingLevel: ThinkingLevel.HIGH };
  }

  if (options.useMaps && options.location) {
    config.toolConfig = {
      retrievalConfig: {
        latLng: options.location
      }
    };
  }

  const response = await ai.models.generateContent({
    model,
    contents: messages,
    config
  });

  return {
    text: response.text,
    grounding: response.candidates?.[0]?.groundingMetadata?.groundingChunks
  };
};

// 2. Image Generation (Nano Banana Pro & 2)
export const generateImage = async (prompt: string, options: { 
  model: "gemini-3-pro-image-preview" | "gemini-3.1-flash-image-preview",
  aspectRatio?: string,
  imageSize?: "1K" | "2K" | "4K"
}) => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: options.model,
    contents: [{ parts: [{ text: prompt }] }],
    config: {
      imageConfig: {
        aspectRatio: options.aspectRatio as any || "1:1",
        imageSize: options.imageSize
      }
    }
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  throw new Error("No image generated");
};

// 3. Video Generation (Veo)
export const generateVideo = async (prompt: string, imageBase64?: string, options: {
  aspectRatio: "16:9" | "9:16"
} = { aspectRatio: "16:9" }) => {
  const ai = getAI();
  const payload: any = {
    model: 'veo-3.1-fast-generate-preview',
    prompt,
    config: {
      numberOfVideos: 1,
      resolution: '720p',
      aspectRatio: options.aspectRatio
    }
  };

  if (imageBase64) {
    payload.image = {
      imageBytes: imageBase64.split(',')[1],
      mimeType: 'image/png'
    };
  }

  let operation = await ai.models.generateVideos(payload);

  while (!operation.done) {
    await new Promise(resolve => setTimeout(resolve, 5000));
    operation = await ai.operations.getVideosOperation({ operation });
  }

  return operation.response?.generatedVideos?.[0]?.video?.uri;
};

// 4. Image/Video Analysis
export const analyzeMedia = async (prompt: string, mediaData: { data: string, mimeType: string }) => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: [{
      parts: [
        { inlineData: { data: mediaData.data.split(',')[1], mimeType: mediaData.mimeType } },
        { text: prompt }
      ]
    }]
  });
  return response.text;
};

// 5. Audio Transcription
export const transcribeAudio = async (audioBase64: string) => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [{
      parts: [
        { inlineData: { data: audioBase64.split(',')[1], mimeType: 'audio/wav' } },
        { text: "Transcribe this audio exactly." }
      ]
    }]
  });
  return response.text;
};

// 6. Text to Speech
export const textToSpeech = async (text: string) => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: 'Kore' }
        }
      }
    }
  });

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  return base64Audio ? `data:audio/wav;base64,${base64Audio}` : null;
};

// 7. Simulation Generation (P5.js)
export const generateSimulation = async (concept: string, imageBase64?: string) => {
  const ai = getAI();
  const systemInstruction = `
You are an expert P5.js developer. Your task is to generate a real-time, interactive visual simulation of a scientific or physical concept.

If an image is provided, analyze the image (e.g., a machine, an item, a diagram) to understand its mechanics, components, and how it works. Then generate a P5.js simulation that demonstrates those mechanics. If no specific concept text is provided, please include a "// Title: [Name of Machine/Item]" comment at the very top of your code.

OUTPUT RULES:
1. Output ONLY valid, self-executing JavaScript for P5.js.
2. Do NOT use markdown code blocks (no \`\`\`javascript).
3. The code must include setup() and draw() functions.
4. You MUST expose interactive variables using this exact format at the top of the script:
   // @control Slider(min, max, default) var variableName = value;
   Example: // @control Slider(0, 100, 50) var speed = 50;
5. The simulation should be visually appealing and educational.
6. Use window.innerWidth and window.innerHeight for createCanvas if appropriate, but ensure it handles resizing or fits the container.
7. IMPORTANT: The code will be injected into a sandbox. Listen for messages to update variables:
   window.addEventListener('message', (event) => {
     if (event.data.type === 'UPDATE_VARIABLE') {
       window[event.data.name] = event.data.value;
     }
   });
   This means your variables MUST be global (defined with 'var' or attached to 'window') so they can be updated by the listener. Use 'var' for all variables that need to be controlled.
`;

  const parts: any[] = [{ text: `Generate a P5.js simulation for: ${concept || "the mechanism shown in the image"}` }];
  if (imageBase64) {
    parts.unshift({
      inlineData: {
        data: imageBase64.split(',')[1],
        mimeType: 'image/png'
      }
    });
  }

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [{ role: 'user', parts }],
    config: {
      systemInstruction,
      temperature: 0.7,
    },
  });

  const text = response.text;
  if (!text) throw new Error("AI failed to generate a response");

  // If no concept was provided, try to extract a title from the generation or provide a default
  let finalConcept = concept;
  if (!finalConcept && imageBase64) {
    // Basic extraction: look for a title in a comment or just use "Visual Analysis"
    const titleMatch = text.match(/\/\/\s*Title:\s*(.*)/i);
    finalConcept = titleMatch ? titleMatch[1].trim() : "Visual Analysis Simulation";
  }

  // More robust code extraction: find the first javascript or js code block, or fall back to the whole text
  let cleanCode = text;
  const codeBlockRegex = /```(?:javascript|js)?\n([\s\S]*?)```/;
  const matchCode = text.match(codeBlockRegex);
  if (matchCode && matchCode[1]) {
    cleanCode = matchCode[1].trim();
  } else {
    // Fallback: strip any remaining markdown-like markers if no block found
    cleanCode = text.replace(/^```javascript\n?/, '').replace(/^```js\n?/, '').replace(/```$/, '').trim();
  }
  
  // Parse control variables using regex
  const controlRegex = /\/\/\s*@control\s+Slider\(([^,]+),\s*([^,]+),\s*([^)]+)\)\s+(?:var|let|const)\s+(\w+)\s*=\s*([^;]+);/g;
  const controls = [];
  let match;

  while ((match = controlRegex.exec(cleanCode)) !== null) {
    controls.push({
      min: parseFloat(match[1]),
      max: parseFloat(match[2]),
      default: parseFloat(match[3]),
      name: match[4],
      value: parseFloat(match[5]),
    });
  }

  return { code: cleanCode, controls, concept: finalConcept };
};
