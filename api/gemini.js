import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export default async function handler(req, res) {
  try {
    const { type, concept, prompt, image, mimeType } = req.body;

    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
    });

    // 👉 TEXT SIMULATION
    if (type === "simulation") {
      const fullPrompt = `
You are a physics simulation expert. Generate a P5.js simulation for: "${concept}"
${prompt ? `Additional instructions: ${prompt}` : ""}

Return ONLY a valid JSON object:
{
  "title": "",
  "description": "",
  "p5Code": ""
}
`;

      const result = await model.generateContent(fullPrompt);
      const text = result.response.text();

      const clean = text.replace(/```json|```/g, "").trim();

      return res.status(200).json(JSON.parse(clean));
    }

    // 👉 IMAGE ANALYSIS
    if (type === "image") {
      const result = await model.generateContent([
        {
          inlineData: {
            data: image,
            mimeType: mimeType,
          },
        },
        "Analyze this machine and explain physics behind it.",
      ]);

      return res.status(200).json({
        result: result.response.text(),
      });
    }

    return res.status(400).json({ error: "Invalid request type" });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: error.message || "Something went wrong",
    });
  }
}
