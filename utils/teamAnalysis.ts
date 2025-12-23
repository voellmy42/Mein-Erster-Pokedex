import { PokemonData } from '../types';
import { TYPES, getDefensiveWeaknesses, getOffensiveStrengths } from './typeChart';

export interface TeamAnalysis {
    weaknesses: Record<string, number>; // Type -> Count of team members weak to it
    coverage: Record<string, number>;   // Type -> Count of team members effective against it
    suggestions: string[];
}

export const calculateTeamSynergy = (team: PokemonData[]): TeamAnalysis => {
    const weaknesses: Record<string, number> = {};
    const coverage: Record<string, number> = {};

    TYPES.forEach(t => {
        weaknesses[t] = 0;
        coverage[t] = 0;
    });

    team.forEach(pokemon => {
        // Weaknesses
        const weakTypes = getDefensiveWeaknesses(pokemon.types);
        weakTypes.forEach(t => {
            weaknesses[t] = (weaknesses[t] || 0) + 1;
        });

        // Offensive Coverage
        const effectiveTypes = getOffensiveStrengths(pokemon.types);
        effectiveTypes.forEach(t => {
            coverage[t] = (coverage[t] || 0) + 1;
        });
    });

    return {
        weaknesses,
        coverage,
        suggestions: getSuggestions(team, weaknesses, coverage)
    };
};

const getSuggestions = (
    team: PokemonData[],
    weaknesses: Record<string, number>,
    coverage: Record<string, number>
): string[] => {
    if (team.length === 0) return ["Füge Pokemon hinzu, um eine Analyse zu erhalten."];

    const suggestions: string[] = [];
    const threshold = Math.ceil(team.length / 2); // e.g., if 3+ members are weak to something in a team of 6

    // 1. Check for Major Weaknesses
    const majorWeaknesses = Object.entries(weaknesses)
        .filter(([_, count]) => count >= 3)
        .map(([type]) => type);

    if (majorWeaknesses.length > 0) {
        suggestions.push(`Achtung: Dein Team ist sehr anfällig gegen ${majorWeaknesses.join(', ')}.`);
        suggestions.push(`Versuche, Pokemon hinzuzufügen, die resistent gegen ${majorWeaknesses.join('/')} sind.`);
    }

    // 2. Check for Missing Coverage
    const missingCoverage = Object.entries(coverage)
        .filter(([_, count]) => count === 0)
        .map(([type]) => type);

    if (missingCoverage.length > 0 && team.length >= 3) {
        // Only show a few random missing types to not overwhelm
        const showTypes = missingCoverage.slice(0, 3);
        suggestions.push(`Dir fehlt Offensive gegen: ${showTypes.join(', ')}.`);
    }

    // 3. Check for Type Redundancy
    const typeCounts: Record<string, number> = {};
    team.forEach(p => {
        p.types.forEach(t => typeCounts[t] = (typeCounts[t] || 0) + 1);
    });

    const duplicateTypes = Object.entries(typeCounts)
        .filter(([_, count]) => count >= 3)
        .map(([type]) => type);

    if (duplicateTypes.length > 0) {
        suggestions.push(`Du hast viele ${duplicateTypes.join('/')}-Pokemon. Mehr Vielfalt erhöht deine Chancen!`);
    }

    if (suggestions.length === 0 && team.length >= 4) {
        suggestions.push("Dein Team sieht sehr ausgewogen aus! Super!");
    }

    return suggestions;
};
