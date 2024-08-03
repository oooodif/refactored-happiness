import { useState, useContext, useEffect } from "react";
import { useLocation } from "wouter";
import { UserContext } from "@/App";
import SiteLayout from "@/components/layout/site-layout";
import TabsWithContent from "@/components/ui/tabs-with-content";
import LatexInput from "@/components/editor/latex-input";
import LatexOutput from "@/components/editor/latex-output";
import PDFPreview from "@/components/editor/pdf-preview";
import ErrorNotification from "@/components/dialogs/error-notification";
import { generateLatex, saveDocument } from "@/lib/aiProvider";
import { downloadPdf } from "@/lib/utils";
import { TabItem, EditorState, ErrorNotificationData } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";

export default function Home() {
  const { session } = useContext(UserContext);
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  const [editorState, setEditorState] = useState<EditorState>({
    inputContent: "",
    latexContent: "",
    documentType: "article",
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
      // Generate LaTeX
      const result = await generateLatex(
        editorState.inputContent,
        editorState.documentType
      );

      // Set the results
      setEditorState(prev => ({
        ...prev,
        latexContent: result.latex,
        compilationResult: result.compilationResult,
        isGenerating: false,
        documentId: result.documentId,
      }));

      // Show success message
      if (result.compilationResult.success) {
        toast({
          title: "LaTeX Generated",
          description: "Your content has been successfully converted to LaTeX.",
        });
      } else {
        // Show error notification
        setErrorNotification({
          title: "LaTeX Compilation Error",
          message: result.compilationResult.error || "Failed to compile LaTeX.",
          actions: [
            {
              label: "View Details",
              action: () => console.log(result.compilationResult.errorDetails),
            },
          ],
        });
      }
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
  const handleDownloadPdf = () => {
    if (!editorState.compilationResult?.success || !editorState.compilationResult.pdf) {
      toast({
        title: "No PDF available",
        description: "Please generate and compile LaTeX content first.",
        variant: "destructive",
      });
      return;
    }

    downloadPdf(
      editorState.compilationResult.pdf,
      editorState.title || "latex-document"
    );
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
        />
      ),
    },
  ];

  return (
    <SiteLayout>
      <div className="h-full flex flex-col md:flex-row">
        {/* Left Panel (Input) */}
        <div className="w-full md:w-1/2 h-full">
          <LatexInput
            value={editorState.inputContent}
            onChange={handleInputChange}
            onGenerate={handleGenerate}
            documentType={editorState.documentType}
            onDocumentTypeChange={handleDocumentTypeChange}
            generating={editorState.isGenerating}
          />
        </div>

        {/* Right Panel (Output) */}
        <div className="w-full md:w-1/2 h-full">
          <TabsWithContent tabs={tabs} defaultTabId="latex" />
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
