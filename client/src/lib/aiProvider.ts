import { API_ROUTES } from "./constants";
import { apiRequest } from "./queryClient";
import { GenerateLatexResponse, LatexGenerationOptions } from "./types";

export async function generateLatex(
  content: string,
  documentType: string,
  options?: LatexGenerationOptions
): Promise<GenerateLatexResponse> {
  try {
    const response = await apiRequest(
      "POST",
      API_ROUTES.latex.generate,
      {
        content,
        documentType,
        options: options || {}
      }
    );
    
    return await response.json();
  } catch (error) {
    console.error("Error generating LaTeX:", error);
    throw new Error(error instanceof Error ? error.message : "Failed to generate LaTeX");
  }
}

export async function compileLatex(latexContent: string): Promise<GenerateLatexResponse> {
  try {
    const response = await apiRequest(
      "POST",
      API_ROUTES.latex.compile,
      { latex: latexContent }
    );
    
    return await response.json();
  } catch (error) {
    console.error("Error compiling LaTeX:", error);
    throw new Error(error instanceof Error ? error.message : "Failed to compile LaTeX");
  }
}

export async function fixLatexErrors(
  latexContent: string,
  errorDetails: string
): Promise<GenerateLatexResponse> {
  try {
    const response = await apiRequest(
      "POST",
      `${API_ROUTES.latex.compile}/fix`,
      { 
        latex: latexContent,
        errorDetails
      }
    );
    
    return await response.json();
  } catch (error) {
    console.error("Error fixing LaTeX:", error);
    throw new Error(error instanceof Error ? error.message : "Failed to fix LaTeX errors");
  }
}

export async function saveDocument(
  title: string,
  inputContent: string,
  latexContent: string,
  documentType: string,
  compilationSuccessful: boolean,
  compilationError?: string,
  documentId?: number
): Promise<Document> {
  try {
    const url = documentId 
      ? `${API_ROUTES.latex.documents}/${documentId}`
      : API_ROUTES.latex.documents;
    
    const method = documentId ? "PATCH" : "POST";
    
    const response = await apiRequest(
      method,
      url,
      {
        title,
        inputContent,
        latexContent,
        documentType,
        compilationSuccessful,
        compilationError
      }
    );
    
    return await response.json();
  } catch (error) {
    console.error("Error saving document:", error);
    throw new Error(error instanceof Error ? error.message : "Failed to save document");
  }
}

export async function getDocument(documentId: number): Promise<Document> {
  try {
    const response = await fetch(`${API_ROUTES.latex.documents}/${documentId}`, {
      credentials: "include",
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error("Error fetching document:", error);
    throw new Error(error instanceof Error ? error.message : "Failed to fetch document");
  }
}
