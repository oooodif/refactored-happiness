import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "...";
}

/**
 * Convert a display title to a proper filename for downloads
 * For example: "The Paradox of Pleasure and Pain" -> "TheParadoxOfPleasureAndPain.pdf"
 */
export function getReadableFilename(title: string): string {
  // If title is empty or just whitespace, return a default
  if (!title || !title.trim()) {
    return "GeneratedDocument";
  }
  
  // 1. Convert to PascalCase (removing spaces and capitalizing words)
  // First convert special chars to spaces, then remove extra spaces, and capitalize each word
  const pascalCaseTitle = title
    .replace(/[^\w\s]/g, " ")  // Replace special chars with spaces
    .replace(/\s+/g, " ")      // Replace multiple spaces with a single space
    .trim()                    // Remove leading/trailing spaces
    .split(" ")                // Split by space
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()) // Capitalize first letter of each word
    .join("");                 // Join without spaces
    
  // 2. Ensure the filename doesn't exceed reasonable length
  return pascalCaseTitle.substring(0, 100);
}

export function base64ToBlob(base64: string, mimeType: string): Blob {
  // Check if the string contains a data URL prefix (e.g., "data:application/pdf;base64,")
  let byteString: string;
  if (base64.includes(',')) {
    // Handle data URL format
    byteString = atob(base64.split(',')[1]);
  } else {
    // Handle raw base64 string
    try {
      byteString = atob(base64);
    } catch (error) {
      console.error('Invalid base64 string:', error);
      // Fallback to empty PDF if decoding fails
      byteString = '';
    }
  }
  
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  
  return new Blob([ab], { type: mimeType });
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  
  // Force a meaningful filename that appears in the browser's save dialog
  // Some browsers may ignore this, but most modern browsers respect it
  a.setAttribute("download", filename);
  
  // For older or problematic browsers, we can try to set Content-Disposition
  // Note: This may not work in all browsers due to security restrictions
  if (navigator.userAgent.indexOf("Safari") > -1 && navigator.userAgent.indexOf("Chrome") === -1) {
    // Special handling for Safari which may ignore download attribute
    // We create a temporary link and simulate a user interaction
    document.body.appendChild(a);
    a.dispatchEvent(new MouseEvent('click', { 
      bubbles: true, 
      cancelable: true, 
      view: window 
    }));
    document.body.removeChild(a);
  } else {
    // Standard approach for most browsers
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
  
  setTimeout(() => {
    // Clean up the URL object after download has started
    URL.revokeObjectURL(url);
  }, 100);
}

export function downloadPdf(base64Data: string, filename: string, isHtml: boolean = false): void {
  try {
    // Create a properly formatted filename from the title
    const properFilename = getReadableFilename(filename);
    
    if (isHtml) {
      // Handle HTML content
      const blob = base64ToBlob(base64Data, "text/html");
      
      // Download as HTML file
      downloadBlob(blob, `${properFilename}.html`);
      
      console.log(`HTML download initiated with filename: ${properFilename}.html`);
    } else {
      // Handle PDF content (default)
      const blob = base64ToBlob(base64Data, "application/pdf");
      
      // Download as PDF file
      downloadBlob(blob, `${properFilename}.pdf`);
      
      console.log(`PDF download initiated with filename: ${properFilename}.pdf`);
    }
  } catch (error) {
    console.error("Error downloading document:", error);
    throw new Error("Failed to download document");
  }
}

export function copyToClipboard(text: string): Promise<boolean> {
  return navigator.clipboard.writeText(text)
    .then(() => true)
    .catch(() => false);
}

export function isValidLatex(latex: string): boolean {
  // Basic validation - checks for balanced braces
  let openBraces = 0;
  
  for (let i = 0; i < latex.length; i++) {
    if (latex[i] === '{') openBraces++;
    else if (latex[i] === '}') openBraces--;
    
    if (openBraces < 0) return false;
  }
  
  return openBraces === 0 && latex.includes('\\documentclass') && latex.includes('\\begin{document}') && latex.includes('\\end{document}');
}

export function extractLatexErrors(errorMessage: string): { line: number; message: string; }[] {
  const errors: { line: number; message: string }[] = [];
  const lines = errorMessage.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    // Look for common LaTeX error patterns
    const lineMatch = lines[i].match(/line (\d+):/);
    if (lineMatch && i < lines.length - 1) {
      errors.push({
        line: parseInt(lineMatch[1], 10),
        message: lines[i+1].trim()
      });
    }
  }
  
  return errors;
}

export function getUsageColor(used: number, limit: number): string {
  const percentage = (used / limit) * 100;
  if (percentage >= 90) return "text-red-600";
  if (percentage >= 70) return "text-amber-600";
  return "text-emerald-600";
}

/**
 * Checks if the current device is a mobile device
 * @returns {boolean} true if the device is mobile
 */
export function isMobileDevice(): boolean {
  // Simple check for mobile devices using window.innerWidth
  if (typeof window !== 'undefined') {
    // Check for mobile screen sizes (typically under 768px)
    return window.innerWidth < 768 || 
      // Also check user agent as a fallback
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }
  return false;
}

/**
 * Parse notes that may contain OMIT tags and determine processing strategy
 * @param notes User's modification notes that might contain OMIT tags
 * @returns Object with processed notes content and processing flags
 */
export function parseNotesWithOmitTags(notes: string): {
  processedNotes: string;
  containsOmitTags: boolean;
  isStrictOmit: boolean;
} {
  if (!notes) {
    return {
      processedNotes: "",
      containsOmitTags: false,
      isStrictOmit: false
    };
  }

  // Check if the entire content is wrapped in OMIT tags (strict omit case)
  // Using dot-all pattern without 's' flag for better compatibility
  const strictOmitPattern = /^\s*<OMIT>([\s\S]*?)<\/OMIT>\s*$/;
  const strictOmitMatch = notes.match(strictOmitPattern);
  
  if (strictOmitMatch) {
    return {
      processedNotes: strictOmitMatch[1].trim(),
      containsOmitTags: true,
      isStrictOmit: true
    };
  }
  
  // Check for embedded OMIT tags in a mixed content request
  const omitTagPattern = /<OMIT>([\s\S]*?)<\/OMIT>/g;
  const hasOmitTags = omitTagPattern.test(notes);
  
  if (hasOmitTags) {
    // Reset regex after testing
    omitTagPattern.lastIndex = 0;
    
    // Replace OMIT tags with clearer instructions
    const processedNotes = notes.replace(omitTagPattern, (match, content) => {
      return `[REMOVE THIS CONTENT: "${content.trim()}"]`;
    });
    
    return {
      processedNotes,
      containsOmitTags: true,
      isStrictOmit: false
    };
  }
  
  // No OMIT tags found, return original notes
  return {
    processedNotes: notes,
    containsOmitTags: false,
    isStrictOmit: false
  };
}
