// Location detection utility for SpyDash
export const detectUserLocation = async () => {
  try {
    // Method 1: Try browser geolocation first (most accurate but requires permission)
    if (navigator.geolocation) {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          resolve,
          reject,
          { timeout: 5000, enableHighAccuracy: false }
        );
      });
      
      if (position) {
        const countryCode = await getCountryFromCoordinates(
          position.coords.latitude,
          position.coords.longitude
        );
        if (countryCode) {
          return countryCode;
        }
      }
    }
  } catch (error) {
    console.log('Geolocation not available or denied:', error);
  }

  try {
    // Method 2: Use IP-based geolocation (fallback)
    const ipLocation = await getLocationFromIP();
    if (ipLocation) {
      return ipLocation;
    }
  } catch (error) {
    console.log('IP geolocation failed:', error);
  }

  try {
    // Method 3: Use browser timezone as fallback
    const timezoneLocation = getLocationFromTimezone();
    if (timezoneLocation) {
      return timezoneLocation;
    }
  } catch (error) {
    console.log('Timezone detection failed:', error);
  }

  // Method 4: Use browser language as last fallback
  return getLocationFromLanguage();
};

// Convert coordinates to country code using reverse geocoding
const getCountryFromCoordinates = async (lat, lon) => {
  try {
    // Using a free reverse geocoding service
    const response = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`
    );
    
    if (response.ok) {
      const data = await response.json();
      return data.countryCode;
    }
  } catch (error) {
    console.error('Reverse geocoding failed:', error);
  }
  return null;
};

// Get location from IP address
const getLocationFromIP = async () => {
  try {
    // Try multiple free IP geolocation services
    const services = [
      'https://ipapi.co/country_code/',
      'https://ipinfo.io/country',
      'https://api.country.is/'
    ];

    for (const service of services) {
      try {
        const response = await fetch(service, { timeout: 3000 });
        if (response.ok) {
          const text = await response.text();
          
          // Handle different response formats
          if (service.includes('country.is')) {
            const data = JSON.parse(text);
            return data.country;
          } else {
            return text.trim().toUpperCase();
          }
        }
      } catch (error) {
        console.log(`Service ${service} failed:`, error);
        continue;
      }
    }
  } catch (error) {
    console.error('All IP services failed:', error);
  }
  return null;
};

// Get approximate location from browser timezone
const getLocationFromTimezone = () => {
  try {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    
    const timezoneToCountry = {
      // Americas
      'America/New_York': 'US',
      'America/Chicago': 'US',
      'America/Denver': 'US',
      'America/Los_Angeles': 'US',
      'America/Toronto': 'CA',
      'America/Vancouver': 'CA',
      'America/Sao_Paulo': 'BR',
      'America/Mexico_City': 'MX',
      'America/Argentina/Buenos_Aires': 'AR',
      
      // Europe
      'Europe/London': 'GB',
      'Europe/Paris': 'FR',
      'Europe/Berlin': 'DE',
      'Europe/Rome': 'IT',
      'Europe/Madrid': 'ES',
      'Europe/Amsterdam': 'NL',
      'Europe/Moscow': 'RU',
      
      // Asia
      'Asia/Tokyo': 'JP',
      'Asia/Seoul': 'KR',
      'Asia/Shanghai': 'CN',
      'Asia/Kolkata': 'IN',
      'Asia/Riyadh': 'SA',
      'Asia/Dubai': 'AE',
      
      // Middle East
      'Asia/Baghdad': 'IQ',
      'Asia/Tehran': 'IR',
      'Asia/Amman': 'JO',
      'Asia/Beirut': 'LB',
      
      // Africa
      'Africa/Cairo': 'EG',
      'Africa/Casablanca': 'MA',
      'Africa/Algiers': 'DZ',
      'Africa/Tunis': 'TN',
      
      // Oceania
      'Australia/Sydney': 'AU',
      'Australia/Melbourne': 'AU',
      'Pacific/Auckland': 'NZ'
    };

    return timezoneToCountry[timezone] || null;
  } catch (error) {
    console.error('Timezone detection failed:', error);
    return null;
  }
};

// Get location from browser language as last fallback
const getLocationFromLanguage = () => {
  try {
    const language = navigator.language || navigator.languages[0];
    const languageCode = language.split('-')[0].toLowerCase();
    const countryCode = language.split('-')[1]?.toUpperCase();

    // If we have a country code in the language tag, use it
    if (countryCode && isValidCountryCode(countryCode)) {
      return countryCode;
    }

    // Otherwise, map common languages to likely countries
    const languageToCountry = {
      'ar': 'SA', // Arabic -> Saudi Arabia
      'fr': 'FR', // French -> France
      'es': 'ES', // Spanish -> Spain
      'de': 'DE', // German -> Germany
      'it': 'IT', // Italian -> Italy
      'pt': 'BR', // Portuguese -> Brazil
      'ru': 'RU', // Russian -> Russia
      'ja': 'JP', // Japanese -> Japan
      'ko': 'KR', // Korean -> South Korea
      'zh': 'CN', // Chinese -> China
      'hi': 'IN', // Hindi -> India
      'nl': 'NL', // Dutch -> Netherlands
      'en': 'US'  // English -> US (fallback)
    };

    return languageToCountry[languageCode] || 'US';
  } catch (error) {
    console.error('Language detection failed:', error);
    return 'US'; // Ultimate fallback
  }
};

// Validate country code
const isValidCountryCode = (code) => {
  const validCodes = [
    'US', 'GB', 'CA', 'AU', 'FR', 'DE', 'IT', 'ES', 'NL', 'BR', 'MX', 'AR',
    'JP', 'KR', 'CN', 'IN', 'RU', 'SA', 'AE', 'EG', 'MA', 'DZ', 'TN', 'JO', 'LB'
  ];
  return validCodes.includes(code);
};

// Cache the detected location to avoid repeated calls
let cachedLocation = null;
let cacheTimestamp = null;
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

export const getCachedLocation = async () => {
  // Check if we have a valid cached location
  if (cachedLocation && cacheTimestamp && 
      (Date.now() - cacheTimestamp) < CACHE_DURATION) {
    return cachedLocation;
  }

  // Check localStorage for previously detected location
  const storedLocation = localStorage.getItem('spydash_user_location');
  const storedTimestamp = localStorage.getItem('spydash_location_timestamp');
  
  if (storedLocation && storedTimestamp && 
      (Date.now() - parseInt(storedTimestamp)) < CACHE_DURATION) {
    cachedLocation = storedLocation;
    cacheTimestamp = parseInt(storedTimestamp);
    return cachedLocation;
  }

  // Detect new location
  const detectedLocation = await detectUserLocation();
  
  // Cache the result
  cachedLocation = detectedLocation;
  cacheTimestamp = Date.now();
  
  // Store in localStorage
  localStorage.setItem('spydash_user_location', detectedLocation);
  localStorage.setItem('spydash_location_timestamp', cacheTimestamp.toString());
  
  return detectedLocation;
};