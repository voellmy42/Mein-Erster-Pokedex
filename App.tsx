import React, { useState, useMemo, useEffect } from 'react';
import { PokemonData } from './types';
import { LoadingOverlay } from './components/LoadingOverlay';
import { TypeBadge, getTypeColor } from './components/TypeBadge';
import { CameraView } from './components/CameraView';
import { DetailView } from './components/DetailView';
import { TeamBuilderView } from './components/TeamBuilderView';
import { TYPES, getTypeDetails } from './utils/typeChart';
import { getSuggestions, PokemonSuggestion } from './utils/pokemonNames';
import { usePokemon } from './hooks/usePokemon';
import { getPokemonList } from './services/pokeApiService';

enum AppState {
    HOME,
    CAMERA,
    DETAIL,
    TYPE_MATRIX,
    POKEDEX_LIST,
    TEAM_BUILDER
}

export default function App() {
    const [appState, setAppState] = useState<AppState>(AppState.HOME);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [history, setHistory] = useState<PokemonData[]>([]);
    const [suggestions, setSuggestions] = useState<PokemonSuggestion[]>([]);
    const [isShiny, setIsShiny] = useState(false);

    // State for Type Matrix Accordion
    const [expandedType, setExpandedType] = useState<string | null>(null);

    // State for Pokedex List
    const [pokedexList, setPokedexList] = useState<{ name: string, id: number }[]>([]);
    const [listOffset, setListOffset] = useState(0);
    const [isLoadingList, setIsLoadingList] = useState(false);

    // Custom Hooks
    const { currentPokemon, loading: isLoading, error, loadPokemon, identifyAndLoad, resetPokemon, setCurrentPokemon } = usePokemon();

    // Load History on Mount
    useEffect(() => {
        const saved = localStorage.getItem('pokedex_history');
        if (saved) {
            try {
                setHistory(JSON.parse(saved));
            } catch (e) {
                console.error("Failed to parse history", e);
            }
        }
    }, []);

    // Update History when pokemon changes
    useEffect(() => {
        if (currentPokemon) {
            setHistory(prev => {
                const filtered = prev.filter(p => p.id !== currentPokemon.id);
                const newHistory = [currentPokemon, ...filtered].slice(0, 10);
                localStorage.setItem('pokedex_history', JSON.stringify(newHistory));
                return newHistory;
            });
            setAppState(AppState.DETAIL);
        }
    }, [currentPokemon]);

    // Determine Background Gradient based on Pokemon Type
    const backgroundGradient = useMemo(() => {
        if (appState === AppState.DETAIL && currentPokemon) {
            const type = currentPokemon.types[0]?.toLowerCase() || '';
            if (type.includes('feuer')) return "from-orange-200 via-red-100 to-yellow-100";
            if (type.includes('wasser')) return "from-blue-200 via-cyan-100 to-sky-100";
            if (type.includes('pflanze')) return "from-green-200 via-emerald-100 to-lime-100";
            if (type.includes('elektro')) return "from-yellow-200 via-amber-100 to-orange-100";
            if (type.includes('eis')) return "from-cyan-100 via-blue-50 to-white";
            if (type.includes('kampf')) return "from-orange-200 via-red-100 to-stone-200";
            if (type.includes('gift')) return "from-purple-200 via-fuchsia-100 to-pink-100";
            if (type.includes('boden')) return "from-yellow-200 via-orange-100 to-stone-200";
            if (type.includes('flug')) return "from-sky-200 via-blue-100 to-indigo-100";
            if (type.includes('psycho')) return "from-pink-200 via-rose-100 to-fuchsia-100";
            if (type.includes('käfer')) return "from-lime-200 via-green-100 to-yellow-100";
            if (type.includes('gestein')) return "from-stone-300 via-neutral-200 to-yellow-100";
            if (type.includes('geist')) return "from-indigo-300 via-purple-200 to-slate-200";
            if (type.includes('drache')) return "from-violet-300 via-indigo-200 to-purple-200";
            if (type.includes('unlicht')) return "from-gray-400 via-slate-300 to-zinc-300";
            if (type.includes('stahl')) return "from-slate-300 via-gray-200 to-zinc-100";
            if (type.includes('fee')) return "from-pink-200 via-rose-100 to-red-50";
            if (type.includes('normal')) return "from-stone-200 via-gray-100 to-neutral-100";
        }
        // Default
        return "from-indigo-100 via-purple-50 to-blue-100";
    }, [appState, currentPokemon]);

    // Load Pokedex List initially if empty
    const loadMorePokemon = async () => {
        setIsLoadingList(true);
        try {
            const newPokemon = await getPokemonList(listOffset, 20);
            setPokedexList(prev => [...prev, ...newPokemon]);
            setListOffset(prev => prev + 20);
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoadingList(false);
        }
    };

    const openPokedexList = () => {
        setAppState(AppState.POKEDEX_LIST);
        if (pokedexList.length === 0) {
            loadMorePokemon();
        }
    };

    const loadFromHistory = (pokemon: PokemonData) => {
        setCapturedImage(null);
        setIsShiny(false);
        setCurrentPokemon(pokemon); // This triggers the useEffect to set state
    };

    const handleCapture = async (base64Image: string) => {
        setCapturedImage(`data:image/jpeg;base64,${base64Image}`);
        setAppState(AppState.HOME); // Close camera view while loading
        setIsShiny(false);
        await identifyAndLoad(base64Image);
    };

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setSearchQuery(value);
        if (value.length >= 2) {
            setSuggestions(getSuggestions(value));
        } else {
            setSuggestions([]);
        }
    };

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchQuery.trim()) return;
        setCapturedImage(null);
        setIsShiny(false);
        setSuggestions([]);

        await loadPokemon(searchQuery);
    };

    const handleSelectSuggestion = (suggestion: PokemonSuggestion) => {
        setSearchQuery(suggestion.name);
        setSuggestions([]);
        setCapturedImage(null);
        setIsShiny(false);
        loadPokemon(suggestion.name);
    };

    const resetHome = () => {
        resetPokemon();
        setAppState(AppState.HOME);
        setSearchQuery("");
        setSuggestions([]);
        setIsShiny(false);
    };

    const handleSelectPokemonEx = (name: string) => {
        setCapturedImage(null);
        setIsShiny(false);
        loadPokemon(name);
    };

    return (
        // Use 100dvh for mobile browsers to avoid issues with address bar
        <div className={`h-[100dvh] w-full bg-gradient-to-br ${backgroundGradient} animate-gradient-xy flex justify-center selection:bg-red-200 transition-colors duration-1000 ease-in-out`}>
            <div className="w-full max-w-lg bg-white/40 backdrop-blur-xl shadow-2xl relative flex flex-col h-full overflow-hidden">

                {/* === HEADER (Slim Design with Safe Area Support) === */}
                <header className="bg-gradient-to-b from-red-600 to-red-700 pt-[max(12px,env(safe-area-inset-top))] pb-3 px-4 shadow-md relative z-20 shrink-0">
                    <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none"></div>

                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 border-[2px] border-white/80 shadow-md relative flex items-center justify-center overflow-hidden animate-sensor-pulse shrink-0">
                                <div className="absolute top-1 left-2 w-4 h-3 rounded-[100%] bg-white/40 blur-[1px] transform -rotate-12"></div>
                            </div>

                            {appState === AppState.HOME ? (
                                <h1
                                    onClick={resetHome}
                                    className="text-white font-black text-xl tracking-tight drop-shadow-md cursor-pointer truncate"
                                >
                                    Dein Pokedex
                                </h1>
                            ) : (
                                <button
                                    onClick={resetHome}
                                    className="text-red-700 bg-white hover:bg-red-50 font-black text-xs uppercase tracking-wider px-4 py-2 rounded-xl shadow-sm transition-colors border-2 border-red-50 active:scale-95 flex items-center gap-1"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" /></svg>
                                    Zurück
                                </button>
                            )}
                        </div>

                        <div className="flex gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-full bg-red-500 border border-red-800/50 shadow-inner"></div>
                            <div className="w-2.5 h-2.5 rounded-full bg-yellow-400 border border-yellow-600/50 shadow-inner"></div>
                            <div className="w-2.5 h-2.5 rounded-full bg-green-500 border border-green-700/50 shadow-inner"></div>
                        </div>
                    </div>
                </header>

                {/* === MAIN CONTENT (Expanded Space) === */}
                <main className="flex-1 overflow-y-auto overflow-x-hidden relative z-10 scroll-smooth">
                    <div className="p-4 min-h-full pb-28">

                        {isLoading && <LoadingOverlay isLoading={true} />}

                        {/* Error Message */}
                        {error && (
                            <div className="bg-red-50/90 backdrop-blur-sm border-l-8 border-red-500 text-red-700 p-4 mb-4 rounded-r-2xl shadow-sm animate-fade-in" role="alert">
                                <p className="font-black text-lg flex items-center gap-2 mb-1">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    Ups!
                                </p>
                                <p className="text-sm font-medium leading-tight">{error}</p>
                            </div>
                        )}

                        {/* --- STATE: HOME --- */}
                        {appState === AppState.HOME && (
                            <div className="flex flex-col gap-5 mt-1 animate-slide-up">

                                {/* Search Input (Floating Glass) */}
                                <div className="relative group mx-1 z-50">
                                    <div className="absolute -inset-0.5 bg-gradient-to-r from-red-300 to-blue-300 rounded-3xl blur opacity-30 group-hover:opacity-60 transition duration-500"></div>
                                    <div className="relative bg-white rounded-3xl shadow-sm">
                                        <form onSubmit={handleSearch} className="flex gap-2 p-1.5">
                                            <input
                                                type="text"
                                                value={searchQuery}
                                                onChange={handleSearchChange}
                                                placeholder="Pokemon suchen..."
                                                className="flex-1 bg-transparent px-4 py-3 focus:outline-none font-bold text-gray-700 placeholder-gray-400 text-lg"
                                                autoComplete="off"
                                            />
                                            <button type="submit" className="bg-gray-900 text-white rounded-2xl hover:bg-gray-800 transition-colors shadow-md flex items-center justify-center w-14 h-14 shrink-0 active:scale-95">
                                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                                </svg>
                                            </button>
                                        </form>
                                    </div>

                                    {/* Typeahead Suggestions Dropdown */}
                                    {suggestions.length > 0 && (
                                        <div className="absolute top-full left-0 right-0 mt-3 bg-white/95 backdrop-blur-xl rounded-3xl shadow-xl border border-gray-100 overflow-hidden z-50 animate-slide-up origin-top">
                                            <div className="max-h-60 overflow-y-auto no-scrollbar">
                                                {suggestions.map((suggestion) => (
                                                    <div
                                                        key={suggestion.id}
                                                        onClick={() => handleSelectSuggestion(suggestion)}
                                                        className="flex items-center gap-4 p-3 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-0 transition-colors active:bg-blue-100"
                                                    >
                                                        <div className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center shrink-0 border border-gray-200">
                                                            <img
                                                                src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${suggestion.id}.png`}
                                                                alt={suggestion.name}
                                                                className="w-8 h-8 object-contain"
                                                                loading="lazy"
                                                            />
                                                        </div>
                                                        <span className="font-bold text-gray-700 text-lg">{suggestion.name}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Camera Button (Big Floating Action Button) */}
                                <div className="flex justify-center py-2">
                                    <button
                                        onClick={() => setAppState(AppState.CAMERA)}
                                        className="relative w-24 h-24 rounded-full bg-gradient-to-br from-red-500 to-red-600 shadow-xl border-4 border-white flex items-center justify-center group transform transition-transform active:scale-95"
                                    >
                                        <div className="absolute inset-0 rounded-full bg-white opacity-0 group-hover:opacity-20 transition-opacity"></div>
                                        <svg className="w-10 h-10 text-white drop-shadow-md" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                        <span className="absolute -bottom-8 bg-gray-800 text-white text-[10px] uppercase font-bold px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity">Scan</span>
                                    </button>
                                </div>

                                {/* History Section (Carousel) */}
                                {history.length > 0 && (
                                    <div className="w-full">
                                        <div className="flex items-center justify-between mb-2 px-2">
                                            <h3 className="text-gray-500 font-black uppercase tracking-wider text-xs">Zuletzt gesehen</h3>
                                        </div>

                                        <div className="flex gap-3 overflow-x-auto pb-4 -mx-4 px-4 no-scrollbar snap-x">
                                            {history.map((poke, idx) => {
                                                const typeColor = getTypeColor(poke.types[0]);
                                                return (
                                                    <div
                                                        key={poke.id}
                                                        onClick={() => loadFromHistory(poke)}
                                                        className="flex-shrink-0 w-32 h-44 bg-white rounded-[1.2rem] shadow-[0_4px_12px_rgba(0,0,0,0.06)] flex flex-col items-center cursor-pointer relative overflow-hidden group border-2 border-transparent hover:border-blue-200 transition-all active:scale-95 snap-start"
                                                        style={{ animationDelay: `${idx * 0.05}s` }}
                                                    >
                                                        {/* Background shape */}
                                                        <div className={`absolute -top-10 -right-10 w-28 h-28 rounded-full ${typeColor} opacity-10 group-hover:scale-150 transition-transform duration-500`}></div>

                                                        <div className="flex-1 w-full flex items-center justify-center p-2 relative z-10">
                                                            <img
                                                                src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${poke.id}.png`}
                                                                alt={poke.germanName}
                                                                className="w-24 h-24 object-contain drop-shadow-sm transition-transform duration-300 group-hover:scale-110"
                                                                loading="lazy"
                                                            />
                                                        </div>
                                                        <div className="w-full py-2 px-2 bg-white/90 backdrop-blur-sm text-center border-t border-gray-50">
                                                            <span className="text-sm font-black text-gray-800 truncate w-full block">
                                                                {poke.germanName}
                                                            </span>
                                                            <div className="flex justify-center gap-1 mt-1 opacity-60">
                                                                {poke.types.slice(0, 1).map(t => (
                                                                    <div key={t} className={`w-2.5 h-2.5 rounded-full ${getTypeColor(t)}`}></div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* Navigation Grid */}
                                <div className="grid grid-cols-2 gap-3">
                                    {/* All Pokemon Button */}
                                    <button
                                        onClick={openPokedexList}
                                        className="bg-white rounded-[1.5rem] p-1 shadow-sm hover:shadow-lg transition-all group h-36 active:scale-95"
                                    >
                                        <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-[1.2rem] p-3 border border-red-100/50 flex flex-col items-center justify-center h-full gap-2 text-center">
                                            <div className="w-10 h-10 rounded-full bg-white text-red-500 flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300">
                                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                                                </svg>
                                            </div>
                                            <div>
                                                <span className="block font-black text-gray-800 text-sm group-hover:text-red-600 transition-colors">Alle Pokémon</span>
                                                <span className="text-gray-400 text-[10px] uppercase font-bold tracking-wide">Liste</span>
                                            </div>
                                        </div>
                                    </button>

                                    {/* Type Matrix Button */}
                                    <button
                                        onClick={() => setAppState(AppState.TYPE_MATRIX)}
                                        className="bg-white rounded-[1.5rem] p-1 shadow-sm hover:shadow-lg transition-all group h-36 active:scale-95"
                                    >
                                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-[1.2rem] p-3 border border-blue-100/50 flex flex-col items-center justify-center h-full gap-2 text-center">
                                            <div className="w-10 h-10 rounded-full bg-white text-blue-500 flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300">
                                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                                                </svg>
                                            </div>
                                            <div>
                                                <span className="block font-black text-gray-800 text-sm group-hover:text-blue-600 transition-colors">Typen-Matrix</span>
                                                <span className="text-gray-400 text-[10px] uppercase font-bold tracking-wide">Analyse</span>
                                            </div>
                                        </div>
                                    </button>

                                    {/* Team Builder Button */}
                                    <button
                                        onClick={() => setAppState(AppState.TEAM_BUILDER)}
                                        className="col-span-2 bg-white rounded-[1.5rem] p-1 shadow-sm hover:shadow-lg transition-all group h-24 active:scale-95"
                                    >
                                        <div className="bg-gradient-to-br from-purple-50 to-fuchsia-50 rounded-[1.2rem] p-3 border border-purple-100/50 flex items-center justify-between h-full px-6">
                                            <div className="flex flex-col items-start gap-1">
                                                <span className="block font-black text-gray-800 text-lg group-hover:text-purple-600 transition-colors">Team Planer</span>
                                                <span className="text-gray-400 text-[10px] uppercase font-bold tracking-wide">Synergie & Tipps</span>
                                            </div>
                                            <div className="w-12 h-12 rounded-full bg-white text-purple-500 flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300">
                                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                                </svg>
                                            </div>
                                        </div>
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* --- STATE: CAMERA --- */}
                        {appState === AppState.CAMERA && (
                            <div className="fixed inset-0 z-50 bg-black">
                                <CameraView
                                    onCapture={handleCapture}
                                    onClose={() => setAppState(AppState.HOME)}
                                />
                            </div>
                        )}

                        {/* --- STATE: POKEDEX LIST --- */}
                        {appState === AppState.POKEDEX_LIST && (
                            <div className="animate-slide-up pb-8">
                                <div className="bg-white/80 backdrop-blur-md p-4 rounded-3xl shadow-sm border border-white mb-4">
                                    <h2 className="text-2xl font-black text-gray-800">Pokedex Liste</h2>
                                </div>

                                <div className="grid grid-cols-2 gap-3 mb-6">
                                    {pokedexList.map((poke) => (
                                        <div
                                            key={poke.id}
                                            onClick={() => handleSelectPokemonEx(poke.name)}
                                            className="bg-white rounded-2xl shadow-sm border-2 border-gray-100 p-3 flex flex-col items-center cursor-pointer hover:shadow-md hover:border-red-100 transition-all active:scale-95 group relative overflow-hidden"
                                        >
                                            <span className="absolute top-2 right-3 text-[10px] font-black text-gray-300">#{String(poke.id).padStart(3, '0')}</span>
                                            <img
                                                src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${poke.id}.png`}
                                                alt={poke.name}
                                                className="w-20 h-20 object-contain z-10 transition-transform group-hover:scale-110 duration-300"
                                                loading="lazy"
                                            />
                                            <div className="mt-2 text-center w-full relative z-10">
                                                <span className="font-black text-gray-700 text-sm block">{poke.name}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <button
                                    onClick={loadMorePokemon}
                                    disabled={isLoadingList}
                                    className="w-full py-4 bg-white border-2 border-gray-200 text-gray-700 font-black text-base rounded-2xl shadow-sm hover:bg-gray-50 active:scale-95 transition-all flex items-center justify-center gap-3"
                                >
                                    {isLoadingList ? (
                                        <>
                                            <div className="w-5 h-5 border-4 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                                            Lade...
                                        </>
                                    ) : (
                                        'Mehr laden'
                                    )}
                                </button>
                            </div>
                        )}

                        {/* --- STATE: TYPE MATRIX --- */}
                        {appState === AppState.TYPE_MATRIX && (
                            <div className="space-y-4 animate-slide-up">
                                <div className="bg-white/80 backdrop-blur-md p-4 rounded-3xl shadow-sm border border-white">
                                    <h2 className="text-2xl font-black text-gray-800">Typen-Matrix</h2>
                                </div>

                                <div className="space-y-3 pb-8">
                                    {TYPES.map((type, idx) => {
                                        const details = getTypeDetails(type);
                                        const isExpanded = expandedType === type;

                                        return (
                                            <div
                                                key={type}
                                                className={`bg-white rounded-2xl shadow-sm border-2 border-gray-100 overflow-hidden transition-all duration-300 ${isExpanded ? 'ring-2 ring-blue-200 shadow-md' : ''}`}
                                                style={{ animationDelay: `${idx * 0.03}s` }}
                                            >
                                                <button
                                                    onClick={() => setExpandedType(isExpanded ? null : type)}
                                                    className="w-full flex items-center justify-between p-3 hover:bg-gray-50/50 active:bg-gray-100/50"
                                                >
                                                    <div className="flex items-center gap-4">
                                                        <TypeBadge type={type} size="md" showLabel />
                                                    </div>
                                                    <svg
                                                        className={`w-5 h-5 text-gray-300 transition-transform duration-300 ${isExpanded ? 'rotate-180 text-blue-500' : ''}`}
                                                        fill="none"
                                                        stroke="currentColor"
                                                        viewBox="0 0 24 24"
                                                    >
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7 7" />
                                                    </svg>
                                                </button>

                                                {isExpanded && (
                                                    <div className="px-4 pb-4 pt-2 border-t border-gray-100 bg-gray-50/50 animate-fade-in">
                                                        <div className="grid grid-cols-1 gap-4 mt-2">
                                                            {/* Offensive */}
                                                            <div>
                                                                <h4 className="text-[10px] font-black text-green-600 bg-green-100 inline-block px-2 py-0.5 rounded mb-2">SEHR EFFEKTIV GEGEN</h4>
                                                                <div className="flex flex-wrap gap-1.5">
                                                                    {details.offensive.strongAgainst.length > 0 ? (
                                                                        details.offensive.strongAgainst.map(t => <TypeBadge key={t} type={t} size="sm" />)
                                                                    ) : <span className="text-sm text-gray-400 font-bold">Nichts</span>}
                                                                </div>
                                                            </div>

                                                            {/* Defensive */}
                                                            <div>
                                                                <h4 className="text-[10px] font-black text-red-600 bg-red-100 inline-block px-2 py-0.5 rounded mb-2">ANFÄLLIG FÜR</h4>
                                                                <div className="flex flex-wrap gap-1.5">
                                                                    {details.defensive.weakFrom.length > 0 ? (
                                                                        details.defensive.weakFrom.map(t => <TypeBadge key={t} type={t} size="sm" />)
                                                                    ) : <span className="text-sm text-gray-400 font-bold">Nichts</span>}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* --- STATE: DETAIL --- */}
                        {appState === AppState.DETAIL && currentPokemon && (
                            <DetailView
                                pokemon={currentPokemon}
                                capturedImage={capturedImage}
                                isShiny={isShiny}
                                setIsShiny={setIsShiny}
                                onBack={resetHome}
                                onSelectPokemon={handleSelectPokemonEx}
                            />
                        )}

                        {/* --- STATE: TEAM BUILDER --- */}
                        {appState === AppState.TEAM_BUILDER && (
                            <TeamBuilderView onBack={resetHome} />
                        )}

                    </div>
                </main>
            </div>
        </div>
    );
}