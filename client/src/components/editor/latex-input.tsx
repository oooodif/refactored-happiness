import { useState, useEffect, useRef, useContext } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { DOCUMENT_TYPES, LATEX_TEMPLATES } from "@/lib/constants";
import { UserContext } from "@/App";
import { useAnonymousStatus } from "@/hooks/use-anonymous-status";
import AnonymousUserPopup from "@/components/dialogs/anonymous-user-popup";

interface LatexInputProps {
  value: string;
  onChange: (value: string) => void;
  onGenerate: () => void;
  onModify?: (notes: string, isOmit: boolean) => void;
  documentType: string;
  onDocumentTypeChange: (type: string) => void;
  generating: boolean;
  hasLatexContent?: boolean;
}

export default function LatexInput({
  value,
  onChange,
  onGenerate,
  onModify,
  documentType,
  onDocumentTypeChange,
  generating,
  hasLatexContent = false
}: LatexInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const notesInputRef = useRef<HTMLInputElement>(null);
  const [isReady, setIsReady] = useState(true);
  const [notes, setNotes] = useState("");
  
  // Anonymous user popup state
  const [showAnonymousPopup, setShowAnonymousPopup] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const { session } = useContext(UserContext);
  const anonymousStatus = useAnonymousStatus();
  
  // Check if the user is anonymous
  const isAnonymous = !session?.user && anonymousStatus.data?.isAnonymous;
  const hasRemainingUsage = anonymousStatus.data?.hasRemainingUsage ?? false;

  const insertTemplate = (templateId: string) => {
    if (!textareaRef.current) return;
    
    const template = LATEX_TEMPLATES[templateId as keyof typeof LATEX_TEMPLATES];
    if (!template) return;
    
    const textarea = textareaRef.current;
    const startPos = textarea.selectionStart;
    const endPos = textarea.selectionEnd;
    const beforeText = textarea.value.substring(0, startPos);
    const afterText = textarea.value.substring(endPos);
    const newValue = beforeText + template + afterText;
    
    onChange(newValue);
    
    // Focus and set selection after the template is inserted
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        const newCursorPos = startPos + template.length;
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 0);
  };

  const handleClear = () => {
    if (window.confirm("Are you sure you want to clear the editor?")) {
      onChange("");
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    }
  };

  // Check if the input is ready for generation
  useEffect(() => {
    setIsReady(value.trim().length > 0);
  }, [value]);
  
  // Handle anonymous user popup display
  const handleTextareaFocus = () => {
    // Only show popup for anonymous users who haven't interacted yet
    if (isAnonymous && !hasInteracted) {
      setShowAnonymousPopup(true);
      setHasInteracted(true);
      
      // Store in localStorage that the user has seen the popup
      localStorage.setItem('anonymous_popup_shown', 'true');
    }
  };
  
  // Check if popup has been shown previously
  useEffect(() => {
    const popupShown = localStorage.getItem('anonymous_popup_shown') === 'true';
    setHasInteracted(popupShown);
  }, []);

  return (
    <div className="w-full h-full flex flex-col border-r border-gray-200">
      <div className="p-4 border-b border-gray-200 glass">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold enhanced-heading">Input</h2>
          <div className="flex items-center space-x-2">
            <Select
              value={documentType}
              onValueChange={(value) => onDocumentTypeChange(value)}
            >
              <SelectTrigger className="glass-card border border-gray-300 text-gray-700 text-sm rounded-md h-9 px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="glass-card">
                {DOCUMENT_TYPES.map((type) => (
                  <SelectItem key={type.id} value={type.id}>
                    {type.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex space-x-2 items-center">
          <div className="flex-1 mr-2 relative group">
            <div className="relative w-full">
              <input
                type="text"
                ref={notesInputRef}
                placeholder={hasLatexContent 
                  ? "Enter modification instructions or text to omit..." 
                  : "Notes (available after generation)"}
                className={`w-full glass-card border border-gray-300 text-sm rounded-md h-9 px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  hasLatexContent ? "text-gray-700" : "text-gray-400 bg-gray-50"
                }`}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                disabled={generating || !hasLatexContent}
                title={hasLatexContent ? "Enter instructions to modify your LaTeX" : "Generate LaTeX content first to enable modifications"}
              />
              {/* This overlay will only show when the input is disabled */}
              {!hasLatexContent && (
                <div className="absolute inset-0 bg-gray-200 bg-opacity-50 rounded-md pointer-events-none"></div>
              )}
            </div>
            {!hasLatexContent && (
              <div className="absolute pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200 -top-10 left-0 bg-gray-800 text-white text-xs rounded py-1 px-2 whitespace-nowrap z-10">
                Generate LaTeX content first to enable notes
                <div className="absolute bottom-0 left-4 transform translate-y-1/2 rotate-45 w-2 h-2 bg-gray-800"></div>
              </div>
            )}
          </div>
          <div className="relative group">
            <Button
              variant="outline"
              size="sm"
              className={`text-xs glass-card border border-gray-300 rounded px-3 py-1 transition-all duration-300 hover:shadow-md ${
                hasLatexContent ? "hover:bg-red-50 hover:border-red-300 text-gray-700" : "text-gray-400 bg-gray-50 cursor-not-allowed"
              }`}
              onClick={() => {
                if (hasLatexContent) {
                  if (notes.trim()) {
                    // If there's already text, wrap it in OMIT tags but DON'T send
                    // Just update the notes field with the wrapped content
                    setNotes(`<OMIT>${notes.trim()}</OMIT>`);
                    
                    // Focus on the notes field after wrapping
                    if (notesInputRef.current) {
                      notesInputRef.current.focus();
                    }
                  } else {
                    // If no text yet, just insert the OMIT placeholder in the notes field
                    setNotes("<OMIT> Place Omission Request Here </OMIT>");
                    if (notesInputRef.current) {
                      notesInputRef.current.focus();
                      // Place cursor between the tags (after the opening prompt text)
                      const cursorPosition = "<OMIT> ".length;
                      setTimeout(() => {
                        notesInputRef.current?.setSelectionRange(cursorPosition, cursorPosition + "Place Omission Request Here".length);
                      }, 10);
                    }
                  }
                }
              }}
              disabled={generating || !hasLatexContent}
            >
              <span className={`font-mono mr-1 ${hasLatexContent ? "text-red-600" : "text-gray-400"}`}>✂</span> OMIT
            </Button>
            <div className="absolute pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200 -top-16 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs rounded py-1 px-2 whitespace-nowrap z-10 w-64 text-center">
              {hasLatexContent 
                ? "Click to add OMIT tags in the notes field, or wrap existing text in OMIT tags" 
                : "Generate LaTeX content first to enable the OMIT function"}
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 rotate-45 w-2 h-2 bg-gray-800"></div>
            </div>
          </div>
          <div className="relative group">
            <Button
              className={`text-sm bg-gradient-to-r from-blue-500 to-blue-700 text-white transition-all duration-300 hover:shadow-md hover:translate-y-[-1px] ${
                !hasLatexContent || notes.trim().length === 0 || generating ? "opacity-50 cursor-not-allowed" : "opacity-100"
              }`}
              onClick={() => {
                if (notes.trim().length > 0 && onModify && hasLatexContent) {
                  // Call modify with isOmit=false
                  onModify(notes.trim(), false);
                  setNotes("");
                }
              }}
              disabled={notes.trim().length === 0 || generating || !hasLatexContent}
            >
              SEND
            </Button>
            <div className="absolute pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200 -top-16 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs rounded py-1 px-2 whitespace-nowrap z-10 w-64 text-center">
              {hasLatexContent 
                ? "Sends your notes to update the LaTeX document" 
                : "Generate LaTeX content first to enable this function"}
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 rotate-45 w-2 h-2 bg-gray-800"></div>
            </div>
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-auto p-4 bg-gray-50">
        <textarea
          ref={textareaRef}
          className="w-full h-full p-3 rounded-md border border-gray-300 glass-card font-mono text-sm resize-none transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:shadow-lg"
          placeholder={documentType === 'presentation' 
            ? "Enter your presentation content here—paste it in or type away. No LaTeX knowledge needed! Our AI instantly converts your words into beautifully formatted slides; hit PDF Preview to generate a polished presentation in seconds.\n\nNeed a tiny tweak or omission? Drop a note in the field above after your LaTeX is generated."
            : "Paste or type your content here—no LaTeX knowledge required! Our AI will instantly convert it into clean, publication-ready LaTeX code. Click Generate LaTeX and preview your fully formatted PDF in seconds.\n\nNeed a quick tweak or omission? Simply add a note above after generating your LaTeX."}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={handleTextareaFocus}
        />
        
        {/* Anonymous User Popup */}
        {showAnonymousPopup && isAnonymous && (
          <AnonymousUserPopup 
            usageRemaining={hasRemainingUsage}
            onClose={() => setShowAnonymousPopup(false)}
          />
        )}
      </div>
      <div className="p-4 glass border-t border-gray-200">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            <span className={isReady ? "text-emerald-600 pulse-animation" : "text-amber-600"}>● </span>
            {isReady ? "AI Ready" : "Enter content to generate"}
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              className="glass-card border border-gray-300 text-gray-700 transition-all duration-300 hover:shadow-md"
              onClick={handleClear}
              disabled={generating}
            >
              Clear
            </Button>
            <Button
              className={`bg-gradient-to-r from-blue-500 to-blue-700 text-white transition-all duration-300 hover:shadow-md hover:translate-y-[-1px] ${
                (notes.trim().length > 0 && hasLatexContent) ? "opacity-50 cursor-not-allowed" : "opacity-100"
              }`}
              onClick={onGenerate}
              disabled={!isReady || generating || (notes.trim().length > 0 && hasLatexContent)}
              title={notes.trim().length > 0 && hasLatexContent ? "Clear notes field or use SEND to update existing LaTeX" : "Generate new LaTeX from input"}
            >
              {generating ? "Generating..." : "Generate LaTeX"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
