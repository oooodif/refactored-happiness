import { compileTex, fixCompilationErrors } from '../utils/tectonic';
import { generateLatex } from './aiProvider';

/**
 * Compile LaTeX to PDF
 */
export async function compileLatex(latex: string): Promise<{
  success: boolean;
  pdf?: string;
  error?: string;
  errorDetails?: { line: number; message: string }[];
}> {
  // Validate LaTeX content
  if (!latex || typeof latex !== 'string') {
    return {
      success: false,
      error: 'Invalid LaTeX content'
    };
  }

  try {
    // Compile LaTeX with Tectonic
    const result = await compileTex(latex);
    
    if (result.success) {
      return {
        success: true,
        pdf: result.pdf
      };
    } else {
      return {
        success: false,
        error: result.error,
        errorDetails: result.errorDetails
      };
    }
  } catch (error) {
    console.error('LaTeX compilation error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error during LaTeX compilation'
    };
  }
}

/**
 * Attempt to fix LaTeX errors and recompile
 */
export async function compileAndFixLatex(
  latex: string,
  errorDetails: string
): Promise<{
  success: boolean;
  fixedLatex: string;
  compilationResult: {
    success: boolean;
    pdf?: string;
    error?: string;
    errorDetails?: { line: number; message: string }[];
  };
}> {
  try {
    // Try to fix LaTeX errors with AI
    const fixedLatex = await fixCompilationErrors(latex, errorDetails);
    
    // Try to compile the fixed LaTeX
    const compilationResult = await compileLatex(fixedLatex);
    
    return {
      success: compilationResult.success,
      fixedLatex,
      compilationResult
    };
  } catch (error) {
    console.error('Error fixing LaTeX:', error);
    
    // Fallback to sending to AI for error fixing
    try {
      // Create error report for AI
      const errorReport = `
I have a LaTeX document that fails to compile with the following errors:
${errorDetails}

Please fix the errors in the following LaTeX code:
\`\`\`latex
${latex}
\`\`\`
`;

      // Use AI to fix the LaTeX
      const result = await generateLatex(errorReport, 'article', {
        model: 'gpt-4o'  // Use the most capable model for fixing errors
      });
      
      if (result.success && result.latex) {
        // Try to compile the AI-fixed LaTeX
        const compilationResult = await compileLatex(result.latex);
        
        return {
          success: compilationResult.success,
          fixedLatex: result.latex,
          compilationResult
        };
      } else {
        throw new Error('AI failed to fix LaTeX errors');
      }
    } catch (aiError) {
      console.error('AI error fixing failed:', aiError);
      
      // Return original LaTeX and compilation error
      return {
        success: false,
        fixedLatex: latex,
        compilationResult: {
          success: false,
          error: 'Failed to fix LaTeX errors. Please check the syntax manually.'
        }
      };
    }
  }
}
