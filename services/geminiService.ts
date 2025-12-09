import { GoogleGenAI, Type, Schema, Modality } from "@google/genai";
import { PokemonData } from "../types";

const genAI = new GoogleGenAI({ apiKey: process.env.API_KEY });

const pokemonSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    found: {
      type: Type.BOOLEAN,
      description: "Set to true if a valid Pokemon is identified or searched for. False if the image is not a Pokemon or the name is invalid.",
    },
    id: {
      type: Type.INTEGER,
      description: "National Pokedex ID number",
    },
    name: {
      type: Type.STRING,
      description: "English name of the Pokemon",
    },
    germanName: {
      type: Type.STRING,
      description: "German name of the Pokemon (e.g., 'Glurak' for Charizard)",
    },
    category: {
      type: Type.STRING,
      description: "The category of the Pokemon in German (e.g., 'Echsen-Pokémon' for Charmander). Keep it short.",
    },
    types: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "List of types in German (e.g., 'Feuer', 'Flug').",
    },
    description: {
      type: Type.STRING,
      description: "A comprehensive Pokedex entry description in German, similar to a PokeWiki entry. Limit to 2 sentences.",
    },
    height: {
      type: Type.STRING,
      description: "Height in meters (e.g., '1.7 m')",
    },
    weight: {
      type: Type.STRING,
      description: "Weight in kilograms (e.g., '90.5 kg')",
    },
    abilities: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "List of abilities (Fähigkeiten) in German. Limit to the 2 most common ones.",
    },
    locations: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Where to find this Pokemon in the latest games (Gen 9 if possible). E.g., 'Karmesin: Südliche Zone 1', 'Schwert: Route 4'. Limit to 2 entries.",
    },
    stats: {
      type: Type.OBJECT,
      properties: {
        hp: { type: Type.INTEGER },
        attack: { type: Type.INTEGER },
        defense: { type: Type.INTEGER },
        spAttack: { type: Type.INTEGER },
        spDefense: { type: Type.INTEGER },
        speed: { type: Type.INTEGER },
      },
      required: ["hp", "attack", "defense", "spAttack", "spDefense", "speed"],
    },
    evolutionChain: {
      type: Type.ARRAY,
      items: { 
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING, description: "English name" },
          germanName: { type: Type.STRING, description: "German name" },
          id: { type: Type.INTEGER, description: "National Pokedex ID" },
          condition: { type: Type.STRING, description: "Short condition to evolve TO this stage from the previous one (in German). E.g. 'Lvl 16', 'Feuerstein', 'Tausch'. Leave empty for the first stage." }
        },
        required: ["name", "germanName", "id"]
      },
      description: "List of evolution stages (full chain) including their English name, German name, ID, and evolution condition.",
    },
  },
  required: ["found", "id", "name", "germanName", "category", "types", "description", "height", "weight", "abilities", "locations", "stats", "evolutionChain"],
};

export const identifyPokemon = async (imageBase64: string): Promise<PokemonData | null> => {
  try {
    const response = await genAI.models.generateContent({
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
            text: "Identify this Pokemon. Provide detailed Pokedex data in German. If it is a Pokemon card, extract the details of the Pokemon on the card.",
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: pokemonSchema,
        systemInstruction: "You are a Pokedex expert with knowledge from PokeWiki.de. You only speak German.",
      },
    });

    const result = JSON.parse(response.text || "{}");
    
    if (!result.found) {
      return null;
    }

    return result as PokemonData;
  } catch (error) {
    console.error("Error identifying pokemon:", error);
    throw error;
  }
};

export const searchPokemonByName = async (name: string): Promise<PokemonData | null> => {
  try {
    const response = await genAI.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Search for data on the Pokemon "${name}". Provide detailed Pokedex data in German.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: pokemonSchema,
        systemInstruction: "You are a Pokedex expert with knowledge from PokeWiki.de. You only speak German.",
      },
    });

    const result = JSON.parse(response.text || "{}");

    if (!result.found) {
      return null;
    }

    return result as PokemonData;
  } catch (error) {
    console.error("Error searching pokemon:", error);
    throw error;
  }
};

export const generatePokedexSpeech = async (text: string): Promise<string | undefined> => {
  try {
    const response = await genAI.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: {
        parts: [{ text: text }],
      },
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Fenrir' }, // Fenrir is a deeper male voice
          },
        },
      },
    });

    // The audio data is in the inlineData of the first part
    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  } catch (error) {
    console.error("Error generating speech:", error);
    throw error;
  }
};