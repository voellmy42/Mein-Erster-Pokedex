import { GoogleGenAI, Type, Schema } from "@google/genai";
import { PokemonData } from "../types";
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

// Team Analysis Schema
const teamAnalysisSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    score: {
      type: Type.INTEGER,
      description: "A rating of the team composition from 1 to 10.",
    },
    summary: {
      type: Type.STRING,
      description: "A short, qualitative summary of the team's balance and strategy (in German).",
    },
    strengths: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          type: { type: Type.STRING, description: "The Pokemon Type related to this strength (e.g. 'Feuer')." },
          reason: { type: Type.STRING, description: "Explanation of the strength (in German)." },
        },
        required: ["type", "reason"],
      },
    },
    weaknesses: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          type: { type: Type.STRING, description: "The Pokemon Type related to this weakness (e.g. 'Wasser')." },
          reason: { type: Type.STRING, description: "Explanation of the weakness (in German)." },
        },
        required: ["type", "reason"],
        weaknesses: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              type: { type: Type.STRING, description: "The Pokemon Type related to this weakness (e.g. 'Wasser')." },
              reason: { type: Type.STRING, description: "Explanation of the weakness (in German)." },
            },
            required: ["type", "reason"],
          },
        },
        suggestion: {
          type: Type.OBJECT,
          description: "A concrete suggestion to improve the team by swapping a Pokemon.",
          properties: {
            out: { type: Type.STRING, description: "Name of the Pokemon to remove (from the current team)." },
            in: { type: Type.STRING, description: "Name of a Pokemon to add (that is NOT in the team)." },
            reason: { type: Type.STRING, description: "Reason for this swap (in German)." },
          },
          required: ["out", "in", "reason"],
        },
      },
      required: ["score", "summary", "strengths", "weaknesses", "suggestion"],
    };

    export interface TeamAnalysisResult {
      score: number;
summary: string;
strengths: { type: string; reason: string } [];
weaknesses: { type: string; reason: string } [];
suggestion: { out: string; in: string; reason: string };
}

export interface IdentificationResult {
  found: boolean;
  name?: string;
  id?: number;
}

export const identifyPokemon = async (imageBase64: string): Promise<IdentificationResult> => {
  try {
    const ai = getGenAI();
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
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

export const analyzeTeam = async (team: PokemonData[]): Promise<TeamAnalysisResult> => {
  try {
    const ai = getGenAI();

    const teamDescription = team.map(p =>
      `- ${p.germanName} (Typen: ${p.types.join(", ")}, Stats: HP ${p.stats.hp}/ATK ${p.stats.attack}/DEF ${p.stats.defense}/SPE ${p.stats.speed})`
    ).join("\n");

    const prompt = `
      Analysiere dieses Pokemon Team kompetitiv und strategisch.
      Berücksichtige Typen-Abdeckung (Offensiv & Defensiv), Stats und generelle Synergie.
      
      Team:
      ${teamDescription}
      
      Analysiere dieses Pokemon Team kompetitiv und strategisch.
      Berücksichtige Typen-Abdeckung (Offensiv & Defensiv), Stats und generelle Synergie.
      Gib EINEN konkreten Vorschlag (Suggestion), welches Pokemon (out) gegen welches andere Pokemon (in) getauscht werden sollte, um das Team signifikant zu verbessern.
      
      Team:
      ${teamDescription}
      
      Antworte im JSON Format gemäß Schema.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [{ text: prompt }],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: teamAnalysisSchema,
      },
    });

    const result = JSON.parse(response.text || "{}");
    return result as TeamAnalysisResult;
  } catch (error) {
    console.error("Error analyzing team:", error);
    throw error;
  }
};