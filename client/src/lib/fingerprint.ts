/**
 * Simple browser fingerprinting implementation
 * This creates a basic fingerprint based on browser and device characteristics
 * For production use, consider using a moe robust solution like FingerprintJS Pro
 */

interface BrowserDetails {
  userAgent: string;
  language: string;
  colorDepth: number;
  deviceMemory?: number;
  hardwareConcurrency: number;
  screenResolution: number[];
  availableScreenResolution: number[];
  timezoneOffset: number;
  timezone: string;
  sessionStorage: boolean;
  localStorage: boolean;
  indexedDb: boolean;
  plugins: string[];
  canvas: string;
  webgl: string;
}

/**
 * Gets all components needed for fingerprinting
 */
function getFingerPrintComponents(): BrowserDetails {
  const screenResolution =
    typeof window.screen.width !== "undefined"
      ? [window.screen.width, window.screen.height]
      : [];

  const availableScreenResolution =
    typeof window.screen.availWidth !== "undefined"
      ? [window.screen.availWidth, window.screen.availHeight]
      : [];

  // Get installed plugins
  const getPlugins = (): string[] => {
    const plugins: string[] = [];

    // Some browsers don't support navigator.plugins
    if (navigator.plugins) {
      for (let i = 0; i < navigator.plugins.length; i++) {
        const plugin = navigator.plugins[i];
        plugins.push(plugin.name);
      }
    }

    return plugins;
  };

  // Canvas fingerprinting - render a sample canvas and hash the result
  const getCanvasFingerprint = (): string => {
    try {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) return "";

      // Draw a sample text
      canvas.width = 200;
      canvas.height = 50;
      ctx.textBaseline = "top";
      ctx.font = "14px Arial";
      ctx.fillStyle = "#123456";
      ctx.fillText("FingerPrint Sample", 2, 2);
      return canvas.toDataURL().slice(-50); // Use just a small part of the data URL
    } catch (e) {
      return "";
    }
  };

  // WebGL fingerprinting - get WebGL information
  const getWebGLFingerprint = (): string => {
    try {
      const canvas = document.createElement("canvas");
      const gl = canvas.getContext("webgl");
      if (!gl) return "";

      const renderer = gl.getParameter(gl.RENDERER);
      const vendor = gl.getParameter(gl.VENDOR);

      return `${vendor}-${renderer}`;
    } catch (e) {
      return "";
    }
  };

  return {
    userAgent: navigator.userAgent,
    language: navigator.language,
    colorDepth: window.screen.colorDepth,
    deviceMemory: (navigator as any).deviceMemory, // Not supported in all browsers
    hardwareConcurrency: navigator.hardwareConcurrency,
    screenResolution,
    availableScreenResolution,
    timezoneOffset: new Date().getTimezoneOffset(),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    sessionStorage: !!window.sessionStorage,
    localStorage: !!window.localStorage,
    indexedDb: !!window.indexedDB,
    plugins: getPlugins(),
    canvas: getCanvasFingerprint(),
    webgl: getWebGLFingerprint(),
  };
}

/**
 * Generate a browser/device fingerprint as a hash string
 * @returns A string hash representing the browser fingerprint
 */
export function generateFingerprint(): string {
  const components = getFingerPrintComponents();
  const jsonString = JSON.stringify(components);

  // Simple hash function for demonstration purposes
  // For production, use a cryptographic hash function
  return simpleHash(jsonString);
}

/**
 * Simple non-cryptographic hash function
 * For production, use something like SHA-256
 */
function simpleHash(str: string): string {
  let hash = 0;
  if (str.length === 0) return hash.toString(36);

  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }

  return Math.abs(hash).toString(36);
}

/**
 * Store the device fingerprint in localStorage
 */
export function storeFingerprint(): string {
  const fingerprint = generateFingerprint();
  localStorage.setItem("device_fingerprint", fingerprint);
  return fingerprint;
}

/**
 * Get the stored fingerprint or generate a new one
 */
export function getFingerprint(): string {
  const stored = localStorage.getItem("device_fingerprint");
  if (stored) return stored;

  return storeFingerprint();
}

/**
 * Initialize fingerprinting when the module is imported
 */
export function initializeFingerprinting(): void {
  // Generate and store the fingerprint if it doesn't exist
  getFingerprint();

  // Store fingerprint in multiple storage locations for persistence
  try {
    // Local Storage
    localStorage.setItem("device_id", getFingerprint());

    // Session Storage
    sessionStorage.setItem("device_id", getFingerprint());

    // IndexedDB
    const request = indexedDB.open("fingerprint_store", 1);
    request.onupgradeneeded = function () {
      const db = request.result;
      if (!db.objectStoreNames.contains("fingerprints")) {
        db.createObjectStore("fingerprints", { keyPath: "id" });
      }
    };

    request.onsuccess = function () {
      const db = request.result;
      const tx = db.transaction("fingerprints", "readwrite");
      const store = tx.objectStore("fingerprints");
      store.put({ id: 1, fingerprint: getFingerprint() });
    };
  } catch (e) {
    console.warn("Error storing fingerprint", e);
  }
}
