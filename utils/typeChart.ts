
export type TypeEffectiveness = Record<string, number>;

export const TYPES = [
  'Normal', 'Feuer', 'Wasser', 'Pflanze', 'Elektro', 'Eis', 'Kampf', 'Gift', 
  'Boden', 'Flug', 'Psycho', 'Käfer', 'Gestein', 'Geist', 'Drache', 'Unlicht', 
  'Stahl', 'Fee'
];

// Key: Attacker, Value: { Defender: Multiplier }
// Missing keys imply multiplier 1.0
const TYPE_CHART: Record<string, TypeEffectiveness> = {
  Normal: { Gestein: 0.5, Geist: 0, Stahl: 0.5 },
  Feuer: { Feuer: 0.5, Wasser: 0.5, Pflanze: 2, Eis: 2, Käfer: 2, Gestein: 0.5, Drache: 0.5, Stahl: 2 },
  Wasser: { Feuer: 2, Wasser: 0.5, Pflanze: 0.5, Boden: 2, Gestein: 2, Drache: 0.5 },
  Pflanze: { Feuer: 0.5, Wasser: 2, Pflanze: 0.5, Gift: 0.5, Boden: 2, Flug: 0.5, Käfer: 0.5, Gestein: 2, Drache: 0.5, Stahl: 0.5 },
  Elektro: { Wasser: 2, Pflanze: 0.5, Elektro: 0.5, Boden: 0, Flug: 2, Drache: 0.5 },
  Eis: { Feuer: 0.5, Wasser: 0.5, Pflanze: 2, Eis: 0.5, Boden: 2, Flug: 2, Drache: 2, Stahl: 0.5 },
  Kampf: { Normal: 2, Eis: 2, Gift: 0.5, Flug: 0.5, Psycho: 0.5, Käfer: 0.5, Gestein: 2, Geist: 0, Unlicht: 2, Stahl: 2, Fee: 0.5 },
  Gift: { Pflanze: 2, Gift: 0.5, Boden: 0.5, Gestein: 0.5, Geist: 0.5, Stahl: 0, Fee: 2 },
  Boden: { Feuer: 2, Pflanze: 0.5, Elektro: 2, Gift: 2, Gestein: 2, Flug: 0, Käfer: 0.5, Stahl: 2 },
  Flug: { Pflanze: 2, Elektro: 0.5, Kampf: 2, Käfer: 2, Gestein: 0.5, Stahl: 0.5 },
  Psycho: { Kampf: 2, Gift: 2, Psycho: 0.5, Unlicht: 0, Stahl: 0.5 },
  Käfer: { Feuer: 0.5, Pflanze: 2, Kampf: 0.5, Gift: 0.5, Flug: 0.5, Psycho: 2, Geist: 0.5, Unlicht: 2, Stahl: 0.5, Fee: 0.5 },
  Gestein: { Feuer: 2, Eis: 2, Kampf: 0.5, Boden: 0.5, Flug: 2, Käfer: 2, Stahl: 0.5 },
  Geist: { Normal: 0, Psycho: 2, Geist: 2, Unlicht: 0.5 },
  Drache: { Drache: 2, Stahl: 0.5, Fee: 0 },
  Unlicht: { Kampf: 0.5, Psycho: 2, Geist: 2, Unlicht: 0.5, Fee: 0.5 },
  Stahl: { Feuer: 0.5, Wasser: 0.5, Elektro: 0.5, Eis: 2, Gestein: 2, Stahl: 0.5, Fee: 2 },
  Fee: { Feuer: 0.5, Kampf: 2, Gift: 0.5, Drache: 2, Unlicht: 2, Stahl: 0.5 }
};

export const getOffensiveStrengths = (attackerTypes: string[]): string[] => {
  const strengths = new Set<string>();
  
  attackerTypes.forEach(attacker => {
    const relations = TYPE_CHART[attacker];
    if (relations) {
      Object.entries(relations).forEach(([defender, multiplier]) => {
        if (multiplier > 1) {
          strengths.add(defender);
        }
      });
    }
  });

  return Array.from(strengths);
};

export const getDefensiveWeaknesses = (defenderTypes: string[]): string[] => {
  const weaknesses = new Set<string>();
  
  TYPES.forEach(attacker => {
    let totalMultiplier = 1;
    
    defenderTypes.forEach(defender => {
      const multiplier = TYPE_CHART[attacker]?.[defender];
      if (multiplier !== undefined) {
        totalMultiplier *= multiplier;
      }
    });

    if (totalMultiplier > 1) {
      weaknesses.add(attacker);
    }
  });

  return Array.from(weaknesses);
};

export const getTypeDetails = (type: string) => {
  // Offensive
  const strongAgainst: string[] = [];
  const weakAgainst: string[] = [];
  const noEffectAgainst: string[] = [];

  const relations = TYPE_CHART[type] || {};
  
  // Fill offensive data
  TYPES.forEach(defender => {
    const mult = relations[defender];
    if (mult === undefined) return; // 1.0
    if (mult > 1) strongAgainst.push(defender);
    else if (mult === 0) noEffectAgainst.push(defender);
    else if (mult < 1) weakAgainst.push(defender);
  });

  // Defensive (Reverse lookup)
  const weakFrom: string[] = [];
  const resistantTo: string[] = [];
  const immuneTo: string[] = [];

  TYPES.forEach(attacker => {
    const mult = TYPE_CHART[attacker]?.[type];
    if (mult === undefined) return; // 1.0
    if (mult > 1) weakFrom.push(attacker);
    else if (mult === 0) immuneTo.push(attacker);
    else if (mult < 1) resistantTo.push(attacker);
  });

  return {
    offensive: { strongAgainst, weakAgainst, noEffectAgainst },
    defensive: { weakFrom, resistantTo, immuneTo }
  };
};
