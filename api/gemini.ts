import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function generateSimulation(concept: string, prompt?: string) {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const fullPrompt = `
You are a physics simulation expert. Generate a P5.js simulation for: "${concept}"
${prompt ? `Additional instructions: ${prompt}` : ""}

Return ONLY a valid JSON object with this structure:
{
  "title": "simulation title",
  "description": "brief description",
  "p5Code": "complete p5.js code as string"
}
No extra text, only JSON.
`;

  const result = await model.generateContent(fullPrompt);
  const response = await result.response;
  const text = response.text();

  const clean = text.replace(/```json|```/g, "").trim();
  return JSON.parse(clean);
}

export async function analyzeImage(base64Image: string, mimeType: string) {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const result = await model.generateContent([
    {
      inlineData: {
        data: base64Image,
        mimeType: mimeType,
      },
    },
    "Analyze this machine/item and describe its physics principles for simulation.",
  ]);

  const response = await result.response;
  return response.text();
}
