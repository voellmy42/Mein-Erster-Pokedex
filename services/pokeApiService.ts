import { PokemonData, PokemonStats, EvolutionStage } from '../types';
import { GERMAN_POKEMON_NAMES } from '../utils/pokemonNames';

interface PokemonListItem {
  name: string;
  url: string;
  id: number;
}

const BASE_URL = 'https://pokeapi.co/api/v2';

// Helper to get ID from German Name
export const getIdFromGermanName = (name: string): number | null => {
  const index = GERMAN_POKEMON_NAMES.findIndex(n => n.toLowerCase() === name.toLowerCase());
  return index !== -1 ? index + 1 : null;
};

export const getPokemonList = async (offset: number = 0, limit: number = 20): Promise<PokemonListItem[]> => {
  try {
    const list = GERMAN_POKEMON_NAMES.slice(offset, offset + limit);
    return list.map((name, index) => ({
      name,
      url: `${BASE_URL}/pokemon/${offset + index + 1}`,
      id: offset + index + 1
    }));
  } catch (error) {
    console.error("Failed to fetch pokemon list", error);
    return [];
  }
};

const fetchGermanName = (species: any): string => {
  const entry = species.names.find((n: any) => n.language.name === 'de');
  return entry ? entry.name : species.name;
};

const fetchGermanFlavorText = (species: any): string => {
  // Find the first German entry, preferably from a newer game
  const entries = species.flavor_text_entries.filter((e: any) => e.language.name === 'de');
  // Sort by version if possible or just take the last one (usually newer)
  const entry = entries[entries.length - 1];
  return entry ? entry.flavor_text.replace(/\n/g, ' ').replace(/\f/g, ' ') : "Keine Beschreibung verfügbar.";
};

const fetchGermanGenus = (species: any): string => {
  const entry = species.genera.find((g: any) => g.language.name === 'de');
  return entry ? entry.genus : "Pokémon";
};

const parseStats = (stats: any[]): PokemonStats => {
  const getStat = (name: string) => stats.find(s => s.stat.name === name)?.base_stat || 0;
  return {
    hp: getStat('hp'),
    attack: getStat('attack'),
    defense: getStat('defense'),
    spAttack: getStat('special-attack'),
    spDefense: getStat('special-defense'),
    speed: getStat('speed')
  };
};

// Recursive function to parse evolution chain
const parseEvolutionChain = async (chain: any): Promise<EvolutionStage[]> => {
  const stages: EvolutionStage[] = [];

  const traverse = async (node: any) => {
    // Get ID from URL
    const id = parseInt(node.species.url.split('/').filter(Boolean).pop() || '0');

    // We need the German name for this node. logic similar to getPokemonDetails but lighter?
    // Actually we can just use our local list if ID is valid
    let germanName = GERMAN_POKEMON_NAMES[id - 1] || node.species.name;

    // Parse condition
    let condition = "";
    if (node.evolution_details && node.evolution_details.length > 0) {
      const details = node.evolution_details[0];
      if (details.min_level) condition += `Lvl ${details.min_level}`;
      if (details.item) {
        // We'd ideally need to fetch item name in German, but English/Internal is fallback
        condition += details.item.name;
      }
      if (details.trigger?.name === 'trade') condition = "Tausch";
      // Simplified for now
    }

    stages.push({
      name: node.species.name,
      germanName: germanName,
      id: id,
      condition: condition || undefined
    });

    if (node.evolves_to && node.evolves_to.length > 0) {
      // Handle branching? For now just take the first path to keep UI simple
      // or handle all. The UI expects a flat list "EvolutionChain". 
      // If we flatten a tree, we might have issues.
      // But simple linear view is mostly what simple Pokedexes do or show branching.
      // Let's just follow the first child for linear view, or try to handle multiple?
      // The Type definition is EvolutionStage[], implied linear.
      // Let's just follow the first one for MVP to avoid UI explosion.
      await traverse(node.evolves_to[0]);
    }
  };

  await traverse(chain);
  return stages;
};

export const getPokemonDetails = async (id: number): Promise<PokemonData | null> => {
  try {
    // Parallel fetch: Pokemon Data & Species Data
    const [pokemonRes, speciesRes] = await Promise.all([
      fetch(`${BASE_URL}/pokemon/${id}`),
      fetch(`${BASE_URL}/pokemon-species/${id}`)
    ]);

    if (!pokemonRes.ok || !speciesRes.ok) return null;

    const pokemon = await pokemonRes.json();
    const species = await speciesRes.json();

    // Fetch Evolution Chain
    const evoRes = await fetch(species.evolution_chain.url);
    const evoData = await evoRes.json();
    const evolutionChain = await parseEvolutionChain(evoData.chain);

    // Fetch Types (German)
    const typePromises = pokemon.types.map(async (t: any) => {
      const res = await fetch(t.type.url);
      const data = await res.json();
      const deName = data.names.find((n: any) => n.language.name === 'de');
      return deName ? deName.name : t.type.name;
    });
    const types = await Promise.all(typePromises);

    return {
      id: pokemon.id,
      name: pokemon.name,
      germanName: fetchGermanName(species),
      category: fetchGermanGenus(species),
      types: types,
      description: fetchGermanFlavorText(species),
      height: `${pokemon.height / 10} m`, // Decimetres to Meters
      weight: `${pokemon.weight / 10} kg`, // Hectograms to KG
      abilities: pokemon.abilities.map((a: any) => a.ability.name), // Keeping simple for now, would need extra fetch for DE
      locations: [], // Skipping for speed/complexity trade-off
      stats: parseStats(pokemon.stats),
      evolutionChain: evolutionChain
    };

  } catch (error) {
    console.error("Error fetching pokemon details", error);
    return null;
  }
};
