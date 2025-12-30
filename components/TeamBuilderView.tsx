import React, { useState } from 'react';
import { PokemonData } from '../types';
import { useTeam } from '../hooks/useTeam';
import { TeamSlot } from './TeamSlot';
import { TeamAnalysisResult } from './TeamAnalysisResult';
import { getSuggestions } from '../utils/pokemonNames';
import { usePokemon } from '../hooks/usePokemon';
import { getPokemonDetails } from '../services/pokeApiService';
import { analyzeTeam, TeamAnalysisResult as LLMTeamAnalysis } from '../services/geminiService';

import { useProgress } from '../hooks/useProgress';

interface TeamBuilderViewProps {
    onBack: () => void;
}

export const TeamBuilderView: React.FC<TeamBuilderViewProps> = ({ onBack }) => {
    const { team, addPokemon, removePokemon } = useTeam();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { loadPokemon } = usePokemon();

    // Search State
    const [isSearching, setIsSearching] = useState(false);
    const [isLoading, setIsLoading] = useState(false); // For adding pokemon
    const [isAnalyzing, setIsAnalyzing] = useState(false); // For LLM analysis
    const [searchQuery, setSearchQuery] = useState("");
    const [suggestions, setSuggestions] = useState<{ name: string, id: number }[]>([]);

    // Analysis State
    const [analysisResult, setAnalysisResult] = useState<LLMTeamAnalysis | null>(null);
    const { progress, start: startProgress, complete: completeProgress, stop: stopProgress } = useProgress();

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setSearchQuery(value);
        if (value.length >= 2) {
            setSuggestions(getSuggestions(value));
        } else {
            setSuggestions([]);
        }
    };

    const handleSelectPokemon = async (name: string, id: number) => {
        setIsSearching(false);
        setSearchQuery("");
        setSuggestions([]);
        setIsLoading(true);
        // Reset analysis when team changes
        setAnalysisResult(null);
        stopProgress();

        try {
            const pokemonData = await getPokemonDetails(id);
            if (pokemonData) {
                addPokemon(pokemonData);
            } else {
                alert("Fehler: Konnte Pokemon-Daten nicht laden.");
            }
        } catch (e) {
            console.error("Failed to add pokemon", e);
            alert("Ein unerwarteter Fehler ist aufgetreten.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleRemovePokemon = (id: number) => {
        removePokemon(id);
        setAnalysisResult(null);
        stopProgress();
    };

    const handleAnalyze = async () => {
        if (team.length === 0) return;
        setIsAnalyzing(true);
        startProgress();
        try {
            const result = await analyzeTeam(team);
            setAnalysisResult(result);
            completeProgress();
        } catch (e) {
            console.error("Analysis failed", e);
            alert("Analyse fehlgeschlagen. Bitte versuche es später erneut.");
            stopProgress();
        } finally {
            setIsAnalyzing(false);
        }
    };

    return (
        <>
            <div className="space-y-6 pb-20 animate-slide-up">

                {/* Header */}
                <div className="bg-white/80 backdrop-blur-md p-4 rounded-3xl shadow-sm border border-white flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-black text-gray-800 flex items-center gap-2">
                            Team Planer
                            {isLoading && <div className="w-5 h-5 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>}
                        </h2>
                        <p className="text-sm text-gray-500 font-bold">{team.length} / 6 Pokemon</p>
                    </div>
                </div>

                <div className="absolute top-4 right-4 z-10">
                    <button
                        onClick={onBack}
                        className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 hover:bg-red-50 hover:text-red-500 transition-colors shadow-sm border border-white"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                {/* Team Grid */}
                <div className="grid grid-cols-3 gap-3 px-2 pt-12">
                </div>
            </div>

            {/* Main Content */}
            <div className="space-y-6 pb-20 animate-slide-up">
                {/* Header Copy for Alignment */}
                <div className="bg-white/80 backdrop-blur-md p-4 rounded-3xl shadow-sm border border-white flex items-center justify-between invisible h-0 p-0 overflow-hidden">
                    {/* Ghost element to maintain flow if needed, or just remove if styling allows. Using simple standard flow below. */}
                </div>

                {/* Team Grid */}
                <div className="grid grid-cols-3 gap-3 px-2">
                    {Array.from({ length: 6 }).map((_, index) => {
                        const poke = team[index];
                        return (
                            <TeamSlot
                                key={index}
                                pokemon={poke || null}
                                onRemove={() => poke && handleRemovePokemon(poke.id)}
                                onAdd={() => setIsSearching(true)}
                            />
                        );
                    })}
                </div>

                {/* Analysis Action */}
                <div className="px-2">
                    <button
                        onClick={handleAnalyze}
                        disabled={team.length === 0 || isAnalyzing}
                        className={`w-full py-4 rounded-2xl font-black text-lg uppercase tracking-wider shadow-lg flex items-center justify-center gap-3 transition-all relative overflow-hidden ${team.length === 0
                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            : isAnalyzing
                                ? 'bg-indigo-400 text-white cursor-wait'
                                : 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:shadow-xl hover:-translate-y-1 active:scale-95'
                            }`}
                    >
                        {/* Progress Bar Background */}
                        {isAnalyzing && (
                            <div
                                className="absolute left-0 top-0 bottom-0 bg-white/20 transition-all duration-200 ease-out"
                                style={{ width: `${progress}%` }}
                            />
                        )}

                        {isAnalyzing ? (
                            <>
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <span className="relative z-10">Analysiere... {progress}%</span>
                            </>
                        ) : (
                            <>
                                <span className="text-2xl">✨</span>
                                Team Analysieren
                            </>
                        )}
                    </button>
                </div>

                {/* Analysis Result */}
                {(analysisResult || isAnalyzing) && (
                    <TeamAnalysisResult analysis={analysisResult} />
                )}
            </div>

            {/* Search Modal Overlay */}
            {isSearching && (
                <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-start justify-center pt-24 px-4 animate-fade-in" onClick={() => setIsSearching(false)}>
                    <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden animate-slide-up" onClick={e => e.stopPropagation()}>
                        <div className="p-4 border-b border-gray-100 bg-gray-50">
                            <h3 className="font-black text-gray-800 mb-2">Pokemon hinzufügen</h3>
                            <input
                                autoFocus
                                type="text"
                                placeholder="Name eingeben..."
                                value={searchQuery}
                                onChange={handleSearchChange}
                                className="w-full bg-white border-2 border-gray-200 rounded-xl px-4 py-3 font-bold text-gray-700 focus:border-blue-500 focus:outline-none placeholder-gray-300"
                            />
                        </div>
                        <div className="max-h-60 overflow-y-auto p-2">
                            {suggestions.map((s) => (
                                <button
                                    key={s.id}
                                    onClick={() => handleSelectPokemon(s.name, s.id)}
                                    className="w-full flex items-center gap-3 p-3 hover:bg-blue-50 rounded-xl transition-colors text-left group"
                                >
                                    <img
                                        src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${s.id}.png`}
                                        className="w-10 h-10 object-contain bg-white rounded-lg border border-gray-200 group-hover:border-blue-200"
                                        alt={s.name}
                                    />
                                    <span className="font-bold text-gray-700 group-hover:text-blue-700">{s.name}</span>
                                </button>
                            ))}
                            {suggestions.length === 0 && searchQuery.length > 1 && (
                                <p className="text-center text-gray-400 py-4 font-bold text-sm">Keine Treffer</p>
                            )}
                        </div>
                        <div className="p-3 border-t border-gray-100">
                            <button
                                onClick={() => setIsSearching(false)}
                                className="w-full py-3 text-red-500 font-bold hover:bg-red-50 rounded-xl transition-colors"
                            >
                                Abbrechen
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};
