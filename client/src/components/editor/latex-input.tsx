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
      <div className="p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-gray-800">Input</h2>
          <div className="flex items-center space-x-2">
            <Select
              value={documentType}
              onValueChange={(value) => onDocumentTypeChange(value)}
            >
              <SelectTrigger className="bg-white border border-gray-300 text-gray-700 text-sm rounded-md h-9 px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DOCUMENT_TYPES.map((type) => (
                  <SelectItem key={type.id} value={type.id}>
                    {type.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex space-x-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            className="text-xs bg-white hover:bg-gray-100 text-gray-700 rounded border border-gray-300 px-2 py-1 mb-2"
            onClick={() => insertTemplate("math")}
          >
            <span className="font-mono">Σ</span> Math
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-xs bg-white hover:bg-gray-100 text-gray-700 rounded border border-gray-300 px-2 py-1 mb-2"
            onClick={() => insertTemplate("table")}
          >
            <span className="font-mono">⊞</span> Table
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-xs bg-white hover:bg-gray-100 text-gray-700 rounded border border-gray-300 px-2 py-1 mb-2"
            onClick={() => insertTemplate("figure")}
          >
            <span className="font-mono">⊛</span> Figure
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-xs bg-white hover:bg-gray-100 text-gray-700 rounded border border-gray-300 px-2 py-1 mb-2"
            onClick={() => insertTemplate("section")}
          >
            <span className="font-mono">§</span> Section
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-xs bg-white hover:bg-gray-100 text-gray-700 rounded border border-gray-300 px-2 py-1 mb-2"
            onClick={() => insertTemplate("list")}
          >
            <span className="font-mono">•</span> List
          </Button>
          {documentType === 'presentation' && (
            <Button
              variant="outline"
              size="sm"
              className="text-xs bg-white hover:bg-gray-100 text-gray-700 rounded border border-gray-300 px-2 py-1 mb-2"
              onClick={() => insertTemplate("slide")}
            >
              <span className="font-mono">▦</span> New Slide
            </Button>
          )}
        </div>
      </div>
      <div className="flex-1 overflow-auto p-4 bg-gray-50">
        <textarea
          ref={textareaRef}
          className="w-full h-full p-3 rounded-md border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm resize-none"
          placeholder={documentType === 'presentation' 
            ? "Describe your slide show here, paste report or paper here, or design your slides using the buttons above. Use the 'New Slide' button to add slides."
            : "Enter your content here. Use the buttons above to insert templates, or use tags like <MATHEQ>E = mc^2</MATHEQ> for math equations. No LaTeX knowledge required!"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
      <div className="p-4 bg-white border-t border-gray-200">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            <span className={isReady ? "text-emerald-600" : "text-amber-600"}>● </span>
            {isReady ? "AI Ready" : "Enter content to generate"}
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              className="bg-white hover:bg-gray-100 text-gray-700 border border-gray-300"
              onClick={handleClear}
              disabled={generating}
            >
              Clear
            </Button>
            <Button
              className="bg-blue-600 hover:bg-blue-700 text-white"
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
