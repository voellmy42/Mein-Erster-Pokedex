export enum PokemonType {
  Normal = 'Normal',
  Feuer = 'Feuer',
  Wasser = 'Wasser',
  Pflanze = 'Pflanze',
  Elektro = 'Elektro',
  Eis = 'Eis',
  Kampf = 'Kampf',
  Gift = 'Gift',
  Boden = 'Boden',
  Flug = 'Flug',
  Psycho = 'Psycho',
  Käfer = 'Käfer',
  Gestein = 'Gestein',
  Geist = 'Geist',
  Drache = 'Drache',
  Unlicht = 'Unlicht',
  Stahl = 'Stahl',
  Fee = 'Fee'
}

export interface PokemonStats {
  hp: number;
  attack: number;
  defense: number;
  spAttack: number;
  spDefense: number;
  speed: number;
}

export interface EvolutionStage {
  name: string;
  germanName: string;
  id: number;
  condition?: string; // e.g., "Lvl 16", "Blattstein", "Tausch"
}

export interface PokemonData {
  id: number;
  name: string;
  germanName: string;
  category: string; // e.g. "Samen-Pokémon"
  types: string[];
  description: string;
  height: string;
  weight: string;
  abilities: string[]; // e.g. ["Notdünger"]
  locations: string[]; // e.g. ["Karmesin: Zone Süd 1"]
  stats: PokemonStats;
  evolutionChain: EvolutionStage[];
  wikiUrl?: string;
}

export interface IdentificationResult {
  pokemon: PokemonData;
  found: boolean;
}