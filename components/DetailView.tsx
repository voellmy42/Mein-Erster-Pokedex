import React, { useMemo } from 'react';
import { PokemonData } from '../types';
import { useAudio } from '../hooks/useAudio';
import { TypeBadge } from './TypeBadge';
import { StatBar } from './StatBar';
import { getDefensiveWeaknesses, getOffensiveStrengths } from '../utils/typeChart';
import { useTeam } from '../hooks/useTeam';

interface DetailViewProps {
    pokemon: PokemonData;
    capturedImage: string | null;
    isShiny: boolean;
    setIsShiny: (value: boolean) => void;
    onBack: () => void;
    onSelectPokemon: (name: string) => void;
}

export const DetailView: React.FC<DetailViewProps> = ({
    pokemon,
    capturedImage,
    isShiny,
    setIsShiny,
    onBack,
    onSelectPokemon,
}) => {
    const { isPlayingAudio, isLoadingAudio, progress, isPlayingCry, playSpeech, playCry, stop } = useAudio();
    const { team, addPokemon, removePokemon, isInTeam } = useTeam();
    const isMember = isInTeam(pokemon.id);
    const isTeamFull = team.length >= 6;

    // Prefetch audio service
    React.useEffect(() => {
        import('../services/geminiService');
    }, []);

    const toggleTeam = () => {
        if (isMember) {
            removePokemon(pokemon.id);
        } else {
            addPokemon(pokemon);
        }
    };

    const weaknesses = useMemo(() => getDefensiveWeaknesses(pokemon.types), [pokemon]);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const strengths = useMemo(() => getOffensiveStrengths(pokemon.types), [pokemon]);

    const handleSpeak = () => {
        if (isPlayingAudio || isLoadingAudio) {
            stop();
            return;
        }

        const formatList = (items: string[]) => {
            if (!items || items.length === 0) return '';
            if (items.length === 1) return items[0];
            return `${items.slice(0, -1).join(', ')} und ${items[items.length - 1]}`;
        };

        let textToSpeak = `${pokemon.germanName}. ${pokemon.category}. ${pokemon.description} `;
        const typesFormatted = formatList(pokemon.types);
        textToSpeak += `Es ist vom Typ ${typesFormatted}. `;

        playSpeech(textToSpeak);
    };

    return (
        <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-xl border border-white overflow-hidden animate-scale-in pb-10">

            {/* Image Section */}
            <div className="w-full h-56 bg-gradient-to-b from-gray-50 to-white relative flex items-center justify-center overflow-visible">
                {/* Radial Glow */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-100/50 via-transparent to-transparent opacity-70"></div>

                <button
                    onClick={onBack}
                    className="absolute top-4 left-4 z-40 bg-white/50 backdrop-blur-md p-2 rounded-xl shadow-sm border border-white/50 hover:bg-white text-gray-700 transition-colors"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" /></svg>
                </button>

                {capturedImage ? (
                    <img src={capturedImage} alt="Captured" className="w-full h-full object-cover" />
                ) : (
                    <div className="flex flex-col items-center justify-center w-full h-full relative z-10">
                        {/* SHINY TOGGLE BUTTON */}
                        <button
                            onClick={() => setIsShiny(!isShiny)}
                            className="absolute top-3 right-3 z-30 bg-white/50 backdrop-blur-md p-2 rounded-full shadow-sm border border-white/50 hover:bg-white transition-colors"
                            title={isShiny ? "Normal" : "Shiny"}
                        >
                            <svg className={`w-5 h-5 ${isShiny ? 'text-yellow-500 fill-yellow-500' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                            </svg>
                        </button>

                        <img
                            key={isShiny ? 'shiny' : 'normal'}
                            src={isShiny
                                ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/home/shiny/${pokemon.id}.png`
                                : `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokemon.id}.png`
                            }
                            alt={pokemon.name}
                            className="h-48 w-48 object-contain drop-shadow-2xl z-20 animate-fade-in"
                            onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                            }}
                        />
                        {isShiny && (
                            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                                <div className="w-6 h-6 absolute top-10 right-20 text-yellow-400 animate-pulse">✨</div>
                                <div className="w-4 h-4 absolute bottom-10 left-20 text-yellow-400 animate-pulse delay-75">✨</div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Info Header */}
            <div className="px-5 -mt-4 relative z-10">
                <div className="text-center mb-2">
                    <span className="block text-gray-400 font-mono text-sm font-black tracking-widest mb-1">#{String(pokemon.id).padStart(3, '0')}</span>
                    <h2 className="text-4xl font-black text-gray-800 drop-shadow-sm leading-none tracking-tight mb-2">{pokemon.germanName}</h2>
                    <p className="text-gray-500 font-medium text-sm mb-3">{pokemon.category}</p>

                    <div className="flex justify-center gap-2 mb-4 flex-wrap">
                        {pokemon.types.map((type) => (
                            <TypeBadge key={type} type={type} size="md" showLabel />
                        ))}
                    </div>

                    {/* TEAM BUTTON */}
                    <button
                        onClick={toggleTeam}
                        disabled={!isMember && isTeamFull}
                        className={`mx-auto mb-4 px-4 py-2 rounded-xl flex items-center gap-2 font-black text-xs uppercase tracking-wide transition-all ${isMember
                            ? 'bg-red-100 text-red-600 border border-red-200 hover:bg-red-200'
                            : isTeamFull
                                ? 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed'
                                : 'bg-green-100 text-green-600 border border-green-200 hover:bg-green-200 shadow-sm hover:shadow-md'
                            }`}
                    >
                        {isMember ? (
                            <>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                                Aus Team entfernen
                            </>
                        ) : isTeamFull ? (
                            <>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                Team Voll
                            </>
                        ) : (
                            <>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
                                Ins Team
                            </>
                        )}
                    </button>
                </div>

                {/* AUDIO CONTROLS */}
                <div className="grid grid-cols-[1fr_auto] gap-3 mb-6">
                    <button
                        onClick={handleSpeak}
                        className={`py-3.5 rounded-2xl shadow-lg transform transition-all active:scale-95 flex items-center justify-center gap-3 relative overflow-hidden ${isPlayingAudio || isLoadingAudio
                            ? 'bg-red-500 text-white shadow-red-200'
                            : 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:shadow-xl hover:-translate-y-1'
                            }`}
                    >
                        {/* Progress Bar Background */}
                        {isLoadingAudio && (
                            <div
                                className="absolute left-0 top-0 bottom-0 bg-white/20 transition-all duration-200 ease-out"
                                style={{ width: `${progress}%` }}
                            />
                        )}

                        {isLoadingAudio ? (
                            <>
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <span className="font-black text-lg uppercase tracking-wider relative z-10">LÄDT... {progress}%</span>
                            </>
                        ) : isPlayingAudio ? (
                            <>
                                <div className="flex gap-1 items-center h-5 relative z-10">
                                    <div className="w-1.5 h-full bg-white rounded-full animate-[bounce_1s_infinite]"></div>
                                    <div className="w-1.5 h-2/3 bg-white rounded-full animate-[bounce_1s_infinite_0.2s]"></div>
                                    <div className="w-1.5 h-full bg-white rounded-full animate-[bounce_1s_infinite_0.4s]"></div>
                                </div>
                                <span className="font-black text-lg uppercase tracking-wider relative z-10">Stop</span>
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

                    <button
                        onClick={() => playCry(pokemon.id)}
                        className={`w-16 rounded-2xl shadow-lg transform transition-all active:scale-95 flex items-center justify-center bg-yellow-400 hover:bg-yellow-300 text-yellow-900 ${isPlayingCry ? 'animate-[shake_0.5s_ease-in-out_infinite] ring-4 ring-yellow-200' : ''
                            }`}
                        title="Ruf abspielen"
                    >
                        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                        </svg>
                    </button>
                </div>

                {/* Description */}
                <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100 mb-6">
                    <p className="text-gray-700 leading-relaxed font-medium text-[15px] italic text-center">
                        "{pokemon.description}"
                    </p>
                </div>

                {/* Evolutions */}
                {pokemon.evolutionChain.length > 1 && (
                    <div className="mb-6 bg-gray-50/80 rounded-2xl p-4 border border-gray-100">
                        <h3 className="text-xs font-black text-gray-400 mb-3 uppercase tracking-widest text-center">Entwicklungsreihe</h3>
                        <div className="flex items-center justify-center gap-2 overflow-x-auto no-scrollbar py-1">
                            {pokemon.evolutionChain.map((evo, index) => (
                                <React.Fragment key={evo.id}>
                                    <div
                                        className="flex flex-col items-center gap-1 cursor-pointer group shrink-0"
                                        onClick={() => onSelectPokemon(evo.germanName)}
                                    >
                                        <div className={`w-16 h-16 rounded-full border-4 flex items-center justify-center bg-white transition-all duration-300 transform group-hover:scale-110 group-active:scale-95 ${evo.germanName === pokemon.germanName ? 'border-red-500 shadow-lg' : 'border-white shadow-sm'}`}>
                                            <img
                                                src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${evo.id}.png`}
                                                alt={evo.germanName}
                                                className="w-12 h-12 object-contain"
                                            />
                                        </div>
                                        <span className={`text-[9px] font-black uppercase tracking-wide px-2 py-0.5 rounded-full ${evo.germanName === pokemon.germanName ? 'text-white bg-red-500' : 'text-gray-400 bg-gray-200'}`}>
                                            {evo.germanName}
                                        </span>
                                    </div>

                                    {index < pokemon.evolutionChain.length - 1 && (
                                        <div className="flex flex-col items-center px-1">
                                            <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                                            {pokemon.evolutionChain[index + 1].condition && (
                                                <span className="text-[8px] font-bold text-gray-400 bg-white px-1.5 py-0.5 rounded border border-gray-100 mt-0.5 whitespace-nowrap">
                                                    {pokemon.evolutionChain[index + 1].condition}
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </React.Fragment>
                            ))}
                        </div>
                    </div>
                )}

                {/* Weaknesses */}
                <div className="mb-6">
                    <h3 className="text-xs font-black text-gray-400 mb-3 uppercase tracking-widest text-center">Schwächen</h3>
                    <div className="flex flex-wrap gap-2 justify-center">
                        {weaknesses.map(t => <TypeBadge key={t} type={t} size="sm" showLabel />)}
                    </div>
                </div>

                {/* Stats */}
                <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                    <h3 className="text-xs font-black text-gray-400 mb-3 uppercase tracking-widest text-center">Basiswerte</h3>
                    <div className="space-y-3">
                        <StatBar label="HP" value={pokemon.stats.hp} color="bg-red-500" />
                        <StatBar label="Angriff" value={pokemon.stats.attack} color="bg-orange-500" />
                        <StatBar label="Verteidigung" value={pokemon.stats.defense} color="bg-yellow-500" />
                        <StatBar label="Sp. Angr." value={pokemon.stats.spAttack} color="bg-blue-500" />
                        <StatBar label="Sp. Vert." value={pokemon.stats.spDefense} color="bg-green-500" />
                        <StatBar label="Init." value={pokemon.stats.speed} color="bg-pink-500" />
                    </div>
                </div>

                {/* Physical Details */}
                <div className="grid grid-cols-2 gap-4 mt-6">
                    <div className="bg-blue-50 rounded-2xl p-3 text-center">
                        <span className="block text-blue-400 text-[10px] font-black uppercase tracking-widest">Größe</span>
                        <span className="text-blue-900 font-black text-lg">{pokemon.height}</span>
                    </div>
                    <div className="bg-blue-50 rounded-2xl p-3 text-center">
                        <span className="block text-blue-400 text-[10px] font-black uppercase tracking-widest">Gewicht</span>
                        <span className="text-blue-900 font-black text-lg">{pokemon.weight}</span>
                    </div>
                </div>

            </div>
        </div>
    );
};
