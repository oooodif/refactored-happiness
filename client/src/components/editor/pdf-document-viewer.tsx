import { useState, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import { setupPdfWorker } from './pdf-worker-fix';

interface PDFDocumentViewerProps {
  pdfData: string;
}

export default function PDFDocumentViewer({ pdfData }: PDFDocumentViewerProps) {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [error, setError] = useState<string | null>(null);
  const [scale, setScale] = useState<number>(1.0);
  const [workerReady, setWorkerReady] = useState<boolean>(false);

  // Initialize PDF.js worker when component mounts
  useEffect(() => {
    async function initWorker() {
      try {
        const success = await setupPdfWorker();
        setWorkerReady(success);
        if (!success) {
          setError("Could not load PDF viewer worker. Try downloading the PDF instead.");
        }
      } catch (err) {
        console.error("Error initializing PDF worker:", err);
        setError("Could not initialize PDF viewer. Try downloading the PDF instead.");
      }
    }
    
    initWorker();
  }, []);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setPageNumber(1);
    setError(null);
  };

  const onDocumentLoadError = (err: Error) => {
    console.error('Error loading PDF:', err);
    setError(`Error loading PDF: ${err.message}`);
  };

  // Format the PDF data for react-pdf
  const formatPdfData = (data: string): string => {
    // Check if already has data URL prefix
    if (data.startsWith('data:application/pdf;base64,')) {
      return data;
    }
    
    // Clean the base64 string (remove whitespace, newlines)
    const cleanBase64 = data.replace(/[\r\n\s]/g, '');
    
    // Return with proper data URL format
    return `data:application/pdf;base64,${cleanBase64}`;
  };

  const prevPage = () => {
    setPageNumber(page => Math.max(page - 1, 1));
  };

  const nextPage = () => {
    setPageNumber(page => Math.min(page + 1, numPages || 1));
  };

  const zoomIn = () => {
    setScale(prevScale => Math.min(prevScale + 0.2, 2.5));
  };

  const zoomOut = () => {
    setScale(prevScale => Math.max(prevScale - 0.2, 0.5));
  };

  return (
    <div className="flex flex-col h-full">
      {error ? (
        <div className="flex flex-col items-center justify-center h-full bg-red-50 text-red-500 p-4">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-12 w-12 text-red-400" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={1.5} 
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
            />
          </svg>
          <p className="mt-4 font-medium">{error}</p>
          <p className="text-sm text-red-400 mt-2">Try downloading the PDF instead</p>
        </div>
      ) : (
        <>
          {/* Controls */}
          <div className="flex justify-between items-center bg-gray-50 p-2 border-b">
            <div className="flex items-center space-x-2">
              <button 
                onClick={prevPage}
                disabled={pageNumber <= 1}
                className={`p-1 rounded ${pageNumber <= 1 ? 'text-gray-400' : 'text-blue-500 hover:bg-gray-200'}`}
                aria-label="Previous page"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </button>
              <span className="text-sm">
                Page {pageNumber} of {numPages || '?'}
              </span>
              <button 
                onClick={nextPage}
                disabled={!numPages || pageNumber >= numPages}
                className={`p-1 rounded ${!numPages || pageNumber >= numPages ? 'text-gray-400' : 'text-blue-500 hover:bg-gray-200'}`}
                aria-label="Next page"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
            <div className="flex items-center space-x-2">
              <button 
                onClick={zoomOut}
                className="p-1 rounded text-blue-500 hover:bg-gray-200"
                aria-label="Zoom out"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5 10a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
              </button>
              <span className="text-sm">{Math.round(scale * 100)}%</span>
              <button 
                onClick={zoomIn}
                className="p-1 rounded text-blue-500 hover:bg-gray-200"
                aria-label="Zoom in"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
          
          {/* PDF Viewer */}
          <div className="flex-1 overflow-auto bg-gray-100 flex justify-center p-4">
            <Document
              file={formatPdfData(pdfData)}
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={onDocumentLoadError}
              loading={
                <div className="flex items-center justify-center h-full">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-blue-600"></div>
                </div>
              }
              error={
                <div className="flex flex-col items-center justify-center h-64 text-red-500">
                  <p>Failed to load PDF</p>
                </div>
              }
            >
              <Page 
                pageNumber={pageNumber} 
                scale={scale}
                renderTextLayer={true}
                renderAnnotationLayer={true}
                className="shadow-md"
              />
            </Document>
          </div>
        </>
      )}
    </div>
  );
}