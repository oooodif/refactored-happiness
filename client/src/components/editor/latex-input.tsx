import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { DOCUMENT_TYPES, LATEX_TEMPLATES } from "@/lib/constants";

interface LatexInputProps {
  value: string;
  onChange: (value: string) => void;
  onGenerate: () => void;
  documentType: string;
  onDocumentTypeChange: (type: string) => void;
  generating: boolean;
}

export default function LatexInput({
  value,
  onChange,
  onGenerate,
  documentType,
  onDocumentTypeChange,
  generating
}: LatexInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isReady, setIsReady] = useState(true);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  // Detect if the device is mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

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
  
  // Set up keyboard detection (for mobile devices)
  useEffect(() => {
    // Only apply this on mobile devices
    if (!isMobile) return;
    
    // Track original window height
    const originalHeight = window.innerHeight;
    
    // Handle when textarea is focused (keyboard opens)
    const handleFocus = () => {
      // Force immediate keyboard visibility for iOS Safari
      setIsKeyboardVisible(true);
      
      // For iOS Safari, we need to add a class to the body
      document.body.classList.add('keyboard-visible');
      
      // Scroll the textarea into view with a small delay to ensure it works after layout changes
      setTimeout(() => {
        if (textareaRef.current) {
          // Ensure we're in focus and scrolled properly
          textareaRef.current.focus();
          textareaRef.current.scrollIntoView({ behavior: 'smooth' });
        }
      }, 300);
    };
    
    // Handle when textarea is blurred (keyboard closes)
    const handleBlur = () => {
      setIsKeyboardVisible(false);
      document.body.classList.remove('keyboard-visible');
    };
    
    // Detect keyboard through resize events (more reliable on iOS)
    const handleResize = () => {
      // If window height significantly decreases, a keyboard likely appeared
      const heightDifference = originalHeight - window.innerHeight;
      const visualViewportHeight = window.visualViewport?.height || window.innerHeight;
      
      // More aggressive detection for iOS Safari
      if (heightDifference > 100 || visualViewportHeight < originalHeight * 0.8) {
        setIsKeyboardVisible(true);
        document.body.classList.add('keyboard-visible');
        
        // When keyboard appears through resize, scroll textarea into view
        if (textareaRef.current) {
          textareaRef.current.scrollIntoView({ behavior: 'smooth' });
        }
      } else {
        setIsKeyboardVisible(false);
        document.body.classList.remove('keyboard-visible');
      }
    };
    
    // Get the textarea element
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.addEventListener('focus', handleFocus);
      textarea.addEventListener('blur', handleBlur);
    }
    
    // Add resize and visualViewport listeners for more reliable detection
    window.addEventListener('resize', handleResize);
    
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleResize);
    }
    
    return () => {
      if (textarea) {
        textarea.removeEventListener('focus', handleFocus);
        textarea.removeEventListener('blur', handleBlur);
      }
      
      window.removeEventListener('resize', handleResize);
      
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleResize);
      }
    };
  }, [isMobile]);

  // Determine the CSS classes for the container based on keyboard visibility
  const containerClasses = isMobile
    ? `w-full h-full flex flex-col border-r border-gray-200 ${
        isKeyboardVisible 
          ? "mobile-keyboard-open fixed top-0 left-0 right-0 bottom-0 z-[9999] bg-white transition-all duration-300 ease-in-out ios-fullscreen-input" 
          : "transition-all duration-300 ease-in-out"
      }`
    : "w-full h-full flex flex-col border-r border-gray-200";
    
  // Extra safeguard for forcing fullscreen on iOS
  useEffect(() => {
    if (isMobile && isKeyboardVisible) {
      // Delay slightly to let the keyboard fully appear
      setTimeout(() => {
        // Force scrolling to the textarea element
        if (textareaRef.current) {
          textareaRef.current.focus();
          window.scrollTo(0, 0); // Reset scroll position
        }
        
        // Apply a full viewport height to ensure we take over the screen
        const rootElement = document.documentElement;
        rootElement.style.setProperty('--keyboard-viewport-height', `${window.visualViewport?.height || window.innerHeight}px`);
      }, 100);
    }
  }, [isMobile, isKeyboardVisible]);

  return (
    <div className={containerClasses}>
      <div className={`p-4 border-b border-gray-200 glass ${isMobile && isKeyboardVisible ? 'shrink-0' : ''}`}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold enhanced-heading">Input</h2>
          <div className="flex items-center space-x-2">
            {!isKeyboardVisible && (
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
            )}
            {isMobile && isKeyboardVisible && (
              <Button
                variant="ghost"
                size="sm"
                className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
                onClick={() => {
                  if (textareaRef.current) {
                    textareaRef.current.blur();
                  }
                }}
              >
                Done
              </Button>
            )}
          </div>
        </div>
        {(!isMobile || !isKeyboardVisible) && (
          <div className="flex space-x-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              className="text-xs glass-card border border-gray-300 text-gray-700 rounded px-2 py-1 mb-2 transition-all duration-300 hover:shadow-md hover:translate-y-[-1px]"
              onClick={() => insertTemplate("math")}
            >
              <span className="font-mono gradient-text">Σ</span> Math
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-xs glass-card border border-gray-300 text-gray-700 rounded px-2 py-1 mb-2 transition-all duration-300 hover:shadow-md hover:translate-y-[-1px]"
              onClick={() => insertTemplate("table")}
            >
              <span className="font-mono gradient-text">⊞</span> Table
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-xs glass-card border border-gray-300 text-gray-700 rounded px-2 py-1 mb-2 transition-all duration-300 hover:shadow-md hover:translate-y-[-1px]"
              onClick={() => insertTemplate("figure")}
            >
              <span className="font-mono gradient-text">⊛</span> Figure
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-xs glass-card border border-gray-300 text-gray-700 rounded px-2 py-1 mb-2 transition-all duration-300 hover:shadow-md hover:translate-y-[-1px]"
              onClick={() => insertTemplate("section")}
            >
              <span className="font-mono gradient-text">§</span> Section
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-xs glass-card border border-gray-300 text-gray-700 rounded px-2 py-1 mb-2 transition-all duration-300 hover:shadow-md hover:translate-y-[-1px]"
              onClick={() => insertTemplate("list")}
            >
              <span className="font-mono gradient-text">•</span> List
            </Button>
            {documentType === 'presentation' && (
              <Button
                variant="outline"
                size="sm"
                className="text-xs glass-card border border-gray-300 text-gray-700 rounded px-2 py-1 mb-2 transition-all duration-300 hover:shadow-md hover:translate-y-[-1px]"
                onClick={() => insertTemplate("slide")}
              >
                <span className="font-mono gradient-text">▦</span> New Slide
              </Button>
            )}
          </div>
        )}
      </div>
      <div className={`flex-1 overflow-auto p-4 bg-gray-50 ${isMobile && isKeyboardVisible ? 'h-full' : ''}`}>
        <textarea
          ref={textareaRef}
          className={`w-full h-full p-3 rounded-md border border-gray-300 glass-card font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:shadow-lg ${isMobile ? 'transition-all duration-300 ease-in-out transform' : ''}`}
          placeholder={documentType === 'presentation' 
            ? "Describe your slide show here, paste report or paper here, or design your slides using the buttons above. Use the 'New Slide' button to add slides."
            : "Enter your content here. Use the buttons above to insert templates, or use tags like <MATHEQ>E = mc^2</MATHEQ> for math equations. No LaTeX knowledge required!"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
      <div className={`p-4 glass border-t border-gray-200 ${isMobile && isKeyboardVisible ? 'hidden' : 'transition-opacity duration-300 ease-in-out'}`}>
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
              className="bg-gradient-to-r from-blue-500 to-blue-700 text-white transition-all duration-300 hover:shadow-md hover:translate-y-[-1px]"
              onClick={onGenerate}
              disabled={!isReady || generating}
            >
              {generating ? "Generating..." : "Generate LaTeX"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
