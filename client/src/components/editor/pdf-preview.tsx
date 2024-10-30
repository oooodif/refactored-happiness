import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Document, Page, pdfjs } from "react-pdf";
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

// Set worker URL for react-pdf
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

interface PDFPreviewProps {
  pdfData: string | null;
  title: string;
}

export default function PDFPreview({ pdfData, title }: PDFPreviewProps) {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);

  // Reset to page 1 when a new PDF is loaded
  useEffect(() => {
    setPageNumber(1);
  }, [pdfData]);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  };

  const changePage = (offset: number) => {
    setPageNumber(prevPageNumber => {
      const newPageNumber = prevPageNumber + offset;
      return Math.max(1, Math.min(numPages || 1, newPageNumber));
    });
  };

  const previousPage = () => changePage(-1);
  const nextPage = () => changePage(1);

  const zoomIn = () => setScale(prevScale => Math.min(2.0, prevScale + 0.1));
  const zoomOut = () => setScale(prevScale => Math.max(0.5, prevScale - 0.1));
  const resetZoom = () => setScale(1.0);

  // If no PDF data is available, show a placeholder
  if (!pdfData) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-gray-100 p-4">
        <div className="bg-white p-8 rounded-lg shadow text-center max-w-md">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-16 w-16 mx-auto text-gray-400 mb-4" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={1.5} 
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
            />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No PDF to display</h3>
          <p className="text-gray-600">
            Generate LaTeX content and compile it to see a PDF preview here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-100">
      <div className="flex-1 overflow-auto p-4">
        <div className="flex flex-col items-center">
          <div className="w-full max-w-2xl bg-white shadow-md rounded-md overflow-hidden mb-4">
            <div className="p-4 border-b border-gray-200">
              <h3 className="font-medium text-lg truncate">{title || "Generated Document"}</h3>
              <p className="text-gray-600 text-sm">
                {new Date().toLocaleString()}
              </p>
            </div>
            <div className="relative bg-gray-800 flex justify-center p-2">
              <Document
                file={pdfData.includes("data:application/pdf;base64,") ? pdfData : `data:application/pdf;base64,${pdfData}`}
                onLoadSuccess={onDocumentLoadSuccess}
                className="pdf-document"
                error={
                  <div className="p-8 text-center">
                    <p className="text-red-500">Failed to load PDF. Please try compiling again.</p>
                  </div>
                }
                loading={
                  <div className="p-8 text-center">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-blue-600"></div>
                    <p className="text-gray-500 mt-2">Loading PDF...</p>
                  </div>
                }
              >
                <Page
                  pageNumber={pageNumber}
                  scale={scale}
                  renderTextLayer={true}
                  renderAnnotationLayer={true}
                  className="pdf-page"
                />
              </Document>
            </div>
          </div>
          
          <div className="flex justify-between items-center w-full max-w-2xl bg-white rounded-md shadow p-3 mb-4">
            <Button
              variant="outline"
              onClick={previousPage}
              disabled={pageNumber <= 1}
              className="flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M15.707 15.707a1 1 0 01-1.414 0l-5-5a1 1 0 010-1.414l5-5a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
              Previous
            </Button>
            
            <span className="text-sm text-gray-600">
              Page {pageNumber} of {numPages || 1}
            </span>
            
            <Button
              variant="outline"
              onClick={nextPage}
              disabled={numPages === null || pageNumber >= numPages}
              className="flex items-center"
            >
              Next
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10.293 15.707a1 1 0 010-1.414L14.586 10l-4.293-4.293a1 1 0 111.414-1.414l5 5a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </Button>
          </div>
          
          <div className="flex items-center gap-2 w-full max-w-2xl bg-white rounded-md shadow p-3">
            <Button
              variant="outline"
              size="sm"
              onClick={zoomOut}
              className="px-2 py-1"
              title="Zoom Out"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5 10a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z" clipRule="evenodd" />
              </svg>
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={resetZoom}
              className="px-2 py-1"
              title="Reset Zoom"
            >
              {Math.round(scale * 100)}%
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={zoomIn}
              className="px-2 py-1"
              title="Zoom In"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
