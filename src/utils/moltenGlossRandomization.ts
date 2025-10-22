// src/utils/moltenGlossRandomization.ts

/**
 * Molten Gloss Randomization Utility
 * Generates randomized animal companions for the Molten Gloss preset
 */

export interface MoltenAnimal {
  name: string;
  description: string;
}

// Animal companion variations (3 total animals)
export const MOLTEN_ANIMALS: MoltenAnimal[] = [
  {
    name: 'Black Panther',
    description: 'sleek, powerful, and elegant'
  },
  {
    name: 'Giant Komodo Dragon',
    description: 'ancient, commanding, and textured'
  },
  {
    name: 'Giant Python',
    description: 'sinuous, mysterious, and striking'
  }
];

// Animal rotation state - tracks which animals have been used recently
let moltenAnimalRotationState = {
  usedAnimals: [] as number[],
  lastReset: Date.now()
};

/**
 * Get the next animal in rotation, ensuring all animals are used before repeating
 */
function getNextMoltenAnimalInRotation(): number {
  const now = Date.now();
  
  // Reset rotation state every 5 minutes to allow for fresh starts
  if (now - moltenAnimalRotationState.lastReset > 5 * 60 * 1000) {
    moltenAnimalRotationState.usedAnimals = [];
    moltenAnimalRotationState.lastReset = now;
  }
  
  // If we've used all animals, reset the used list
  if (moltenAnimalRotationState.usedAnimals.length >= MOLTEN_ANIMALS.length) {
    moltenAnimalRotationState.usedAnimals = [];
  }
  
  // Get available animals (not used recently)
  const availableAnimals = [];
  for (let i = 0; i < MOLTEN_ANIMALS.length; i++) {
    if (!moltenAnimalRotationState.usedAnimals.includes(i)) {
      availableAnimals.push(i);
    }
  }
  
  // If no available animals (shouldn't happen), reset and use all
  if (availableAnimals.length === 0) {
    moltenAnimalRotationState.usedAnimals = [];
    availableAnimals.push(...Array.from({ length: MOLTEN_ANIMALS.length }, (_, i) => i));
  }
  
  // Randomly select from available animals
  const selectedIndex = availableAnimals[Math.floor(Math.random() * availableAnimals.length)];
  
  // Mark this animal as used
  moltenAnimalRotationState.usedAnimals.push(selectedIndex);
  
  return selectedIndex;
}

/**
 * Generate a randomized molten gloss prompt
 * @param basePrompt The base prompt template with {ANIMAL} placeholder
 * @returns Randomized prompt with animal companion injection
 */
export function generateMoltenGlossPrompt(basePrompt: string): string {
  // Use rotation system to ensure all animals are used before repeating
  const animalIndex = getNextMoltenAnimalInRotation();
  const randomAnimal = MOLTEN_ANIMALS[animalIndex];
  
  console.log('🔥 [Molten Gloss] Selected animal:', randomAnimal.name, '| Description:', randomAnimal.description);
  
  // Replace the {ANIMAL} placeholder with the selected animal
  const randomizedPrompt = basePrompt.replace(/{ANIMAL}/g, randomAnimal.name);
  
  return randomizedPrompt;
}

/**
 * Get a random molten animal
 */
export function getRandomMoltenAnimal(): MoltenAnimal {
  return MOLTEN_ANIMALS[Math.floor(Math.random() * MOLTEN_ANIMALS.length)];
}

/**
 * Get all available molten animals
 */
export function getAllMoltenAnimals(): MoltenAnimal[] {
  return MOLTEN_ANIMALS;
}

