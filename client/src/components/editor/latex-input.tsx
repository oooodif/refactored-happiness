import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { DOCUMENT_TYPES, LATEX_TEMPLATES } from "@/lib/constants";

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
          <div className="flex-1 mr-2">
            <input
              type="text"
              ref={notesInputRef}
              placeholder={hasLatexContent 
                ? "Enter modification instructions or text to omit..." 
                : "Enter notes for generation..."}
              className="w-full glass-card border border-gray-300 text-gray-700 text-sm rounded-md h-9 px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={generating}
            />
          </div>
          {hasLatexContent && (
            <Button
              variant="outline"
              size="sm"
              className="text-xs glass-card border border-gray-300 text-gray-700 rounded px-3 py-1 transition-all duration-300 hover:shadow-md hover:bg-red-50 hover:border-red-300"
              onClick={() => {
                if (notes.trim() && onModify) {
                  // Call modify with isOmit=true
                  onModify(notes.trim(), true);
                  setNotes("");
                }
              }}
              disabled={!notes.trim() || generating}
            >
              <span className="font-mono text-red-600 mr-1">✂</span> OMIT
            </Button>
          )}
          {hasLatexContent && (
            <Button
              variant="outline"
              size="sm"
              className="text-xs glass-card border border-gray-300 text-gray-700 rounded px-3 py-1 transition-all duration-300 hover:shadow-md hover:bg-blue-50 hover:border-blue-300"
              onClick={() => {
                if (notes.trim() && onModify) {
                  // Call modify with isOmit=false
                  onModify(notes.trim(), false);
                  setNotes("");
                }
              }}
              disabled={!notes.trim() || generating}
            >
              <span className="font-mono text-blue-600 mr-1">✏️</span> MODIFY
            </Button>
          )}
        </div>
      </div>
      <div className="flex-1 overflow-auto p-4 bg-gray-50">
        <textarea
          ref={textareaRef}
          className="w-full h-full p-3 rounded-md border border-gray-300 glass-card font-mono text-sm resize-none transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:shadow-lg"
          placeholder={documentType === 'presentation' 
            ? "Describe your slide show here, paste report or paper here, or design your slides using the buttons above. Use the 'New Slide' button to add slides."
            : "Enter your content here. Use the buttons above to insert templates, or use tags like <MATHEQ>E = mc^2</MATHEQ> for math equations. No LaTeX knowledge required!"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
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
