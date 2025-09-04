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
  negativePrompt += 'cartoonish, exaggerated features, overly large eyes, gender swap, multiple subjects, low quality, mutated hands, poorly drawn face';

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
  
  // Use word boundaries to avoid false positives (e.g., "human" containing "man")
  const maleKeywords = ['\\bman\\b', '\\bmale\\b', '\\bguy\\b', '\\bgentleman\\b', '\\bboy\\b', '\\bhe\\b', '\\bhis\\b', '\\bhim\\b'];
  const femaleKeywords = ['\\bwoman\\b', '\\bfemale\\b', '\\blady\\b', '\\bgirl\\b', '\\bshe\\b', '\\bher\\b', '\\bhers\\b'];
  const nonBinaryKeywords = ['\\bperson\\b', '\\bindividual\\b', '\\bnon-binary\\b', '\\bandrogynous\\b', '\\bthey\\b', '\\bthem\\b', '\\btheir\\b'];
  
  const maleCount = maleKeywords.filter(keyword => new RegExp(keyword).test(lowerPrompt)).length;
  const femaleCount = femaleKeywords.filter(keyword => new RegExp(keyword).test(lowerPrompt)).length;
  const nonBinaryCount = nonBinaryKeywords.filter(keyword => new RegExp(keyword).test(lowerPrompt)).length;
  
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
    '\\bdog\\b', '\\bcat\\b', '\\bhorse\\b', '\\bbird\\b', '\\bfish\\b', '\\brabbit\\b', '\\bhamster\\b', '\\bguinea pig\\b',
    '\\bferret\\b', '\\bsnake\\b', '\\blizard\\b', '\\bturtle\\b', '\\bfrog\\b', '\\btoad\\b', '\\bspider\\b', '\\binsect\\b',
    '\\bcow\\b', '\\bpig\\b', '\\bsheep\\b', '\\bgoat\\b', '\\bchicken\\b', '\\bduck\\b', '\\bgoose\\b', '\\bturkey\\b',
    '\\belephant\\b', '\\blion\\b', '\\btiger\\b', '\\bbear\\b', '\\bwolf\\b', '\\bfox\\b', '\\bdeer\\b', '\\bmoose\\b',
    '\\bpenguin\\b', '\\bdolphin\\b', '\\bwhale\\b', '\\bshark\\b', '\\boctopus\\b', '\\bsquid\\b', '\\bcrab\\b', '\\blobster\\b'
  ];
  
  return animalKeywords.filter(animal => new RegExp(animal).test(lowerPrompt));
}

/**
 * Detects groups from prompt using keyword analysis
 */
export function detectGroupsFromPrompt(prompt: string): string[] {
  const lowerPrompt = prompt.toLowerCase();
  const groupKeywords = [
    '\\bfamily\\b', '\\bcouple\\b', '\\bfriends\\b', '\\bteam\\b', '\\bgroup\\b', '\\bcrowd\\b', '\\baudience\\b',
    '\\bclass\\b', '\\bstudents\\b', '\\bworkers\\b', '\\bemployees\\b', '\\bcolleagues\\b', '\\bband\\b',
    '\\borchestra\\b', '\\bchoir\\b', '\\bdance troupe\\b', '\\bsports team\\b', '\\bcrew\\b', '\\bstaff\\b'
  ];
  
  return groupKeywords.filter(group => new RegExp(group).test(lowerPrompt));
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
