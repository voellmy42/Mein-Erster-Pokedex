import { GoogleGenAI, Type, Schema } from "@google/genai";
import { Modality } from "@google/genai";

// Lazy initialization
let genAI: GoogleGenAI | null = null;

const getGenAI = () => {
  if (!genAI) {
    const apiKey = process.env.API_KEY || (import.meta.env && import.meta.env.VITE_GEMINI_API_KEY);
    if (!apiKey) {
      console.error("Gemini API Key is missing!");
      throw new Error("Gemini API Key is missing.");
    }
    genAI = new GoogleGenAI({ apiKey });
  }
  return genAI;
};

// Simplified Schema - We only need the name/ID to look it up in PokeAPI
const identificationSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    found: {
      type: Type.BOOLEAN,
      description: "True if a Pokemon is identified in the image.",
    },
    name: {
      type: Type.STRING,
      description: "The name of the identified Pokemon (preferably in English, but German is ok as we will normalize it).",
    },
    id: {
      type: Type.INTEGER,
      description: "National Pokedex ID if visible or known.",
    },
  },
  required: ["found"],
};

export interface IdentificationResult {
  found: boolean;
  name?: string;
  id?: number;
}

export const identifyPokemon = async (imageBase64: string): Promise<IdentificationResult> => {
  try {
    const ai = getGenAI();
    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: imageBase64,
            },
          },
          {
            text: "Identify this Pokemon. Return its name and ID.",
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: identificationSchema,
      },
    });

    const result = JSON.parse(response.text || "{}");
    return result as IdentificationResult;
  } catch (error) {
    console.error("Error identifying pokemon:", error);
    throw error;
  }
};

export const generatePokedexSpeech = async (text: string): Promise<string | undefined> => {
  try {
    const ai = getGenAI();
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts", // Kept simple for now
      contents: {
        parts: [{ text: text }],
      },
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Fenrir' },
          },
        },
      },
    });

    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  } catch (error) {
    console.error("Error generating speech:", error);
    throw error;
  }
};