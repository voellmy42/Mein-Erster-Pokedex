import React, { useState, useMemo, useRef, useEffect } from 'react';
import { identifyPokemon, searchPokemonByName, generatePokedexSpeech } from './services/geminiService';
import { getPokemonList } from './services/pokeApiService';
import { PokemonData } from './types';
import { LoadingOverlay } from './components/LoadingOverlay';
import { TypeBadge, getTypeColor } from './components/TypeBadge';
import { StatBar } from './components/StatBar';
import { CameraView } from './components/CameraView';
import { getDefensiveWeaknesses, getOffensiveStrengths, getTypeDetails, TYPES } from './utils/typeChart';
import { getSuggestions, PokemonSuggestion } from './utils/pokemonNames';

enum AppState {
  HOME,
  CAMERA,
  DETAIL,
  TYPE_MATRIX,
  POKEDEX_LIST
}

// Audio Helper Functions
function decodeBase64(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

export default function App() {
  const [appState, setAppState] = useState<AppState>(AppState.HOME);
  const [currentPokemon, setCurrentPokemon] = useState<PokemonData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [history, setHistory] = useState<PokemonData[]>([]);
  const [suggestions, setSuggestions] = useState<PokemonSuggestion[]>([]);
  
  // State for Type Matrix Accordion
  const [expandedType, setExpandedType] = useState<string | null>(null);

  // State for Pokedex List
  const [pokedexList, setPokedexList] = useState<{name: string, id: number}[]>([]);
  const [listOffset, setListOffset] = useState(0);
  const [isLoadingList, setIsLoadingList] = useState(false);

  // Audio State
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isPlayingCry, setIsPlayingCry] = useState(false); // New state for cry animation
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);

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

  const addToHistory = (pokemon: PokemonData) => {
    setHistory(prev => {
      // Remove if exists (to move to top)
      const filtered = prev.filter(p => p.id !== pokemon.id);
      // Add new at start, limit to 10
      const newHistory = [pokemon, ...filtered].slice(0, 10);
      localStorage.setItem('pokedex_history', JSON.stringify(newHistory));
      return newHistory;
    });
  };

  // Stop audio when unmounting or switching views
  useEffect(() => {
    return () => stopAudio();
  }, [appState]);

  const stopAudio = () => {
    if (audioSourceRef.current) {
      try {
        audioSourceRef.current.stop();
      } catch (e) {
        // Ignore errors if already stopped
      }
      audioSourceRef.current = null;
    }
    setIsPlayingAudio(false);
  };

  // Calculations for Detail View (Moved up so handleSpeak can access them)
  const weaknesses = useMemo(() => 
    currentPokemon ? getDefensiveWeaknesses(currentPokemon.types) : [], 
    [currentPokemon]
  );

  const strengths = useMemo(() => 
    currentPokemon ? getOffensiveStrengths(currentPokemon.types) : [], 
    [currentPokemon]
  );

  const handlePlayCry = () => {
    if (!currentPokemon) return;
    
    // Stop speech if running
    if (isPlayingAudio) stopAudio();

    setIsPlayingCry(true);
    const audio = new Audio(`https://raw.githubusercontent.com/PokeAPI/cries/main/cries/pokemon/latest/${currentPokemon.id}.ogg`);
    audio.volume = 0.6;
    
    audio.onended = () => {
        setIsPlayingCry(false);
    };
    
    audio.onerror = () => {
        setIsPlayingCry(false);
        console.warn("Audio cry not found");
    };

    audio.play().catch(e => {
        console.error("Play failed", e);
        setIsPlayingCry(false);
    });
  };

  const handleSpeak = async () => {
    if (!currentPokemon) return;

    if (isPlayingAudio) {
      stopAudio();
      return;
    }

    setIsLoading(true);
    try {
      // Manual formatter since Intl.ListFormat might be missing in TS types or env
      const formatList = (items: string[]) => {
        if (!items || items.length === 0) return '';
        if (items.length === 1) return items[0];
        return `${items.slice(0, -1).join(', ')} und ${items[items.length - 1]}`;
      };
      
      // Construct the text to be spoken
      let textToSpeak = `${currentPokemon.germanName}. ${currentPokemon.category}. ${currentPokemon.description} `;
      
      // Add Type info
      const typesFormatted = formatList(currentPokemon.types);
      textToSpeak += `Es ist vom Typ ${typesFormatted}. `;

      const base64Audio = await generatePokedexSpeech(textToSpeak);

      if (base64Audio) {
        // Initialize AudioContext if not exists
        if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        }
        
        // Ensure context is running (needed for some browsers policy)
        if (audioContextRef.current.state === 'suspended') {
            await audioContextRef.current.resume();
        }

        const audioCtx = audioContextRef.current;
        const audioBuffer = await decodeAudioData(
            decodeBase64(base64Audio),
            audioCtx,
            24000,
            1
        );

        const source = audioCtx.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioCtx.destination);
        source.onended = () => setIsPlayingAudio(false);
        
        audioSourceRef.current = source;
        source.start();
        setIsPlayingAudio(true);
      }
    } catch (err) {
      console.error("Audio playback error", err);
      setError("Audio konnte nicht abgespielt werden.");
    } finally {
      setIsLoading(false);
    }
  };

  const loadPokemonData = async (name: string) => {
    stopAudio();
    setIsLoading(true);
    setCapturedImage(null);
    setError(null);
    setSuggestions([]); // Clear suggestions
    setSearchQuery(name); // Update input
    try {
        const data = await searchPokemonByName(name);
        if (data) {
          setCurrentPokemon(data);
          addToHistory(data);
          setAppState(AppState.DETAIL);
        } else {
          setError(`Kein Pokémon mit dem Namen "${name}" gefunden.`);
        }
      } catch (err) {
        setError("Verbindungsfehler. Bitte später erneut versuchen.");
      } finally {
        setIsLoading(false);
      }
  };

  const loadFromHistory = (pokemon: PokemonData) => {
    stopAudio();
    setCapturedImage(null);
    setCurrentPokemon(pokemon);
    addToHistory(pokemon); // Moves to top of history
    setAppState(AppState.DETAIL);
  };

  const handleCapture = async (base64Image: string) => {
    stopAudio();
    setCapturedImage(`data:image/jpeg;base64,${base64Image}`);
    setIsLoading(true);
    setAppState(AppState.HOME); // Close camera view while loading
    
    try {
      const data = await identifyPokemon(base64Image);
      if (data) {
        setCurrentPokemon(data);
        addToHistory(data);
        setAppState(AppState.DETAIL);
        setError(null);
      } else {
        setError("Kein Pokémon erkannt. Versuch es nochmal!");
      }
    } catch (err) {
      setError("Fehler bei der Analyse. Bitte überprüfe deine Internetverbindung.");
    } finally {
      setIsLoading(false);
    }
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
    stopAudio();
    if (!searchQuery.trim()) return;
    await loadPokemonData(searchQuery);
  };

  const handleSelectSuggestion = (suggestion: PokemonSuggestion) => {
      loadPokemonData(suggestion.name);
  };

  const resetHome = () => {
    stopAudio();
    setAppState(AppState.HOME);
    setSearchQuery("");
    setSuggestions([]);
    setError(null);
  };

  return (
    // Use 100dvh for mobile browsers to avoid issues with address bar
    <div className="h-[100dvh] w-full bg-gradient-to-br from-indigo-100 via-purple-50 to-blue-100 animate-gradient-xy flex justify-center selection:bg-red-200">
      <div className="w-full max-w-lg bg-white/40 backdrop-blur-xl shadow-2xl relative flex flex-col h-full overflow-hidden">
      
        {/* === HEADER (Slim Design with Safe Area Support) === */}
        {/* Added pt-[max(12px,env(safe-area-inset-top))] to handle Notch/Status Bar on Mobile PWA */}
        <header className="bg-gradient-to-b from-red-600 to-red-700 pt-[max(12px,env(safe-area-inset-top))] pb-3 px-4 shadow-md relative z-20 shrink-0">
            {/* Glossy Overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none"></div>

            <div className="flex items-center justify-between">
                
                {/* Left Side: Sensor & Title or Back Button */}
                <div className="flex items-center gap-3">
                    {/* Blue Sensor (Smaller) */}
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

                {/* Right Side: Status LEDs */}
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
                                    style={{animationDelay: `${idx * 0.05}s`}}
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
                        </div>
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
                          onClick={() => loadPokemonData(poke.name)} 
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
                                        style={{animationDelay: `${idx * 0.03}s`}}
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
                    <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-xl border border-white overflow-hidden animate-scale-in">
                        
                        {/* Image Section */}
                        <div className="w-full h-56 bg-gradient-to-b from-gray-50 to-white relative flex items-center justify-center overflow-visible">
                            {/* Radial Glow */}
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-100/50 via-transparent to-transparent opacity-70"></div>
                            
                            {capturedImage ? (
                                <img src={capturedImage} alt="Captured" className="w-full h-full object-cover" />
                            ) : (
                                <div className="flex flex-col items-center justify-center w-full h-full relative z-10">
                                     <img 
                                        src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${currentPokemon.id}.png`}
                                        alt={currentPokemon.name}
                                        className="h-48 w-48 object-contain drop-shadow-2xl z-20"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).style.display = 'none';
                                        }}
                                    />
                                </div>
                            )}
                        </div>

                        {/* Info Header */}
                        <div className="px-5 -mt-4 relative z-10 pb-8">
                            <div className="text-center mb-2">
                                <span className="block text-gray-400 font-mono text-sm font-black tracking-widest mb-1">#{String(currentPokemon.id).padStart(3, '0')}</span>
                                <h2 className="text-4xl font-black text-gray-800 drop-shadow-sm leading-none tracking-tight mb-2">{currentPokemon.germanName}</h2>
                                
                                {/* Chips: Category & Abilities */}
                                <div className="flex justify-center gap-2 mb-3 flex-wrap">
                                    {currentPokemon.category && (
                                        <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs font-bold border border-gray-200">
                                            {currentPokemon.category}
                                        </span>
                                    )}
                                    {currentPokemon.abilities?.map(ability => (
                                        <span key={ability} className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-xs font-bold border border-blue-100 flex items-center gap-1">
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                                            {ability}
                                        </span>
                                    ))}
                                </div>

                                <div className="flex justify-center gap-2 mb-4 flex-wrap">
                                    {currentPokemon.types.map((type) => (
                                        <TypeBadge key={type} type={type} size="md" showLabel />
                                    ))}
                                </div>
                            </div>
                            
                            {/* AUDIO CONTROLS (GRID) */}
                            <div className="grid grid-cols-[1fr_auto] gap-3 mb-6">
                                {/* READ BUTTON */}
                                <button
                                    onClick={handleSpeak}
                                    className={`py-3.5 rounded-2xl shadow-lg transform transition-all active:scale-95 flex items-center justify-center gap-3 ${
                                        isPlayingAudio 
                                            ? 'bg-red-500 text-white animate-pulse ring-4 ring-red-200 shadow-red-200' 
                                            : 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:shadow-xl hover:-translate-y-1'
                                    }`}
                                >
                                    {isPlayingAudio ? (
                                        <>
                                            <div className="flex gap-1 items-center h-5">
                                                <div className="w-1.5 h-full bg-white rounded-full animate-[bounce_1s_infinite]"></div>
                                                <div className="w-1.5 h-2/3 bg-white rounded-full animate-[bounce_1s_infinite_0.2s]"></div>
                                                <div className="w-1.5 h-full bg-white rounded-full animate-[bounce_1s_infinite_0.4s]"></div>
                                            </div>
                                            <span className="font-black text-lg uppercase tracking-wider">Stop</span>
                                        </>
                                    ) : (
                                        <>
                                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                                 <path d="M11 5L6 9H2v6h4l5 4V5zM15.5 12c0-1.33-.58-2.53-1.5-3.35v6.69c.92-.81 1.5-2.01 1.5-3.34z" />
                                                 <path d="M19.02 12c0 2.61-1.67 4.88-4.02 5.66v2.06c3.45-.89 6-4.01 6-7.72s-2.55-6.83-6-7.72v2.06c2.35.78 4.02 3.05 4.02 5.66z" />
                                            </svg>
                                            <span className="font-black text-lg uppercase tracking-wider">Vorlesen</span>
                                        </>
                                    )}
                                </button>

                                {/* CRY BUTTON */}
                                <button
                                    onClick={handlePlayCry}
                                    className={`w-16 rounded-2xl shadow-lg transform transition-all active:scale-95 flex items-center justify-center bg-yellow-400 hover:bg-yellow-300 text-yellow-900 ${
                                        isPlayingCry ? 'animate-[shake_0.5s_ease-in-out_infinite] ring-4 ring-yellow-200' : ''
                                    }`}
                                    title="Ruf abspielen"
                                >
                                    <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                                    </svg>
                                </button>
                            </div>

                            {/* Evolutions (Prominent Placement) */}
                            {currentPokemon.evolutionChain.length > 1 && (
                                <div className="mb-6 bg-gray-50/80 rounded-2xl p-4 border border-gray-100">
                                    <h3 className="text-xs font-black text-gray-400 mb-3 uppercase tracking-widest text-center">Entwicklungsreihe</h3>
                                    <div className="flex items-center justify-center gap-2 overflow-x-auto no-scrollbar py-1">
                                        {currentPokemon.evolutionChain.map((evo, index) => (
                                            <React.Fragment key={evo.id}>
                                                <div 
                                                    className="flex flex-col items-center gap-1 cursor-pointer group shrink-0"
                                                    onClick={() => loadPokemonData(evo.germanName)}
                                                >
                                                    <div className={`w-16 h-16 rounded-full border-4 flex items-center justify-center bg-white transition-all duration-300 transform group-hover:scale-110 group-active:scale-95 ${evo.germanName === currentPokemon.germanName ? 'border-red-500 shadow-lg' : 'border-white shadow-sm'}`}>
                                                        <img 
                                                            src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${evo.id}.png`}
                                                            alt={evo.germanName}
                                                            className="w-12 h-12 object-contain"
                                                        />
                                                    </div>
                                                    <span className={`text-[9px] font-black uppercase tracking-wide px-2 py-0.5 rounded-full ${evo.germanName === currentPokemon.germanName ? 'text-white bg-red-500' : 'text-gray-400 bg-gray-200'}`}>
                                                        {evo.germanName}
                                                    </span>
                                                </div>
                                                
                                                {/* Evolution Condition Arrow */}
                                                {index < currentPokemon.evolutionChain.length - 1 && (
                                                    <div className="flex flex-col items-center px-1">
                                                        <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                                                        {currentPokemon.evolutionChain[index + 1].condition && (
                                                            <span className="text-[8px] font-bold text-gray-400 bg-white px-1.5 py-0.5 rounded border border-gray-100 mt-0.5 whitespace-nowrap">
                                                                {currentPokemon.evolutionChain[index + 1].condition}
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                            </React.Fragment>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Description */}
                            <div className="bg-blue-50/80 p-5 rounded-2xl border border-blue-100 mb-6">
                                <p className="text-gray-800 leading-relaxed font-bold text-base text-center">
                                    "{currentPokemon.description}"
                                </p>
                            </div>

                            {/* Locations (New) */}
                            {currentPokemon.locations && currentPokemon.locations.length > 0 && (
                                <div className="mb-6">
                                     <h3 className="text-xs font-black text-gray-400 mb-3 uppercase tracking-widest text-center">Fundorte</h3>
                                     <div className="space-y-2">
                                         {currentPokemon.locations.map((loc, idx) => (
                                             <div key={idx} className="flex items-center gap-3 bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                                                 <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center shrink-0">
                                                     <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                                 </div>
                                                 <span className="text-sm font-bold text-gray-700">{loc}</span>
                                             </div>
                                         ))}
                                     </div>
                                </div>
                            )}

                            {/* Battle Analysis */}
                            <div className="mb-6">
                                <h3 className="text-xs font-black text-gray-400 mb-3 flex items-center gap-2 uppercase tracking-widest justify-center">
                                    Kampf-Analyse
                                </h3>
                                <div className="grid grid-cols-1 gap-3">
                                    <div className="bg-green-50 rounded-2xl p-4 border border-green-100 relative overflow-hidden">
                                        <div className="absolute top-0 right-0 p-1 opacity-10">
                                            <svg className="w-10 h-10 text-green-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>
                                        </div>
                                        <p className="text-[10px] font-black text-green-600 uppercase mb-2">Stark Gegen</p>
                                        <div className="flex flex-wrap gap-1.5 relative z-10">
                                            {strengths.length > 0 ? (
                                                strengths.map(t => <TypeBadge key={t} type={t} size="sm" />)
                                            ) : (
                                                <span className="text-xs text-gray-400 font-bold">Keine besonderen Stärken</span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="bg-red-50 rounded-2xl p-4 border border-red-100 relative overflow-hidden">
                                        <div className="absolute top-0 right-0 p-1 opacity-10">
                                            <svg className="w-10 h-10 text-red-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/></svg>
                                        </div>
                                        <p className="text-[10px] font-black text-red-600 uppercase mb-2">Schwach Gegen</p>
                                        <div className="flex flex-wrap gap-1.5 relative z-10">
                                            {weaknesses.length > 0 ? (
                                                weaknesses.map(t => <TypeBadge key={t} type={t} size="sm" />)
                                            ) : (
                                                <span className="text-xs text-gray-400 font-bold">Keine besonderen Schwächen</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Stats Grid (Moved to bottom) */}
                            <div className="mb-6">
                                <div className="grid grid-cols-2 gap-3 mb-6">
                                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 text-center">
                                        <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-1">Größe</p>
                                        <p className="text-xl font-black text-gray-800">{currentPokemon.height}</p>
                                    </div>
                                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 text-center">
                                        <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-1">Gewicht</p>
                                        <p className="text-xl font-black text-gray-800">{currentPokemon.weight}</p>
                                    </div>
                                </div>
                                <h3 className="text-xs font-black text-gray-400 mb-3 uppercase tracking-widest text-center">Basiswerte</h3>
                                <div className="space-y-2 bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                                    <StatBar label="KP" value={currentPokemon.stats.hp} color="bg-red-500" />
                                    <StatBar label="Angriff" value={currentPokemon.stats.attack} color="bg-orange-500" />
                                    <StatBar label="Vert." value={currentPokemon.stats.defense} color="bg-yellow-500" />
                                    <StatBar label="Sp.Ang" value={currentPokemon.stats.spAttack} color="bg-blue-500" />
                                    <StatBar label="Sp.Ver" value={currentPokemon.stats.spDefense} color="bg-green-500" />
                                    <StatBar label="Init." value={currentPokemon.stats.speed} color="bg-pink-500" />
                                </div>
                            </div>

                        </div>
                    </div>
                )}
            </div>
        </main>

        {/* === FOOTER DOCK (Slim Grip) === */}
        {appState !== AppState.CAMERA && (
            // Added pb-[max(20px,env(safe-area-inset-bottom))] to handle iPhone Home Bar without hiding content
            <footer className="h-20 bg-gray-900 rounded-t-[2rem] shadow-[0_-10px_40px_rgba(0,0,0,0.5)] flex items-center justify-center relative shrink-0 z-30 overflow-visible mt-auto pb-[env(safe-area-inset-bottom)]">
                
                {/* Metallic Accent Line */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/4 h-1 bg-gray-700 rounded-b-full opacity-50"></div>

                {/* Decorative Elements */}
                <div className="absolute left-6 bottom-6 flex gap-2 opacity-30">
                     <div className="w-1.5 h-6 bg-gray-600 rounded-full"></div>
                     <div className="w-1.5 h-6 bg-gray-600 rounded-full"></div>
                </div>

                {/* The Shutter Button Container (Popping Out) */}
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 p-1.5 bg-gray-900 rounded-full shadow-xl z-50">
                    <button 
                        onClick={() => setAppState(AppState.CAMERA)}
                        className="w-20 h-20 rounded-full bg-gradient-to-b from-gray-200 to-gray-400 shadow-[inset_0_2px_4px_rgba(255,255,255,0.8),0_4px_10px_rgba(0,0,0,0.4)] flex items-center justify-center group active:scale-95 transition-all transform cursor-pointer relative"
                        title="Scanner öffnen"
                    >
                        {/* Shutter Ring */}
                        <div className="absolute inset-1 rounded-full border-2 border-gray-300/50"></div>
                        
                        {/* Inner Red Button (Glassy) */}
                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-red-500 to-red-700 shadow-[inset_0_2px_5px_rgba(255,255,255,0.4),0_2px_5px_rgba(0,0,0,0.2)] group-hover:brightness-110 transition-all flex items-center justify-center relative overflow-hidden">
                             {/* Gloss */}
                             <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/40 to-transparent rounded-t-full"></div>
                             {/* Camera Icon */}
                             <svg className="w-8 h-8 text-white drop-shadow-md opacity-90 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                        </div>
                    </button>
                    <div className="absolute -bottom-5 left-0 right-0 text-center">
                        <span className="text-gray-500 text-[9px] font-black uppercase tracking-widest">Scannen</span>
                    </div>
                </div>

                 {/* Decorative Speaker Right */}
                 <div className="absolute right-6 bottom-6 flex gap-1 opacity-20">
                     <div className="w-1 h-1 bg-white rounded-full"></div>
                     <div className="w-1 h-1 bg-white rounded-full"></div>
                     <div className="w-1 h-1 bg-white rounded-full"></div>
                     <div className="w-1 h-1 bg-white rounded-full"></div>
                </div>
            </footer>
        )}

        {/* Loading Overlay */}
        {isLoading && <LoadingOverlay />}

        {/* Camera View Overlay */}
        {appState === AppState.CAMERA && (
            <CameraView 
                onCapture={handleCapture} 
                onClose={() => setAppState(AppState.HOME)} 
            />
        )}
      </div>
    </div>
  );
}