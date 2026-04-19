import { GoogleGenAI, Type } from "@google/genai";
import { DeconstructionResult } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function deconstructDish(imageBase64: string, mimeType: string): Promise<DeconstructionResult> {
  const model = "gemini-3-flash-preview";
  
  const response = await ai.models.generateContent({
    model,
    contents: [
      {
        parts: [
          {
            text: `Analyze this food image and deconstruct it into its primary ingredients. 
            Provide the name, a brief description, an appropriate emoji, and an optional Chinese name for each ingredient.
            Also, assign a layerIndex to each ingredient to represent its order in an 'exploded view' (bottom to top). 
            Layer 0 should be the finished dish itself.
            Return the result as a JSON object.`
          },
          {
            inlineData: {
              data: imageBase64,
              mimeType: mimeType
            }
          }
        ]
      }
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          dishName: { type: Type.STRING },
          dishDescription: { type: Type.STRING },
          ingredients: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                chineseName: { type: Type.STRING },
                description: { type: Type.STRING },
                emoji: { type: Type.STRING },
                layerIndex: { type: Type.NUMBER }
              },
              required: ["name", "description", "emoji", "layerIndex"]
            }
          }
        },
        required: ["dishName", "dishDescription", "ingredients"]
      }
    }
  });

  const text = response.text;
  if (!text) throw new Error("Failed to get response from AI");
  
  return JSON.parse(text) as DeconstructionResult;
}

export async function generateExplodedView(dishName: string, ingredients: any[]): Promise<string> {
  const model = "gemini-2.5-flash-image";
  
  const ingredientString = ingredients
    .filter(i => i.layerIndex > 0)
    .map(i => i.name)
    .join(", ");
    
  const prompt = `Create a high-quality commercial food photography style image. 
  The composition is an "exploded view" or "deconstructed" view of a ${dishName}. 
  The ingredients are shown floating and stacked vertically in mid-air against a solid black background.
  The stack includes: ${ingredientString}.
  At the bottom, more central, is the finished bowl or plate of ${dishName}.
  Dynamic, sharp focus, professional studio lighting, realistic textures.
  IMPORTANT: Do NOT include any text, labels, or names in the image. The focus should be purely on the visual deconstruction of the food components.`;

  const response = await ai.models.generateContent({
    model,
    contents: [{ parts: [{ text: prompt }] }],
    config: {
      imageConfig: {
        aspectRatio: "9:16",
      }
    }
  });

  let imageUrl = "";
  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) {
      imageUrl = `data:image/png;base64,${part.inlineData.data}`;
      break;
    }
  }

  if (!imageUrl) throw new Error("Failed to generate image");
  return imageUrl;
}
