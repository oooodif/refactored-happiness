import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import PDFObject from "pdfobject";

interface PDFPreviewProps {
  pdfData: string | null;
  title: string;
  onCompilePdf?: () => void;
}

// Helper function to safely format PDF data
function formatPdfData(pdfData: string | null): string | null {
  if (!pdfData) return null;
  
  // Check if already has the data URL prefix
  if (pdfData.startsWith('data:application/pdf;base64,')) {
    return pdfData;
  }
  
  // Add the prefix
  return `data:application/pdf;base64,${pdfData}`;
}

export default function PDFPreview({ pdfData, title, onCompilePdf }: PDFPreviewProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const pdfContainerRef = useRef<HTMLDivElement>(null);

  // Reset and embed PDF when data changes
  useEffect(() => {
    if (pdfData && pdfContainerRef.current) {
      setIsGenerating(false);
      setErrorMessage(null);
      
      try {
        const formattedPdfData = formatPdfData(pdfData);
        
        // Use PDFObject to embed the PDF
        const success = PDFObject.embed(formattedPdfData, pdfContainerRef.current, {
          height: "600px",
          fallbackLink: "<p>This browser does not support inline PDFs. Please <a href='[url]'>click here to download the PDF</a>.</p>"
        });
        
        if (!success) {
          setErrorMessage("Your browser cannot display this PDF. You may need to download it instead.");
          console.error("PDFObject failed to embed PDF");
        }
      } catch (error) {
        console.error("Error embedding PDF:", error);
        setErrorMessage("Failed to load PDF. Please try regenerating.");
      }
    }
  }, [pdfData]);

  const handleGeneratePdf = () => {
    if (onCompilePdf) {
      setIsGenerating(true);
      setErrorMessage(null);
      onCompilePdf();
    }
  };

  // If no PDF data is available, show a placeholder with Generate PDF button
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
          <h3 className="text-lg font-medium text-gray-900 mb-2">No PDF Generated Yet</h3>
          <p className="text-gray-600 mb-2">
            LaTeX generation and PDF compilation are now separate steps:
          </p>
          <ol className="text-left text-gray-600 text-sm mb-6 space-y-2">
            <li className="flex items-start">
              <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-blue-100 text-blue-600 text-xs mr-2 mt-0.5">1</span>
              <span><strong>First,</strong> generate LaTeX code from your input content</span>
            </li>
            <li className="flex items-start">
              <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-blue-100 text-blue-600 text-xs mr-2 mt-0.5">2</span>
              <span><strong>Then,</strong> click the button below to compile the LaTeX into a PDF</span>
            </li>
          </ol>
          
          <Button 
            onClick={handleGeneratePdf}
            className="bg-blue-600 hover:bg-blue-700 text-white w-full"
            disabled={isGenerating}
          >
            {isGenerating ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Compiling PDF...
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V8z" clipRule="evenodd" />
                </svg>
                Generate PDF from LaTeX
              </>
            )}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-100">
      <div className="flex-1 overflow-auto p-4">
        <div className="flex flex-col items-center">
          <div className="w-full max-w-4xl bg-white shadow-md rounded-md overflow-hidden mb-4">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <div>
                <h3 className="font-medium text-lg truncate">{title || "Generated Document"}</h3>
                <p className="text-gray-600 text-xs">
                  {new Date().toLocaleString()}
                </p>
              </div>
              {errorMessage && (
                <Button 
                  onClick={handleGeneratePdf}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-sm"
                  disabled={isGenerating}
                >
                  {isGenerating ? "Regenerating..." : "Try Regenerating PDF"}
                </Button>
              )}
            </div>
            
            {errorMessage ? (
              <div className="p-8 text-center">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-16 w-16 mx-auto text-red-400 mb-4" 
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
                <p className="text-red-500 font-medium mb-2">PDF Viewer Error</p>
                <p className="text-gray-600 mb-4">{errorMessage}</p>
                <Button 
                  onClick={handleGeneratePdf}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  disabled={isGenerating}
                >
                  {isGenerating ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Regenerating PDF...
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                      </svg>
                      Try Regenerating PDF
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <div 
                ref={pdfContainerRef} 
                className="pdf-container w-full h-[650px] bg-gray-100"
              >
                {isGenerating && (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-blue-600 mb-2"></div>
                      <p className="text-gray-500">Loading PDF...</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          
          <div className="text-center text-sm text-gray-500 mb-6">
            <p>PDF viewing is now handled by your browser's native PDF viewer.</p>
            <p>Use your browser's PDF controls for page navigation and zoom.</p>
          </div>
        </div>
      </div>
    </div>
  );
}