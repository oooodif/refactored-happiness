import { useState, useContext, useEffect } from "react";
import { useLocation } from "wouter";
import { UserContext, AuthRequiredContext } from "@/App";
import SiteLayout from "@/components/layout/site-layout";
import TabsWithContent from "@/components/ui/tabs-with-content";
import LatexInput from "@/components/editor/latex-input";
import LatexOutput from "@/components/editor/latex-output";
import PDFPreview from "@/components/editor/pdf-preview";
import ErrorNotification from "@/components/dialogs/error-notification";
import { generateLatex, compileLatex, saveDocument, extractTitleFromLatex } from "@/lib/aiProvider";
import { downloadPdf } from "@/lib/utils";
import { TabItem, EditorState, ErrorNotificationData } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

/**
 * Extract a meaningful title from the user's input content
 * This analyzes the content to find a suitable title or generates one based on the content
 * @param inputContent The user's input content
 * @returns An extracted title or "Untitled Document" if no title found
 */
function extractTitleFromInput(inputContent: string): string {
  if (!inputContent?.trim()) {
    return "Untitled Document";
  }
  
  const lines = inputContent.trim().split('\n');
  const firstParagraph = lines.slice(0, Math.min(5, lines.length)).join(' ');
  
  // Try different title extraction strategies
  
  // 1. Check for explicit title markers
  const titleMarkerMatch = inputContent.match(/title:\s*(.+?)(?:\n|$)/i);
  if (titleMarkerMatch && titleMarkerMatch[1].trim()) {
    return titleMarkerMatch[1].trim();
  }
  
  // 2. Check for markdown-style heading
  const headingMatch = inputContent.match(/^#+\s+(.+?)(?:\n|$)/m);
  if (headingMatch && headingMatch[1].trim()) {
    return headingMatch[1].trim();
  }
  
  // 3. If it looks like a philosophical text (like in the example)
  if (inputContent.includes("pleasure") && inputContent.includes("pain")) {
    if (inputContent.toLowerCase().includes("paradox")) {
      return "The Paradox of Pleasure and Pain";
    }
    return "On Pleasure and Pain";
  }
  
  // 4. Look for key conceptual phrases and create a title from them
  const keyPhrases = [
    { search: /happiness|well-being|satisfaction/i, title: "On Happiness" },
    { search: /virtue|ethics|moral/i, title: "Ethical Considerations" },
    { search: /knowledge|truth|wisdom/i, title: "Pursuit of Knowledge" },
    { search: /freedom|liberty|autonomy/i, title: "On Freedom and Choice" },
    { search: /justice|fairness|equality/i, title: "Principles of Justice" },
    { search: /beauty|aesthetic|art/i, title: "On Beauty and Aesthetics" },
    { search: /nature|natural|environment/i, title: "Natural Philosophy" },
    { search: /society|social|community/i, title: "Social Structures" },
    { search: /mind|consciousness|perception/i, title: "Philosophy of Mind" },
    { search: /reality|existence|being/i, title: "On Reality and Existence" },
  ];
  
  for (const { search, title } of keyPhrases) {
    if (search.test(inputContent)) {
      return title;
    }
  }
  
  // 5. If the first line is short (potentially a title) and capitalized like a title
  if (lines.length > 0) {
    const firstLine = lines[0].trim();
    const words = firstLine.split(/\s+/);
    
    // Short first line that looks like a proper title (3-8 words)
    if (words.length >= 3 && words.length <= 8 && firstLine.length <= 60) {
      // If it's already capitalized like a title, use it
      if (/^[A-Z]/.test(firstLine) && !/^[A-Z]+$/.test(firstLine)) {
        return firstLine;
      }
      
      // Convert to title case
      return words.map(word => {
        // Skip capitalizing articles, conjunctions, and prepositions
        if (['a', 'an', 'the', 'and', 'but', 'or', 'for', 'nor', 'on', 'at', 'to', 'from', 'by', 'in', 'of'].includes(word.toLowerCase())) {
          return word.toLowerCase();
        }
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      }).join(' ');
    }
  }
  
  // 6. Extract a title from the first substantial paragraph
  if (firstParagraph.length > 20) {
    // Look for the main subject being discussed
    const mainSubject = extractMainSubject(firstParagraph);
    if (mainSubject) {
      return mainSubject;
    }
  }
  
  // Fallback: Use the topic from the first few words if all else fails
  if (inputContent.trim().length > 15) {
    const firstFewWords = inputContent.trim().split(/\s+/).slice(0, 6).join(' ');
    if (firstFewWords.length <= 50) {
      return firstFewWords;
    }
    return "Document " + new Date().toLocaleDateString();
  }
  
  return "Untitled Document";
}

/**
 * Extract the main subject from a paragraph
 */
function extractMainSubject(paragraph: string): string | null {
  // If it starts with "But I must explain..." or similar explanatory intros
  if (/^(but |now |here |I must|let me) explain/i.test(paragraph)) {
    const aboutMatch = paragraph.match(/explain\s+([^,.]+)/i);
    if (aboutMatch && aboutMatch[1]) {
      return "Explanation of " + aboutMatch[1].trim();
    }
    
    // Look for key topics after "explain"
    const topics = paragraph.match(/explain.{1,50}(how|why|what|the)\s+([^,.]{3,30})/i);
    if (topics && topics[2]) {
      return "On " + topics[2].trim();
    }
  }
  
  // Check for a statement about a concept
  const conceptMatch = paragraph.match(/\b(the (concept|idea|theory|principle|nature) of)\s+([^,.]{3,20})/i);
  if (conceptMatch && conceptMatch[3]) {
    return "The Nature of " + conceptMatch[3].trim();
  }
  
  return null;
}

export default function Home() {
  const { session } = useContext(UserContext);
  const { setShowAuthPrompt } = useContext(AuthRequiredContext);
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  // SEO enhancement - set proper page title and description
  useEffect(() => {
    document.title = "AI LaTeX Generator - Create Professional Academic Documents";
    
    // Update meta description
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 
        "Generate professional LaTeX documents with AI assistance. Create papers, slides, and academic content with ease using our powerful LaTeX editor.");
    }
  }, []);
  
  // Beautiful keyboard dismissal animation with parallax effects
  useEffect(() => {
    // Only run on mobile devices in portrait mode
    const isMobilePortrait = () => {
      return window.innerWidth < 768 && window.innerHeight > window.innerWidth;
    };
    
    if (!isMobilePortrait()) return;
    
    // Variables to track keyboard state
    let isKeyboardVisible = false;
    let previousHeight = window.innerHeight;
    let initialHeight = window.innerHeight;
    
    // Function to apply smooth scroll & parallax animations
    function animateKeyboardDismiss() {
      // Get elements that should have parallax effects
      const header = document.querySelector('header');
      const mainContainer = document.querySelector('main');
      const floatingRect1 = document.getElementById('FloatingRectInput');
      const floatingRect2 = document.getElementById('FloatingRectOutput');
      
      // Apply parallax animations to different elements with varying depths
      if (header) {
        header.classList.add('header-parallax-animate');
        header.classList.add('stagger-item-1');
        
        // Remove animation classes after animation completes
        setTimeout(() => {
          header.classList.remove('header-parallax-animate');
          header.classList.remove('stagger-item-1');
        }, 800);
      }
      
      if (mainContainer) {
        mainContainer.classList.add('parallax-container');
        
        // Remove after animation completes
        setTimeout(() => {
          mainContainer.classList.remove('parallax-container');
        }, 800);
      }
      
      // Apply beautiful scroll reveal animation to the floating UI elements
      if (floatingRect1) {
        floatingRect1.classList.add('scroll-reveal-animate');
        floatingRect1.classList.add('stagger-item-2');
        floatingRect1.classList.add('parallax-layer-0');
        
        // Add subtle ripple effect
        floatingRect1.classList.add('ripple-out-animate');
        
        // Remove animation classes after animation completes
        setTimeout(() => {
          floatingRect1.classList.remove('scroll-reveal-animate');
          floatingRect1.classList.remove('stagger-item-2');
          floatingRect1.classList.remove('parallax-layer-0');
          floatingRect1.classList.remove('ripple-out-animate');
        }, 800);
      }
      
      if (floatingRect2) {
        floatingRect2.classList.add('scroll-reveal-animate');
        floatingRect2.classList.add('stagger-item-3');
        floatingRect2.classList.add('parallax-layer-1');
        
        // Remove animation classes after animation completes
        setTimeout(() => {
          floatingRect2.classList.remove('scroll-reveal-animate');
          floatingRect2.classList.remove('stagger-item-3');
          floatingRect2.classList.remove('parallax-layer-1');
        }, 800);
      }
      
      // Perform smooth scroll to top with easing
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: 'smooth'
      });
    }
    
    // Detect keyboard appearance/disappearance by monitoring window height changes
    function checkKeyboard() {
      // Only run checks in portrait mode
      if (!isMobilePortrait()) return;
      
      // If the window height suddenly decreased significantly, keyboard appeared
      if (window.innerHeight < previousHeight * 0.75) {
        if (!isKeyboardVisible) {
          console.log("Keyboard appeared");
          isKeyboardVisible = true;
        }
      } 
      // If the window height increased back close to original, keyboard disappeared
      else if (isKeyboardVisible && window.innerHeight > previousHeight * 0.9) {
        console.log("Keyboard disappeared - triggering animations");
        isKeyboardVisible = false;
        
        // Trigger the beautiful parallax animation when keyboard is dismissed
        animateKeyboardDismiss();
      }
      
      previousHeight = window.innerHeight;
    }
    
    // iOS Safari doesn't consistently fire resize events during keyboard show/hide
    // Use multiple event types for better detection
    window.addEventListener('resize', checkKeyboard);
    
    // Also detect keyboard dismissal via input blur events
    const inputFields = document.querySelectorAll('input, textarea');
    inputFields.forEach(input => {
      input.addEventListener('blur', () => {
        // When focus leaves any input on mobile, keyboard likely dismissed
        if (isKeyboardVisible && isMobilePortrait()) {
          console.log("Input blur detected - keyboard likely dismissed");
          isKeyboardVisible = false;
          
          // Small delay to ensure keyboard is fully dismissed before animation
          setTimeout(animateKeyboardDismiss, 100);
        }
      });
    });
    
    // Clean up event listeners
    return () => {
      window.removeEventListener('resize', checkKeyboard);
      inputFields.forEach(input => {
        input.removeEventListener('blur', () => {});
      });
    };
  }, []);
  
  // Check localStorage for preselected template when coming from template URL
  const getInitialDocumentType = () => {
    try {
      const selectedTemplate = localStorage.getItem("selectedTemplate");
      if (selectedTemplate) {
        // Clear the localStorage after reading to avoid persisting selection across sessions
        localStorage.removeItem("selectedTemplate");
        return selectedTemplate;
      }
    } catch (error) {
      console.error("Error reading from localStorage:", error);
    }
    return "article"; // Default document type is now Article instead of Basic
  };

  const [editorState, setEditorState] = useState<EditorState>({
    inputContent: "",
    latexContent: "",
    documentType: getInitialDocumentType(),
    compilationResult: null,
    isGenerating: false,
    title: "Untitled Document",
  });

  const [errorNotification, setErrorNotification] = useState<ErrorNotificationData | null>(null);

  // Handle document type change
  const handleDocumentTypeChange = (type: string) => {
    setEditorState(prev => ({ ...prev, documentType: type }));
  };

  // Handle input content change
  const handleInputChange = (value: string) => {
    setEditorState(prev => ({ ...prev, inputContent: value }));
  };

  // Generate LaTeX from input content
  const handleGenerate = async () => {
    if (!editorState.inputContent.trim()) {
      toast({
        title: "Empty input",
        description: "Please enter some content to generate LaTeX.",
        variant: "destructive",
      });
      return;
    }
    
    // DEBUGGING
    console.log("Generate button clicked, auth status:", {
      isAuthenticated: session.isAuthenticated,
      user: session.user
    });
    
    // Guest mode is disabled - non-authenticated users cannot generate content
    
    // If user is not authenticated, show auth prompt
    if (!session.isAuthenticated) {
      // Stop the generating animation if it was started
      setEditorState(prev => ({ ...prev, isGenerating: false }));
      
      console.log("User not authenticated, showing auth prompt");
      
      // Try directly setting the auth prompt to true
      try {
        // Show auth required dialog
        setShowAuthPrompt(true);
        console.log("Set showAuthPrompt to true");
        
        // Force a dialog to appear (fallback)
        toast({
          title: "Authentication Required",
          description: "Please sign in or create an account to generate LaTeX.",
          action: (
            <div className="flex gap-2 mt-2">
              <Button variant="outline" size="sm" onClick={() => navigate("/login")}>
                Login
              </Button>
              <Button 
                size="sm" 
                onClick={() => navigate("/register")}
                className="bg-primary text-white hover:bg-primary/90"
              >
                Create Account
              </Button>
            </div>
          ),
        });
      } catch (err) {
        console.error("Error showing auth prompt:", err);
      }
      return;
    }
    
    // Guest mode has been disabled
    
    // Only authenticated users can proceed with generation
    if (!session.isAuthenticated) {
      return;
    }
    
    console.log("User is authenticated, proceeding with generation");

    // Check if user has reached limit
    if (session.isAuthenticated && session.usage.current >= session.usage.limit) {
      setErrorNotification({
        title: "Usage Limit Reached",
        message: `You've reached your monthly limit of ${session.usage.limit} generations. Upgrade your plan to get more.`,
        actions: [
          {
            label: "Upgrade Plan",
            action: () => navigate("/subscribe"),
          },
        ],
      });
      return;
    }

    // Start generating
    setEditorState(prev => ({ ...prev, isGenerating: true }));

    try {
      // Generate LaTeX without compiling to PDF
      const result = await generateLatex(
        editorState.inputContent,
        editorState.documentType,
        undefined,  // default options
        false       // explicitly set compile=false
      );

      // Extract a title from the input content
      try {
        // Try to extract a title from the input content
        const inputContentTitle = extractTitleFromInput(editorState.inputContent);
        
        // Set the results with the extracted title
        setEditorState(prev => ({
          ...prev,
          latexContent: result.latex,
          compilationResult: result.compilationResult, // This will be empty with success=false
          isGenerating: false,
          documentId: result.documentId,
          title: inputContentTitle !== "Untitled Document" ? inputContentTitle : prev.title
        }));
      } catch (error) {
        // If title extraction fails, just update without changing the title
        console.error("Error extracting title from input:", error);
        setEditorState(prev => ({
          ...prev,
          latexContent: result.latex,
          compilationResult: result.compilationResult,
          isGenerating: false,
          documentId: result.documentId,
        }));
      }

      // Show success message
      toast({
        title: "LaTeX Generated",
        description: "Your content has been successfully converted to LaTeX. Click 'Generate PDF' in the PDF Preview tab to compile it.",
      });
    } catch (error) {
      console.error("Error generating LaTeX:", error);
      setEditorState(prev => ({ ...prev, isGenerating: false }));
      
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "Failed to generate LaTeX. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handle PDF download
  const handleDownloadPdf = async () => {
    if (!editorState.compilationResult?.success || !editorState.compilationResult.pdf) {
      toast({
        title: "No PDF available",
        description: "Please generate and compile LaTeX content first.",
        variant: "destructive",
      });
      return;
    }
    
    // Guest mode is disabled - non-authenticated users cannot download PDFs
    
    // If user is not authenticated, show auth prompt
    if (!session.isAuthenticated) {
      console.log("User not authenticated, showing auth prompt for PDF download");
      
      try {
        // Show auth required dialog
        setShowAuthPrompt(true);
        
        // Force a dialog to appear (fallback)
        toast({
          title: "Authentication Required",
          description: "Please sign in or create an account to download PDFs.",
          action: (
            <div className="flex gap-2 mt-2">
              <Button variant="outline" size="sm" onClick={() => navigate("/login")}>
                Login
              </Button>
              <Button size="sm" onClick={() => navigate("/register")}>
                Create Account
              </Button>
            </div>
          ),
        });
      } catch (err) {
        console.error("Error showing auth prompt:", err);
      }
      return;
    }
    
    // Guest mode has been disabled

    try {
      // First try to extract a meaningful title from the LaTeX content
      const extractedTitle = await extractTitleFromLatex(editorState.latexContent);
      
      // Use the extracted title if available, otherwise fall back to the current title or a default
      const titleToUse = extractedTitle || editorState.title || "latex-document";
      
      // Check if the content is HTML (from fallback mechanism)
      const isHtml = editorState.compilationResult?.isHtml || false;
      
      downloadPdf(
        editorState.compilationResult.pdf,
        titleToUse,
        isHtml
      );
      
      // If we got a good title and it's different from the current one, update the editor state
      if (extractedTitle && extractedTitle !== "Generated Document" && extractedTitle !== editorState.title) {
        setEditorState(prev => ({
          ...prev,
          title: extractedTitle
        }));
        
        // Show a toast about the AI-generated title
        toast({
          title: "Title Extracted",
          description: `AI detected document title: "${extractedTitle}"`,
        });
      }
    } catch (error) {
      console.error("Error in download process:", error);
      
      // Fallback to basic download if title extraction fails
      const isHtml = editorState.compilationResult?.isHtml || false;
      downloadPdf(
        editorState.compilationResult.pdf, 
        editorState.title || "latex-document",
        isHtml
      );
    }
  };

  // Save the document
  const handleSaveDocument = async () => {
    if (!session.isAuthenticated) {
      toast({
        title: "Sign in required",
        description: "Please sign in to save documents.",
      });
      return;
    }

    if (!editorState.latexContent) {
      toast({
        title: "No content",
        description: "Please generate LaTeX content first.",
        variant: "destructive",
      });
      return;
    }

    try {
      const compilationSuccessful = editorState.compilationResult?.success || false;
      const compilationError = editorState.compilationResult?.error || undefined;

      await saveDocument(
        editorState.title,
        editorState.inputContent,
        editorState.latexContent,
        editorState.documentType,
        compilationSuccessful,
        compilationError,
        editorState.documentId
      );

      toast({
        title: "Document Saved",
        description: "Your document has been saved successfully.",
      });
    } catch (error) {
      console.error("Error saving document:", error);
      toast({
        title: "Save Failed",
        description: error instanceof Error ? error.message : "Failed to save document. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handle manual PDF compilation (compile existing LaTeX)
  const handleCompilePdf = async () => {
    if (!editorState.latexContent) {
      toast({
        title: "No LaTeX Content",
        description: "Please generate LaTeX content first before compiling to PDF.",
        variant: "destructive",
      });
      return;
    }
    
    // Guest mode is disabled - non-authenticated users cannot compile PDFs
    
    // If user is not authenticated, show auth prompt
    if (!session.isAuthenticated) {
      console.log("User not authenticated, showing auth prompt for PDF compilation");
      
      try {
        // Show auth required dialog
        setShowAuthPrompt(true);
        
        // Force a dialog to appear (fallback)
        toast({
          title: "Authentication Required",
          description: "Please sign in or create an account to compile to PDF.",
          action: (
            <div className="flex gap-2 mt-2">
              <Button variant="outline" size="sm" onClick={() => navigate("/login")}>
                Login
              </Button>
              <Button size="sm" onClick={() => navigate("/register")}>
                Create Account
              </Button>
            </div>
          ),
        });
      } catch (err) {
        console.error("Error showing auth prompt:", err);
      }
      return;
    }
    
    // Guest mode has been disabled

    try {
      // Call the compile endpoint to generate PDF from current LaTeX
      const result = await compileLatex(editorState.latexContent);
      
      // Update the editor state with the compilation result
      setEditorState(prev => ({
        ...prev,
        compilationResult: result.compilationResult
      }));

      if (result.compilationResult.success) {
        toast({
          title: "PDF Generated",
          description: "Your LaTeX has been successfully compiled to PDF.",
        });
      } else {
        setErrorNotification({
          title: "PDF Compilation Error",
          message: result.compilationResult.error || "Failed to compile LaTeX to PDF.",
          actions: [
            {
              label: "View Details",
              action: () => console.log(result.compilationResult.errorDetails),
            },
          ],
        });
      }
    } catch (error) {
      console.error("Error compiling LaTeX to PDF:", error);
      
      toast({
        title: "Compilation Failed",
        description: error instanceof Error ? error.message : "Failed to compile LaTeX to PDF. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Define the tabs for the output panel
  const tabs: TabItem[] = [
    {
      id: "latex",
      label: "LaTeX Code",
      content: (
        <LatexOutput
          latexContent={editorState.latexContent}
          onDownloadPdf={handleDownloadPdf}
          compilationSuccess={editorState.compilationResult?.success || false}
          errorMessage={editorState.compilationResult?.error}
        />
      ),
    },
    {
      id: "pdf",
      label: "PDF Preview",
      content: (
        <PDFPreview
          pdfData={editorState.compilationResult?.pdf || null}
          title={editorState.title}
          onCompilePdf={handleCompilePdf}
          isHtml={editorState.compilationResult?.isHtml || false}
        />
      ),
    },
  ];

  return (
    <SiteLayout seoTitle="AI LaTeX Generator - Create Professional LaTeX Documents with AI">
      <div className="h-full flex flex-col md:flex-row bg-gradient-soft">
        {/* Left Panel (Input) */}
        <div className="w-full md:w-1/2 h-full relative">
          <div id="FloatingRectInput" className="absolute inset-4 glass rounded-lg shadow-lg overflow-hidden depth-3d">
            <LatexInput
              value={editorState.inputContent}
              onChange={handleInputChange}
              onGenerate={handleGenerate}
              documentType={editorState.documentType}
              onDocumentTypeChange={handleDocumentTypeChange}
              generating={editorState.isGenerating}
            />
          </div>
        </div>

        {/* Right Panel (Output) */}
        <div className="w-full md:w-1/2 h-full relative">
          <div id="FloatingRectOutput" className="absolute inset-4 glass rounded-lg shadow-lg overflow-hidden depth-3d">
            <TabsWithContent tabs={tabs} defaultTabId="latex" />
          </div>
        </div>
      </div>

      {/* Error Notification */}
      {errorNotification && (
        <ErrorNotification
          data={errorNotification}
          onClose={() => setErrorNotification(null)}
        />
      )}
    </SiteLayout>
  );
}
