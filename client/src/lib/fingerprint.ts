/**
 * Client-side fingerprinting utility
 * Used to uniquely identify anonymous users for the free conversion feature
 */

const FINGERPRINT_KEY = 'aitexgen_fingerprint';

/**
 * Generate a unique fingerprint for the current browser/device
 * Uses a combination of available browser properties to create a reasonably unique identifier
 */
function generateFingerprint(): string {
  const components = [
    navigator.userAgent,
    navigator.language,
    screen.colorDepth,
    screen.width + 'x' + screen.height,
    new Date().getTimezoneOffset(),
    !!window.sessionStorage,
    !!window.localStorage,
    !!window.indexedDB,
    // Add more components that help uniquely identify the browser
    navigator.hardwareConcurrency,
    // Use deviceMemory if available (not in all browsers)
    'deviceMemory' in navigator ? (navigator as any).deviceMemory : undefined,
    navigator.platform,
  ];

  // Filter out undefined values
  const validComponents = components.filter(item => item !== undefined);
  
  // Join and hash the components
  const fingerprint = hashString(validComponents.join('###'));
  
  // Add a random salt for additional uniqueness
  return fingerprint + '-' + Math.random().toString(36).substring(2, 10);
}

/**
 * Simple string hashing function
 */
function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}

/**
 * Get the current fingerprint from localStorage or create a new one
 */
export function getFingerprint(): string {
  try {
    // Try to get existing fingerprint from localStorage
    const storedFingerprint = localStorage.getItem(FINGERPRINT_KEY);
    
    if (storedFingerprint) {
      return storedFingerprint;
    }
    
    // Generate a new fingerprint
    const newFingerprint = generateFingerprint();
    
    // Store the fingerprint in localStorage
    localStorage.setItem(FINGERPRINT_KEY, newFingerprint);
    
    return newFingerprint;
  } catch (error) {
    // Fallback in case localStorage is not available
    console.error('Error accessing localStorage:', error);
    return generateFingerprint();
  }
}