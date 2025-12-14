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

// recursive function to parse evolution chain
const parseEvolutionChain = async (chain: any, targetId: number): Promise<EvolutionStage[]> => {
  let targetPath: EvolutionStage[] = [];

  const traverse = async (node: any, currentPath: EvolutionStage[]): Promise<boolean> => {
    // Get ID from URL
    const id = parseInt(node.species.url.split('/').filter(Boolean).pop() || '0');

    // We need the German name for this node.
    const germanName = GERMAN_POKEMON_NAMES[id - 1] || node.species.name;

    // Parse condition
    let condition = "";
    if (node.evolution_details && node.evolution_details.length > 0) {
      const details = node.evolution_details[0];
      if (details.min_level) condition += `Lvl ${details.min_level}`;
      if (details.item) {
        condition += details.item.name;
      }
      if (details.trigger?.name === 'trade') condition = "Tausch";
    }

    const stage: EvolutionStage = {
      name: node.species.name,
      germanName: germanName,
      id: id,
      condition: condition || undefined
    };

    const newPath = [...currentPath, stage];

    // If this node is our target, we found the path!
    if (id === targetId) {
      targetPath = newPath;
      return true; // Stop searching? We might want to see if it evolves further technically, but for "lineage up to here" no. 
      // Actually, we want the FULL chain involving this pokemon. 
      // i.e. past -> present -> future.
      // If we are at target, we should continue down the first branch to show future evolutions?
      // Or does the user expected to see SQUIRTLE -> WARTORTLE -> BLASTOISE even if they are at WARTORTLE? Yes.
    }

    // Check if any child leads to target
    if (node.evolves_to && node.evolves_to.length > 0) {
      for (const child of node.evolves_to) {
        const found = await traverse(child, newPath);
        if (found) {
          // If this child path contains our target, we are on the right track.
          // But we need to make sure we bubble up the full path.
          // valid path is already set in targetPath by the recursive call if it found it *at the bottom* or *in the middle*.
          return true;
        }
      }
    }

    // If we are here, we are a leaf or no children led to target.
    // However, if we ARE the target (checked above), we might have children. 
    // If we found the target earlier in this specific call stack (top-down), we need to decide what to show as "future".
    // For simplicity: If I am the target, I take the first child's path as my "future" to show what I evolve into.

    // RE-THINK:
    // We want to find the linear chain that INCLUDES the targetId.
    // 1. Build the tree/paths. 
    // 2. Select path containing targetId.
    // 3. If targetId is root, we might have multiple paths. Default to first.

    // Let's change strategy: Collect ALL full paths (leaf to root). Then pick the one with proper ID.
    return false;
  };

  // Strategy: Traverse and collect all possible linear chains (root -> leaf)
  const allChains: EvolutionStage[][] = [];

  const collectChains = async (node: any, currentChain: EvolutionStage[]) => {
    const id = parseInt(node.species.url.split('/').filter(Boolean).pop() || '0');
    const germanName = GERMAN_POKEMON_NAMES[id - 1] || node.species.name;

    let condition = "";
    if (node.evolution_details && node.evolution_details.length > 0) {
      const details = node.evolution_details[0];
      if (details.min_level) condition += `Lvl ${details.min_level}`;
      if (details.item) condition += details.item.name;
      if (details.trigger?.name === 'trade') condition = "Tausch";
    }

    const stage = { name: node.species.name, germanName, id, condition: condition || undefined };
    const newChain = [...currentChain, stage];

    if (!node.evolves_to || node.evolves_to.length === 0) {
      allChains.push(newChain);
    } else {
      for (const child of node.evolves_to) {
        await collectChains(child, newChain);
      }
    }
  };

  await collectChains(chain, []);

  // Find chain containing targetId
  const matchingChain = allChains.find(c => c.some(s => s.id === targetId));

  // Fallback to first chain if not found (or if target is root, any chain works, but first is standard)
  return matchingChain || allChains[0] || [];
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
    // Pass current ID to find correct branch
    const evolutionChain = await parseEvolutionChain(evoData.chain, id);

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
