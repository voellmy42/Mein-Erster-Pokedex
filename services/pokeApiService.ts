
interface PokemonListItem {
  name: string;
  url: string;
  id: number;
}

export const getPokemonList = async (offset: number = 0, limit: number = 20): Promise<PokemonListItem[]> => {
  try {
    // We use pokemon-species endpoint to get the base species, which links to language names
    const response = await fetch(`https://pokeapi.co/api/v2/pokemon-species?offset=${offset}&limit=${limit}`);
    const data = await response.json();
    
    // We need to fetch details for each species to get the German name.
    // We use Promise.all to fetch them in parallel for performance.
    const promises = data.results.map(async (p: any) => {
      const id = parseInt(p.url.split('/').filter(Boolean).pop() || '0');
      let name = p.name; // Default to internal name (usually lowercase English)
      
      try {
        const speciesRes = await fetch(p.url);
        const speciesData = await speciesRes.json();
        const germanNameEntry = speciesData.names.find((n: any) => n.language.name === 'de');
        
        if (germanNameEntry) {
          name = germanNameEntry.name;
        } else {
           // Fallback: Capitalize the default name if no German name is found
           name = name.charAt(0).toUpperCase() + name.slice(1);
        }
      } catch (innerError) {
        console.warn(`Could not fetch details for pokemon ${id}`, innerError);
        // Fallback capitalization
        name = name.charAt(0).toUpperCase() + name.slice(1);
      }

      return {
        name,
        url: p.url,
        id
      };
    });

    return await Promise.all(promises);
  } catch (error) {
    console.error("Failed to fetch pokemon list", error);
    return [];
  }
};
