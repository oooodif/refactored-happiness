import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

interface PDFPreviewProps {
  pdfData: string | null;
  title: string;
  onCompilePdf?: () => void;
  isHtml?: boolean;
}

// Helper function to safely format data
function formatData(pdfData: string | null, isHtml: boolean = false): string | null {
  if (!pdfData) return null;
  
  // For HTML content
  if (isHtml) {
    // Check if already has the data URL prefix
    if (pdfData.startsWith('data:text/html;base64,')) {
      return pdfData;
    }
    
    // When data comes directly from the server, it might include characters that need to be fixed for base64
    // Ensure we're working with clean base64 - remove all whitespace, newlines, and any non-base64 chars
    let cleanBase64 = pdfData.replace(/[\r\n\s]/g, '');
    
    // Check if the cleaned base64 string is valid
    try {
      // This will throw if the string isn't valid base64
      atob(cleanBase64);
    } catch (error) {
      console.error("Invalid base64 HTML data detected, attempting recovery");
      // If there's an error, try a more aggressive cleaning
      cleanBase64 = pdfData.replace(/[^A-Za-z0-9+/=]/g, '');
    }
    
    // Add the prefix
    return `data:text/html;base64,${cleanBase64}`;
  } 
  
  // For PDF content
  // Check if already has the data URL prefix
  if (pdfData.startsWith('data:application/pdf;base64,')) {
    return pdfData;
  }
  
  // When data comes directly from the server, it might include characters that need to be fixed for base64
  // Ensure we're working with clean base64 - remove all whitespace, newlines, and any non-base64 chars
  let cleanBase64 = pdfData.replace(/[\r\n\s]/g, '');
  
  // Check if the cleaned base64 string is valid
  try {
    // This will throw if the string isn't valid base64
    atob(cleanBase64);
  } catch (error) {
    console.error("Invalid base64 data detected, attempting recovery");
    // If there's an error, try a more aggressive cleaning
    cleanBase64 = pdfData.replace(/[^A-Za-z0-9+/=]/g, '');
  }
  
  // Add the prefix
  return `data:application/pdf;base64,${cleanBase64}`;
}

export default function PDFPreview({ pdfData, title, onCompilePdf, isHtml = false }: PDFPreviewProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Format data for iframe based on content type
  const formattedData = pdfData ? formatData(pdfData, isHtml) : null;

  // Reset generating state when data changes
  useEffect(() => {
    if (pdfData) {
      setIsGenerating(false);
    }
  }, [pdfData]);

  // Handle PDF generation button click
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

  // When we have PDF data
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
              <div className="flex space-x-2">
                {pdfData && !errorMessage && !isGenerating && (
                  <Button 
                    onClick={() => {
                      try {
                        const filename = title || "GeneratedDocument";
                        import('@/lib/utils').then(({ downloadPdf }) => {
                          downloadPdf(pdfData, filename, isHtml);
                        });
                      } catch (err) {
                        console.error("Error during PDF download:", err);
                        setErrorMessage("Failed to download document");
                      }
                    }}
                    className="bg-green-600 hover:bg-green-700 text-white text-sm"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    {isHtml ? "Download HTML" : "Download PDF"}
                  </Button>
                )}
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
            </div>
            
            {/* Different content based on state */}
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
            ) : isGenerating ? (
              <div className="flex items-center justify-center h-[650px] bg-gray-100">
                <div className="text-center">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-blue-600 mb-2"></div>
                  <p className="text-gray-500">Loading PDF...</p>
                </div>
              </div>
            ) : (
              <div className="pdf-container w-full h-[650px] bg-gray-100">
                <iframe 
                  src={formattedData || "about:blank"}
                  className="w-full h-full border-0"
                  title={isHtml ? "HTML Preview" : "PDF Viewer"}
                  sandbox={isHtml ? "allow-scripts" : ""}
                />
              </div>
            )}
          </div>
          
          <div className="text-center text-sm text-gray-500 mb-6">
            {isHtml ? (
              <p className="p-2 bg-amber-50 border border-amber-200 rounded-md text-amber-700">
                <strong>Note:</strong> This is an HTML preview. The PDF compilation service is currently unavailable.
              </p>
            ) : (
              <>
                <p>PDF viewing is now handled by your browser's native PDF viewer.</p>
                <p>Use your browser's PDF controls for page navigation and zoom.</p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}