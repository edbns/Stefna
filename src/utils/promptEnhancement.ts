/**
 * Enhanced Prompt Engineering for Gender, Animals, and Groups
 * Based on Stability Ultra documentation for better specificity
 */

export interface EnhancedPromptOptions {
  preserveGender?: boolean;
  preserveAnimals?: boolean;
  preserveGroups?: boolean;
  originalGender?: 'male' | 'female' | 'non-binary' | 'unknown';
  originalAnimals?: string[];
  originalGroups?: string[];
  context?: string;
}

/**
 * Enhances prompts with specific instructions for gender, animals, and groups
 */
export function enhancePromptForSpecificity(
  originalPrompt: string,
  options: EnhancedPromptOptions = {}
): { enhancedPrompt: string; negativePrompt: string } {
  const {
    preserveGender = true,
    preserveAnimals = true,
    preserveGroups = true,
    originalGender,
    originalAnimals = [],
    originalGroups = [],
    context = 'portrait'
  } = options;

  let enhancedPrompt = originalPrompt;
  let negativePrompt = '';

  // Gender-specific enhancements
  if (preserveGender && originalGender) {
    const genderSpecificTerms = {
      male: ['man', 'male', 'masculine', 'guy', 'gentleman'],
      female: ['woman', 'female', 'feminine', 'lady', 'girl'],
      'non-binary': ['person', 'individual', 'non-binary', 'androgynous'],
      unknown: ['person', 'individual', 'subject']
    };

    const terms = genderSpecificTerms[originalGender] || genderSpecificTerms.unknown;
    const genderTerm = terms[0]; // Use primary term

    // Add gender-specific weight to the prompt
    enhancedPrompt += ` (${genderTerm}:1.2)`;
    
    // Add to negative prompt to prevent gender changes
    negativePrompt += 'gender change, gender swap, opposite gender, ';
  }

  // Animal-specific enhancements
  if (preserveAnimals && originalAnimals.length > 0) {
    originalAnimals.forEach(animal => {
      // Add animal-specific weight to preserve species
      enhancedPrompt += ` (${animal}:1.1)`;
    });
    
    // Add to negative prompt to prevent species changes
    negativePrompt += 'different animal species, mixed animals, ';
  }

  // Group-specific enhancements
  if (preserveGroups && originalGroups.length > 0) {
    originalGroups.forEach(group => {
      // Add group-specific weight to preserve group identity
      enhancedPrompt += ` (${group}:1.1)`;
    });
    
    // Add to negative prompt to prevent group changes
    negativePrompt += 'different group, group change, ';
  }

  // Add Stability Ultra specific enhancements
  enhancedPrompt += ' high quality, detailed, precise anatomy, accurate features';

  // Enhanced negative prompt for better specificity
  negativePrompt += 'blurry, low quality, distorted anatomy, multiple subjects, deformed, extra limbs, bad anatomy, mutated hands, poorly drawn hands, poorly drawn face, mutation, deformed, ugly, disgusting, blurry, amputation';

  return {
    enhancedPrompt: enhancedPrompt.trim(),
    negativePrompt: negativePrompt.trim()
  };
}

/**
 * Detects gender from prompt using keyword analysis
 */
export function detectGenderFromPrompt(prompt: string): 'male' | 'female' | 'non-binary' | 'unknown' {
  const lowerPrompt = prompt.toLowerCase();
  
  const maleKeywords = ['man', 'male', 'guy', 'gentleman', 'boy', 'he', 'his', 'him'];
  const femaleKeywords = ['woman', 'female', 'lady', 'girl', 'she', 'her', 'hers'];
  const nonBinaryKeywords = ['person', 'individual', 'non-binary', 'androgynous', 'they', 'them', 'their'];
  
  const maleCount = maleKeywords.filter(keyword => lowerPrompt.includes(keyword)).length;
  const femaleCount = femaleKeywords.filter(keyword => lowerPrompt.includes(keyword)).length;
  const nonBinaryCount = nonBinaryKeywords.filter(keyword => lowerPrompt.includes(keyword)).length;
  
  if (maleCount > femaleCount && maleCount > nonBinaryCount) return 'male';
  if (femaleCount > maleCount && femaleCount > nonBinaryCount) return 'female';
  if (nonBinaryCount > maleCount && nonBinaryCount > femaleCount) return 'non-binary';
  
  return 'unknown';
}

/**
 * Detects animals from prompt using keyword analysis
 */
export function detectAnimalsFromPrompt(prompt: string): string[] {
  const lowerPrompt = prompt.toLowerCase();
  const animalKeywords = [
    'dog', 'cat', 'horse', 'bird', 'fish', 'rabbit', 'hamster', 'guinea pig',
    'ferret', 'snake', 'lizard', 'turtle', 'frog', 'toad', 'spider', 'insect',
    'cow', 'pig', 'sheep', 'goat', 'chicken', 'duck', 'goose', 'turkey',
    'elephant', 'lion', 'tiger', 'bear', 'wolf', 'fox', 'deer', 'moose',
    'penguin', 'dolphin', 'whale', 'shark', 'octopus', 'squid', 'crab', 'lobster'
  ];
  
  return animalKeywords.filter(animal => lowerPrompt.includes(animal));
}

/**
 * Detects groups from prompt using keyword analysis
 */
export function detectGroupsFromPrompt(prompt: string): string[] {
  const lowerPrompt = prompt.toLowerCase();
  const groupKeywords = [
    'family', 'couple', 'friends', 'team', 'group', 'crowd', 'audience',
    'class', 'students', 'workers', 'employees', 'colleagues', 'band',
    'orchestra', 'choir', 'dance troupe', 'sports team', 'crew', 'staff'
  ];
  
  return groupKeywords.filter(group => lowerPrompt.includes(group));
}

/**
 * Applies Stability Ultra specific prompt enhancements
 */
export function applyStabilityUltraEnhancements(prompt: string): string {
  // Add Stability Ultra specific terms for better understanding
  let enhanced = prompt;
  
  // Add weight to important terms using (term:weight) syntax
  const importantTerms = ['portrait', 'face', 'person', 'subject', 'photo', 'image'];
  importantTerms.forEach(term => {
    if (enhanced.toLowerCase().includes(term)) {
      enhanced = enhanced.replace(new RegExp(`\\b${term}\\b`, 'gi'), `(${term}:1.1)`);
    }
  });
  
  // Add quality indicators
  enhanced += ' high quality, detailed, professional photography, sharp focus';
  
  return enhanced;
}
