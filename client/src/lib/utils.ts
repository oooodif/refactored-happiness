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
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function downloadPdf(base64Pdf: string, filename: string): void {
  try {
    // Create the blob from the base64 data
    const blob = base64ToBlob(base64Pdf, "application/pdf");
    
    // Download the blob
    downloadBlob(blob, `${getReadableFilename(filename)}.pdf`);
    
    console.log("PDF download initiated successfully");
  } catch (error) {
    console.error("Error downloading PDF:", error);
    throw new Error("Failed to download PDF");
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
