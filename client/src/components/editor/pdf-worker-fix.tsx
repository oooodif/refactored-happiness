import { pdfjs } from 'react-pdf';

// Workaround for loading PDF.js worker in Vite/React environment
// Instead of loading from external URL (which can be blocked), we use a CDN version
const loadPdfWorker = () => {
  return new Promise<boolean>((resolve) => {
    try {
      // Use the CDN version of the worker
      pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
      resolve(true);
    } catch (error) {
      console.error('Failed to set PDF.js worker source:', error);
      resolve(false);
    }
  });
};

// Initialize PDF.js worker
export const setupPdfWorker = async () => {
  try {
    const success = await loadPdfWorker();
    return success;
  } catch (error) {
    console.error('Failed to load PDF.js worker:', error);
    return false;
  }
};

// Set a default worker source as fallback
// This will be used if setupPdfWorker is not called or fails
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;