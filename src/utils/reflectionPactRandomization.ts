// src/utils/reflectionPactRandomization.ts

/**
 * Reflection Pact Randomization Utility
 * Generates randomized animal selections for the Reflection Pact preset
 */

export const REFLECTION_PACT_ANIMALS: string[] = [
  'White Wolf',
  'Black Panther',
  'Snow Leopard',
  'Lioness',
  'Stag with Antlers',
  'Black Stallion',
  'Jaguar',
  'Red Fox',
  'Arctic Fox',
  'Elephant',
  'Falcon',
  'Raven',
  'Crow',
  'Snowy Owl',
  'Barn Owl',
  'Golden Eagle',
  'Bald Eagle',
  'Cheetah',
  'Bison'
];

// Animal rotation state - tracks which animals have been used recently
let animalRotationState = {
  usedAnimals: [] as number[],
  lastReset: Date.now()
};

/**
 * Get the next animal in rotation, ensuring all animals are used before repeating
 */
function getNextAnimalInRotation(): number {
  const now = Date.now();
  
  // Reset rotation state every 5 minutes to allow for fresh starts
  if (now - animalRotationState.lastReset > 5 * 60 * 1000) {
    animalRotationState.usedAnimals = [];
    animalRotationState.lastReset = now;
  }
  
  // If we've used all animals, reset the used list
  if (animalRotationState.usedAnimals.length >= REFLECTION_PACT_ANIMALS.length) {
    animalRotationState.usedAnimals = [];
  }
  
  // Get available animals (not used recently)
  const availableAnimals = [];
  for (let i = 0; i < REFLECTION_PACT_ANIMALS.length; i++) {
    if (!animalRotationState.usedAnimals.includes(i)) {
      availableAnimals.push(i);
    }
  }
  
  // If no available animals (shouldn't happen), reset and use all
  if (availableAnimals.length === 0) {
    animalRotationState.usedAnimals = [];
    availableAnimals.push(...Array.from({ length: REFLECTION_PACT_ANIMALS.length }, (_, i) => i));
  }
  
  // Randomly select from available animals
  const selectedIndex = availableAnimals[Math.floor(Math.random() * availableAnimals.length)];
  
  // Mark this animal as used
  animalRotationState.usedAnimals.push(selectedIndex);
  
  return selectedIndex;
}

/**
 * Generate a randomized Reflection Pact prompt
 * @param basePrompt The base prompt template with {ANIMAL} placeholder
 * @returns Randomized prompt with selected animal
 */
export function generateReflectionPactPrompt(basePrompt: string): string {
  // Use rotation system to ensure all animals are used before repeating
  const animalIndex = getNextAnimalInRotation();
  const selectedAnimal = REFLECTION_PACT_ANIMALS[animalIndex];
  
  console.log('🪞 [Reflection Pact] Selected animal:', selectedAnimal);
  
  // Replace the {ANIMAL} placeholder in the base prompt
  const randomizedPrompt = basePrompt.replace(/{ANIMAL}/g, selectedAnimal);
  
  return randomizedPrompt;
}

/**
 * Get a random animal (for fallback or manual selection)
 */
export function getRandomAnimal(): string {
  return REFLECTION_PACT_ANIMALS[Math.floor(Math.random() * REFLECTION_PACT_ANIMALS.length)];
}

/**
 * Get all available animals
 */
export function getAllAnimals(): string[] {
  return [...REFLECTION_PACT_ANIMALS];
}

