import { useState, useContext } from "react";
import { useLocation } from "wouter";
import { UserContext, AuthRequiredContext } from "@/App";
import SiteLayout from "@/components/layout/site-layout";
import TabsWithContent from "@/components/ui/tabs-with-content";
import LatexInput from "@/components/editor/latex-input";
import LatexOutput from "@/components/editor/latex-output";
import PDFPreview from "@/components/editor/pdf-preview";
import ErrorNotification from "@/components/dialogs/error-notification";
import {
  generateLatex,
  compileLatex,
  saveDocument,
  extractTitleFromLatex,
} from "@/lib/aiProvider";
import { downloadPdf } from "@/lib/utils";
import { TabItem, EditorState, ErrorNotificationData } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

const GUEST_MODE = true; // Toggle guest mode here

/* ----------------------------------------------------------------- */
/*  Title‑extraction helpers (unchanged logic, just compacted a bit) */
/* ----------------------------------------------------------------- */
function extractTitleFromInput(input: string): string {
  if (!input.trim()) return "Untitled Document";

  const lines = input.trim().split("\n");
  const firstPara = lines.slice(0, 5).join(" ");

  const explicit = input.match(/title:\s*(.+?)(?:\n|$)/i)?.[1]?.trim();
  if (explicit) return explicit;

  const mdHeading = input.match(/^#+\s+(.+?)(?:\n|$)/m)?.[1]?.trim();
  if (mdHeading) return mdHeading;

  if (input.match(/pleasure/i) && input.match(/pain/i))
    return input.match(/paradox/i) ? "The Paradox of Pleasure and Pain" : "On Pleasure and Pain";

  const phraseTable = [
    [/happiness|well‑being|satisfaction/i, "On Happiness"],
    [/virtue|ethics|moral/i, "Ethical Considerations"],
    [/knowledge|truth|wisdom/i, "Pursuit of Knowledge"],
    [/freedom|liberty|autonomy/i, "On Freedom and Choice"],
    [/justice|fairness|equality/i, "Principles of Justice"],
    [/beauty|aesthetic|art/i, "On Beauty and Aesthetics"],
    [/nature|environment/i, "Natural Philosophy"],
    [/society|community/i, "Social Structures"],
    [/mind|consciousness|perception/i, "Philosophy of Mind"],
    [/reality|existence|being/i, "On Reality and Existence"],
  ] as const;

  for (const [rx, title] of phraseTable) if (rx.test(input)) return title;

  if (lines.length) {
    const first = lines[0].trim();
    const words = first.split(/\s+/);
    if (words.length >= 3 && words.length <= 8 && first.length <= 60) {
      if (/^[A-Z]/.test(first) && !/^[A-Z]+$/.test(first)) return first; // looks like a title
      const lower = (w: string) =>
        ["a", "an", "the", "and", "or", "for", "nor", "in", "of", "to", "by", "on"].includes(
          w.toLowerCase(),
        )
          ? w.toLowerCase()
          : w[0].toUpperCase() + w.slice(1).toLowerCase();
      return words.map(lower).join(" ");
    }
  }

  const conceptMatch = firstPara.match(/\bthe (concept|nature|idea) of ([^,.]{3,20})/i)?.[2];
  if (conceptMatch) return `The Nature of ${conceptMatch.trim()}`;

  const fallback = input.trim().split(/\s+/).slice(0, 6).join(" ");
  return fallback.length <= 50 ? fallback : `Document ${new Date().toLocaleDateString()}`;
}
/* ----------------------------------------------------------------- */

export default function Home() {
  const { session } = useContext(UserContext);
  const { setShowAuthPrompt } = useContext(AuthRequiredContext);
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const [editorState, setEditorState] = useState<EditorState>({
    inputContent: "",
    latexContent: "",
    documentType: "basic",
    compilationResult: null,
    isGenerating: false,
    title: "Untitled Document",
  });

  const [errorNotification, setErrorNotification] = useState<ErrorNotificationData | null>(null);

  const setState = (patch: Partial<EditorState>) =>
    setEditorState((prev) => ({ ...prev, ...patch }));

  /* -----------------------------  Handlers  ----------------------------- */

  const handleGenerate = async () => {
    if (!editorState.inputContent.trim()) {
      toast({ title: "Empty input", description: "Enter something first.", variant: "destructive" });
      return;
    }

    if (!session.isAuthenticated && !GUEST_MODE) {
      setShowAuthPrompt(true);
      return;
    }

    if (session.isAuthenticated && session.usage.current >= session.usage.limit) {
      setErrorNotification({
        title: "Usage Limit Reached",
        message: `You've hit ${session.usage.limit} generations.`,
        actions: [{ label: "Upgrade Plan", action: () => navigate("/subscribe") }],
      });
      return;
    }

    setState({ isGenerating: true });

    try {
      const { latex, compilationResult, documentId } = await generateLatex(
        editorState.inputContent,
        editorState.documentType,
        undefined,
        false,
      );

      const title = extractTitleFromInput(editorState.inputContent);
      setState({
        latexContent: latex,
        compilationResult,
        isGenerating: false,
        documentId,
        title,
      });

      toast({ title: "LaTeX Generated", description: "Compile to PDF when ready." });
    } catch (err) {
      setState({ isGenerating: false });
      toast({
        title: "Generation Failed",
        description: err instanceof Error ? err.message : "Try again.",
        variant: "destructive",
      });
    }
  };

  const handleCompilePdf = async () => {
    if (!editorState.latexContent) {
      toast({ title: "Nothing to compile", variant: "destructive" });
      return;
    }

    if (!session.isAuthenticated && !GUEST_MODE) {
      setShowAuthPrompt(true);
      return;
    }

    try {
      const result = await compileLatex(editorState.latexContent);
      setState({ compilationResult: result.compilationResult });

      if (result.compilationResult.success) {
        toast({ title: "PDF Generated" });
      } else {
        setErrorNotification({
          title: "Compilation Error",
          message: result.compilationResult.error ?? "Unknown error",
        });
      }
    } catch (err) {
      toast({
        title: "Compilation Failed",
        description: err instanceof Error ? err.message : "Try again.",
        variant: "destructive",
      });
    }
  };

  const handleDownloadPdf = async () => {
    const result = editorState.compilationResult;
    if (!result?.success || !result.pdf) {
      toast({ title: "No PDF available", variant: "destructive" });
      return;
    }

    try {
      const extracted = await extractTitleFromLatex(editorState.latexContent);
      const name = extracted || editorState.title || "latex-document";
      downloadPdf(result.pdf, name);

      if (extracted && extracted !== editorState.title) setState({ title: extracted });
    } catch {
      downloadPdf(result.pdf, editorState.title);
    }
  };

  const handleSaveDocument = async () => {
    if (!session.isAuthenticated) {
      toast({ title: "Sign in required" });
      return;
    }

    if (!editorState.latexContent) {
      toast({ title: "No LaTeX to save", variant: "destructive" });
      return;
    }

    try {
      await saveDocument(
        editorState.title,
        editorState.inputContent,
        editorState.latexContent,
        editorState.documentType,
        !!editorState.compilationResult?.success,
        editorState.compilationResult?.error,
        editorState.documentId,
      );
      toast({ title: "Document Saved" });
    } catch (err) {
      toast({ title: "Save Failed", variant: "destructive" });
    }
  };

  /* -----------------------------  UI Tabs  ----------------------------- */

  const tabs: TabItem[] = [
    {
      id: "latex",
      label: "LaTeX Code",
      content: (
        <LatexOutput
          latexContent={editorState.latexContent}
          onDownloadPdf={handleDownloadPdf}
          compilationSuccess={!!editorState.compilationResult?.success}
          errorMessage={editorState.compilationResult?.error}
        />
      ),
    },
    {
      id: "pdf",
      label: "PDF Preview",
      content: (
        <PDFPreview
          pdfData={editorState.compilationResult?.pdf ?? null}
          title={editorState.title}
          onCompilePdf={handleCompilePdf}
        />
      ),
    },
  ];

  /* -----------------------------  Render  ----------------------------- */

  return (
    <SiteLayout>
      <div className="h-full flex flex-col md:flex-row">
        <div className="w-full md:w-1/2 h-full">
          <LatexInput
            value={editorState.inputContent}
            onChange={(v) => setState({ inputContent: v })}
            onGenerate={handleGenerate}
            documentType={editorState.documentType}
            onDocumentTypeChange={(t) => setState({ documentType: t })}
            generating={editorState.isGenerating}
          />
        </div>

        <div className="w-full md:w-1/2 h-full">
          <TabsWithContent tabs={tabs} defaultTabId="latex" />
        </div>
      </div>

      {errorNotification && (
        <ErrorNotification data={errorNotification} onClose={() => setErrorNotification(null)} />
      )}
    </SiteLayout>
  );
}