import React from 'react';
import { PokemonData } from '../types';
import { TypeBadge } from './TypeBadge';

interface TeamSlotProps {
    pokemon: PokemonData | null;
    onRemove: () => void;
    onAdd: () => void;
}

export const TeamSlot: React.FC<TeamSlotProps> = ({ pokemon, onRemove, onAdd }) => {
    if (!pokemon) {
        return (
            <button
                onClick={onAdd}
                className="aspect-square bg-gray-50 rounded-2xl border-2 border-dashed border-gray-300 hover:border-blue-400 hover:bg-blue-50 transition-all flex flex-col items-center justify-center gap-2 group active:scale-95"
            >
                <div className="w-10 h-10 rounded-full bg-gray-200 text-gray-400 flex items-center justify-center group-hover:bg-blue-500 group-hover:text-white transition-colors">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
                    </svg>
                </div>
                <span className="text-xs font-black text-gray-400 uppercase tracking-widest group-hover:text-blue-500">
                    Platz Frei
                </span>
            </button>
        );
    }

    return (
        <div className="relative aspect-square bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center p-2 group overflow-hidden">
            {/* Background Gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-white to-gray-50 -z-10"></div>

            {/* Remove Button */}
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onRemove();
                }}
                className="absolute top-1 right-1 w-6 h-6 bg-red-100 text-red-500 rounded-full flex items-center justify-center hover:bg-red-500 hover:text-white transition-colors z-20 shadow-sm"
                title="Aus Team entfernen"
            >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>

            <img
                src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.id}.png`}
                alt={pokemon.germanName}
                className="w-20 h-20 object-contain drop-shadow-sm z-10 transition-transform group-hover:scale-110 duration-300"
            />

            <span className="font-black text-gray-800 text-xs truncate w-full text-center z-10">
                {pokemon.germanName}
            </span>

            <div className="flex gap-0.5 mt-1 justify-center w-full z-10">
                {pokemon.types.map(t => (
                    <div key={t} className="scale-75 origin-center">
                        <TypeBadge type={t} size="sm" />
                    </div>
                ))}
            </div>
        </div>
    );
};
