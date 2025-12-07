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
}

export interface PokemonData {
  id: number;
  name: string;
  germanName: string;
  types: string[];
  description: string;
  height: string;
  weight: string;
  stats: PokemonStats;
  evolutionChain: EvolutionStage[];
  wikiUrl?: string;
}

export interface IdentificationResult {
  pokemon: PokemonData;
  found: boolean;
}