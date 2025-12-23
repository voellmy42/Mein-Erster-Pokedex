import { useState, useEffect, useCallback } from 'react';
import { PokemonData } from '../types';

export const useTeam = () => {
    const [team, setTeam] = useState<PokemonData[]>([]);

    useEffect(() => {
        const savedTeam = localStorage.getItem('pokedex_team');
        if (savedTeam) {
            try {
                setTeam(JSON.parse(savedTeam));
            } catch (e) {
                console.error("Failed to parse team from local storage", e);
            }
        }
    }, []);

    const saveTeam = (newTeam: PokemonData[]) => {
        localStorage.setItem('pokedex_team', JSON.stringify(newTeam));
        setTeam(newTeam);
    };

    const addPokemon = useCallback((pokemon: PokemonData) => {
        setTeam(prev => {
            if (prev.length >= 6) return prev;
            if (prev.some(p => p.id === pokemon.id)) return prev;
            const newTeam = [...prev, pokemon];
            saveTeam(newTeam);
            return newTeam;
        });
    }, []);

    const removePokemon = useCallback((pokemonId: number) => {
        setTeam(prev => {
            const newTeam = prev.filter(p => p.id !== pokemonId);
            saveTeam(newTeam);
            return newTeam;
        });
    }, []);

    const isInTeam = useCallback((pokemonId: number) => {
        return team.some(p => p.id === pokemonId);
    }, [team]);

    const clearTeam = useCallback(() => {
        saveTeam([]);
    }, []);

    return {
        team,
        addPokemon,
        removePokemon,
        isInTeam,
        clearTeam
    };
};
