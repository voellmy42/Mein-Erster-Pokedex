import { useState } from 'react';
import { PokemonData } from '../types';
import { identifyPokemon } from '../services/geminiService';
import { getPokemonDetails, getIdFromGermanName } from '../services/pokeApiService';

export const usePokemon = () => {
    const [currentPokemon, setCurrentPokemon] = useState<PokemonData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const loadPokemon = async (idOrName: string | number) => {
        setLoading(true);
        setError(null);
        try {
            let id: number | null = typeof idOrName === 'number' ? idOrName : null;

            if (id === null && typeof idOrName === 'string') {
                const input = idOrName.trim();
                // 1. Try German Name mapping
                id = getIdFromGermanName(input);

                // 2. If not found, try to fetch from API directly (handles English names or IDs as strings)
                if (!id) {
                    try {
                        // We use a lightweight fetch to get the ID if it's a valid English name
                        const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${input.toLowerCase()}`);
                        if (res.ok) {
                            const data = await res.json();
                            id = data.id;
                        }
                    } catch (e) {
                        // Ignore, proceed to error
                    }
                }
            }

            if (id) {
                const data = await getPokemonDetails(id);
                if (data) {
                    setCurrentPokemon(data);
                } else {
                    setError("Daten konnten nicht geladen werden.");
                }
            } else {
                setError(`Kein Pokémon mit dem Namen "${idOrName}" gefunden.`);
            }
        } catch (err) {
            console.error(err);
            setError("Verbindungsfehler.");
        } finally {
            setLoading(false);
        }
    };

    const identifyAndLoad = async (base64Image: string) => {
        setLoading(true);
        setError(null);
        try {
            const result = await identifyPokemon(base64Image);
            if (result.found && (result.name || result.id)) {
                // Prefer ID if Gemini gives it, otherwise try name
                if (result.id) {
                    await loadPokemon(result.id);
                } else if (result.name) {
                    await loadPokemon(result.name);
                }
            } else {
                setError("Kein Pokémon erkannt. Versuch es nochmal!");
                setLoading(false);
            }
        } catch (err) {
            setError("Fehler bei der Analyse.");
            setLoading(false);
        }
    };

    const resetPokemon = () => {
        setCurrentPokemon(null);
        setError(null);
    };

    return {
        currentPokemon,
        loading,
        error,
        loadPokemon,
        identifyAndLoad,
        resetPokemon,
        setCurrentPokemon // Exposed for history loading
    };
};
