import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import Prism from "prismjs";
import { copyToClipboard } from "@/lib/utils";

interface LatexOutputProps {
  latexContent: string;
  onDownloadPdf: () => void;
  compilationSuccess: boolean;
  errorMessage?: string;
}

export default function LatexOutput({
  latexContent,
  onDownloadPdf,
  compilationSuccess,
  errorMessage
}: LatexOutputProps) {
  const codeRef = useRef<HTMLElement>(null);
  const { toast } = useToast();

  // Highlight LaTeX code using Prism.js
  useEffect(() => {
    if (codeRef.current && latexContent) {
      Prism.highlightElement(codeRef.current);
    }
  }, [latexContent]);

  const handleCopyLatex = async () => {
    if (!latexContent) return;
    
    const success = await copyToClipboard(latexContent);
    
    if (success) {
      toast({
        title: "Copied!",
        description: "LaTeX code copied to clipboard",
      });
    } else {
      toast({
        title: "Failed to copy",
        description: "Could not copy to clipboard. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-gray-200 glass bg-subtle-green rounded-t-lg">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold enhanced-heading">LaTeX Code</h2>
        </div>
      </div>
      <div className="flex-1 overflow-auto p-4 bg-subtle-green bg-opacity-30">
        <pre className="h-full rounded-md border border-gray-300 bg-gray-900 overflow-auto p-4 m-0 shadow-inner depth-3d-dark">
          <code ref={codeRef} className="language-latex font-mono text-sm whitespace-pre">
            {latexContent || '// Generated LaTeX will appear here'}
          </code>
        </pre>
      </div>
      <div className="p-4 glass border-t border-gray-200 bg-subtle-green rounded-b-lg">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            {latexContent ? (
              compilationSuccess ? (
                <span className="text-emerald-600 pulse-animation">● Compilation Successful</span>
              ) : (
                errorMessage ? (
                  <span className="text-red-600 pulse-animation-error">● Compilation Failed</span>
                ) : (
                  <span className="text-amber-500 pulse-animation-slow">● Awaiting Compilation</span>
                )
              )
            ) : (
              <span className="text-gray-400">● Waiting for content</span>
            )}
          </div>
          <div className="flex space-x-2">
            <Button
              variant="ghost"
              className="glass-card text-gray-700 hover:text-gray-900 px-2 py-1 text-sm flex items-center transition-all duration-300 hover:shadow-md"
              onClick={handleCopyLatex}
              disabled={!latexContent}
              title="Copy LaTeX"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 mr-1"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M8 2a1 1 0 000 2h2a1 1 0 100-2H8z" />
                <path d="M3 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v6h-4.586l1.293-1.293a1 1 0 00-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L10.414 13H15v3a2 2 0 01-2 2H5a2 2 0 01-2-2V5zM15 11h2a1 1 0 110 2h-2v-2z" />
              </svg>
              Copy
            </Button>
            <Button
              className="bg-gradient-to-r from-blue-500 to-blue-700 text-white rounded-md px-4 py-2 text-sm transition-all duration-300 hover:shadow-md hover:translate-y-[-1px] flex items-center"
              onClick={onDownloadPdf}
              disabled={!compilationSuccess}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 mr-1"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
              Download PDF
            </Button>
          </div>
        </div>
        {errorMessage && !compilationSuccess && (
          <div className="mt-2 text-sm text-red-600 p-3 glass-error rounded-md border border-red-300 shadow-sm depth-3d">
            <p className="font-semibold mb-1">Compilation Error:</p>
            <p className="font-mono bg-red-50/50 p-2 rounded">{errorMessage}</p>
          </div>
        )}
      </div>
    </div>
  );
}
