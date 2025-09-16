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
  groupType?: 'solo' | 'couple' | 'family' | 'group';
  faceCount?: number;
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
    context = 'portrait',
    groupType,
    faceCount
  } = options;

  console.log('🔍 [Prompt Enhancement] Starting enhancement:', {
    originalPrompt: originalPrompt.substring(0, 100) + '...',
    originalGender,
    originalAnimals,
    originalGroups,
    context
  });

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

    // Only add gender terms if we're not dealing with animals
    // Check if the prompt contains animal keywords
    const animalKeywords = ['dog', 'cat', 'horse', 'bird', 'fish', 'rabbit', 'hamster', 'cow', 'pig', 'sheep', 'goat', 'chicken', 'duck', 'elephant', 'lion', 'tiger', 'bear', 'wolf', 'fox', 'deer', 'penguin', 'dolphin', 'whale', 'shark'];
    const hasAnimals = animalKeywords.some(animal => originalPrompt.toLowerCase().includes(animal));
    
    if (!hasAnimals) {
      // Add gender-specific weight to the prompt
      enhancedPrompt += ` (${genderTerm}:1.2)`;
      
      // Add to negative prompt to prevent gender changes
      negativePrompt += 'gender change, gender swap, opposite gender, ';
    } else {
      console.log('⚠️ [Prompt Enhancement] Skipping gender terms for animal photo');
    }
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

  // Group-type-specific prompt modifiers
  if (groupType && faceCount) {
    switch (groupType) {
      case 'couple':
        enhancedPrompt = `Transform this couple into a cinematic fashion duo, both styled in matching looks and lighting, each person preserving their original face and identity. ${enhancedPrompt}`;
        negativePrompt += 'extra people, missing person, single person, ';
        break;
        
      case 'family':
        enhancedPrompt = `Transform this family into a stylish modern group, preserving each person's age, face, and group size — children remain children, adults remain adults. ${enhancedPrompt}`;
        negativePrompt += 'age change, missing family member, extra family member, ';
        break;
        
      case 'group':
        enhancedPrompt = `Transform this group into a cohesive fashion collective. No extra people added, no one removed. All original faces must remain the same. ${enhancedPrompt}`;
        negativePrompt += 'extra people, missing people, different group size, ';
        break;
        
      case 'solo':
        // No special modifier needed for solo
        break;
    }
    
    console.log(`🎯 [Prompt Enhancement] Applied ${groupType} modifier for ${faceCount} faces`);
  }

  // Add Stability Ultra specific enhancements
  enhancedPrompt += ' high quality, detailed, precise anatomy, accurate features';

  // Add strong anti-anthropomorphism for Neo Glitch when source is non-human
  const nonHumanKeywords = [
    'tree','plant','flower','rock','mountain','landscape','forest','river','ocean','lake','waterfall','building','architecture','cityscape','car','vehicle','boat','plane','airplane','train','road','street','sky','cloud','sunset','sunrise','beach','desert','snow','ice','fire','smoke'
  ];
  const promptLower = originalPrompt.toLowerCase();
  const hasNonHumanSubject = originalAnimals.length > 0 || nonHumanKeywords.some(k => promptLower.includes(k));

  // Reverted neo_glitch-specific blocks (handled by presets/providers instead)

  // Enhanced negative prompt for better specificity (general)
  negativePrompt += ', cartoonish, exaggerated features, overly large eyes, gender swap, multiple subjects, low quality, mutated hands, poorly drawn face';

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
 * Detects couples from prompt using romantic/intimate keywords
 */
export function detectCoupleFromPrompt(prompt: string): boolean {
  const lowerPrompt = prompt.toLowerCase();
  const coupleKeywords = [
    '\\bcouple\\b', '\\btogether\\b', '\\bromantic\\b', '\\blovers\\b', '\\bpartners\\b', '\\bholding hands\\b',
    '\\bembrace\\b', '\\bkiss\\b', '\\bintimate\\b', '\\bwedding\\b', '\\bengagement\\b', '\\banniversary\\b',
    '\\bdate\\b', '\\bdating\\b', '\\brelationship\\b', '\\bpair\\b', '\\bduo\\b', '\\btwosome\\b'
  ];
  
  return coupleKeywords.some(keyword => new RegExp(keyword).test(lowerPrompt));
}

/**
 * Determines group type based on prompt analysis and face count
 */
export function determineGroupType(prompt: string, faceCount: number): 'solo' | 'couple' | 'family' | 'group' {
  const lowerPrompt = prompt.toLowerCase();
  
  // Check for couples first (most specific)
  if (faceCount === 2 && detectCoupleFromPrompt(prompt)) {
    return 'couple';
  }
  
  // Check for family keywords
  const familyKeywords = ['\\bfamily\\b', '\\bparents\\b', '\\bchildren\\b', '\\bmom\\b', '\\bdad\\b', '\\bmother\\b', '\\bfather\\b', '\\bson\\b', '\\bdaughter\\b'];
  const hasFamilyKeywords = familyKeywords.some(keyword => new RegExp(keyword).test(lowerPrompt));
  
  if (hasFamilyKeywords && faceCount >= 2) {
    return 'family';
  }
  
  // Default to group for multiple faces, solo for single face
  if (faceCount === 1) {
    return 'solo';
  } else if (faceCount >= 2) {
    return 'group';
  }
  
  return 'solo';
}

/**
 * Group injection rules for Parallel Self presets
 * Controls which presets allow group/couple prompt injection
 */
export const PARALLEL_SELF_GROUP_INJECTION_MAP: Record<string, ('couple' | 'family' | 'group')[]> = {
  'parallel_self_rain_dancer': ['couple', 'family', 'group'],
  'parallel_self_untouchable': ['couple', 'group'],
  'parallel_self_holiday_mirage': ['couple', 'family'],
  'parallel_self_nightshade': ['couple', 'group'],
  'parallel_self_afterglow': ['couple'], // NOT family or group
  // 'parallel_self_one_that_got_away' intentionally excluded - solo narrative only
};

/**
 * Gets group-specific prompt prefix based on group type
 */
export function getGroupPromptPrefix(groupType: 'solo' | 'couple' | 'family' | 'group'): string {
  switch (groupType) {
    case 'couple':
      return "Keep both faces unchanged. Do not add extra people. Transform them together as a duo.";
      
    case 'family':
      return "Keep children and adults unchanged. Stylize the family but preserve age, identity, and group size.";
      
    case 'group':
      return "Maintain the group's original faces. Do not add or remove anyone. Stylize as a coordinated group.";
      
    case 'solo':
    default:
      return ""; // No prefix needed for solo
  }
}

/**
 * Checks if group injection should be applied for a specific preset
 */
export function shouldApplyGroupInjection(presetId: string, groupType: 'solo' | 'couple' | 'family' | 'group'): boolean {
  // Never inject for solo
  if (groupType === 'solo') return false;
  
  // Check if preset allows this group type
  const allowedGroups = PARALLEL_SELF_GROUP_INJECTION_MAP[presetId];
  return allowedGroups?.includes(groupType) ?? false;
}

/**
 * Gets group-specific negative prompt additions
 */
export function getGroupNegativePromptAdditions(groupType: 'solo' | 'couple' | 'family' | 'group'): string {
  switch (groupType) {
    case 'couple':
      return ', extra people, missing person, single person, face duplication';
      
    case 'family':
      return ', incorrect age, face swap, character replacement, missing family member, extra family member';
      
    case 'group':
      return ', face duplication, missing faces, extra people, generic characters, different group size';
      
    case 'solo':
    default:
      return ''; // No additions needed for solo
  }
}

/**
 * Applies advanced prompt enhancements for better AI model understanding
 */
export function applyAdvancedPromptEnhancements(prompt: string): string {
  // Don't modify prompts that already have weights to avoid double-weighting
  if (prompt.includes('(') && prompt.includes(')')) {
    console.log('⚠️ [Prompt Enhancement] Skipping enhancement - prompt already has weights');
    return prompt;
  }
  
  let enhanced = prompt;
  
  // Add weight to important terms using (term:weight) syntax
  // Only add weights if the term doesn't already have a weight
  const importantTerms = ['portrait', 'face', 'person', 'subject', 'photo', 'image'];
  importantTerms.forEach(term => {
    const regex = new RegExp(`\\b${term}\\b`, 'gi');
    if (enhanced.toLowerCase().includes(term) && !enhanced.includes(`(${term}:`)) {
      enhanced = enhanced.replace(regex, `(${term}:1.1)`);
    }
  });
  
  // Add quality indicators (only if not already present)
  if (!enhanced.includes('high quality')) {
    enhanced += ' high quality, detailed, professional photography, sharp focus';
  }
  
  return enhanced;
}
