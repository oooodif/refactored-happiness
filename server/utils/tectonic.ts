import { spawn } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { v4 as uuidv4 } from 'uuid';
import { generateLatex } from '../services/aiProvider';
import { 
  isTectonicAvailable, 
  generateHTMLPreview, 
  createTectonicBackupPDF 
} from './tectonicFallback';

// Check for Railway deployment environment
const isRailwayDeployment = process.env.RAILWAY_STATIC_URL || process.env.RAILWAY_SERVICE_ID;

/**
 * Compile LaTeX to PDF using Tectonic
 */
export async function compileTex(latexContent: string): Promise<{
  success: boolean;
  pdf?: string;
  error?: string;
  errorDetails?: { line: number; message: string }[];
  isHtml?: boolean;
}> {
  console.log('[LATEX DEBUG] Starting PDF compilation process');
  
  // Check if Tectonic is available in this environment
  const tectonicAvailable = await isTectonicAvailable();
  
  // If we're in Railway deployment and Tectonic isn't available, use fallback mechanism
  if (isRailwayDeployment && !tectonicAvailable) {
    console.log('[LATEX DEBUG] Running in Railway environment with Tectonic unavailable, using fallback');
    
    // Try backup PDF creation method first
    const backupPdf = await createTectonicBackupPDF(latexContent);
    
    if (backupPdf) {
      console.log('[LATEX DEBUG] Successfully created PDF using backup method');
      return {
        success: true,
        pdf: backupPdf
      };
    }
    
    // If backup PDF creation fails, generate HTML preview
    console.log('[LATEX DEBUG] Backup PDF creation failed, generating HTML preview');
    const htmlPreview = await generateHTMLPreview(latexContent);
    
    return {
      success: true,
      pdf: htmlPreview,
      isHtml: true
    };
  }
  
  // Create temporary directory
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'latex-'));
  const inputFile = path.join(tempDir, 'input.tex');
  const outputDir = path.join(tempDir, 'output');
  
  console.log(`[LATEX DEBUG] Created temporary directories:
   - Input file: ${inputFile}
   - Output directory: ${outputDir}`);
  
  try {
    // Create output directory
    await fs.mkdir(outputDir, { recursive: true });
    console.log('[LATEX DEBUG] Created output directory');
    
    // Write LaTeX content to file
    await fs.writeFile(inputFile, latexContent);
    console.log('[LATEX DEBUG] Wrote LaTeX content to file');
    
    // Log a preview of the LaTeX content (first 100 chars)
    const previewContent = latexContent.length > 100 
      ? latexContent.substring(0, 100) + '...' 
      : latexContent;
    console.log(`[LATEX DEBUG] LaTeX content preview: ${previewContent}`);
    
    // Run Tectonic
    console.log('[LATEX DEBUG] Starting Tectonic compilation...');
    const compilationResult = await runTectonic(inputFile, outputDir);
    
    if (!compilationResult.success) {
      console.log('[LATEX DEBUG] Tectonic compilation failed with error:', compilationResult.error);
      const errorDetails = parseErrorLog(compilationResult.error || '');
      console.log('[LATEX DEBUG] Parsed error details:', errorDetails);
      
      // If in Railway deployment and compilation fails, try fallback
      if (isRailwayDeployment) {
        console.log('[LATEX DEBUG] Attempting fallback mechanisms after compilation failure');
        
        // Try backup PDF creation method first
        const backupPdf = await createTectonicBackupPDF(latexContent);
        
        if (backupPdf) {
          console.log('[LATEX DEBUG] Successfully created PDF using backup method');
          return {
            success: true,
            pdf: backupPdf
          };
        }
        
        // If backup PDF creation fails, generate HTML preview
        console.log('[LATEX DEBUG] Backup PDF creation failed, generating HTML preview');
        const htmlPreview = await generateHTMLPreview(latexContent);
        
        return {
          success: true,
          pdf: htmlPreview,
          isHtml: true
        };
      }
      
      return {
        success: false,
        error: compilationResult.error,
        errorDetails: errorDetails
      };
    }
    
    console.log('[LATEX DEBUG] Tectonic compilation succeeded');
    
    // Read the compiled PDF
    const pdfPath = path.join(outputDir, 'input.pdf');
    console.log(`[LATEX DEBUG] Looking for PDF at path: ${pdfPath}`);
    
    const pdfExists = await fileExists(pdfPath);
    
    if (!pdfExists) {
      console.log('[LATEX DEBUG] PDF file was not found after successful compilation');
      
      // If in Railway deployment and PDF wasn't created, use fallback
      if (isRailwayDeployment) {
        console.log('[LATEX DEBUG] PDF not found in Railway environment, using fallback');
        const htmlPreview = await generateHTMLPreview(latexContent);
        
        return {
          success: true,
          pdf: htmlPreview,
          isHtml: true
        };
      }
      
      return {
        success: false,
        error: 'Compilation completed but PDF file was not created'
      };
    }
    
    console.log('[LATEX DEBUG] PDF file found, reading contents');
    
    // Read PDF and convert to base64
    const pdfData = await fs.readFile(pdfPath);
    console.log(`[LATEX DEBUG] PDF file size: ${pdfData.length} bytes`);
    
    const base64Pdf = pdfData.toString('base64');
    console.log(`[LATEX DEBUG] PDF converted to base64 (length: ${base64Pdf.length})`);
    
    return {
      success: true,
      pdf: base64Pdf
    };
  } catch (error) {
    console.error('Error during LaTeX compilation:', error);
    
    // If in Railway deployment and there's an error, use fallback
    if (isRailwayDeployment) {
      console.log('[LATEX DEBUG] Error in Railway environment, using fallback');
      const htmlPreview = await generateHTMLPreview(latexContent);
      
      return {
        success: true,
        pdf: htmlPreview,
        isHtml: true
      };
    }
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error during compilation'
    };
  } finally {
    // Clean up temporary files
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (cleanupError) {
      console.error('Error cleaning up temporary files:', cleanupError);
    }
  }
}

/**
 * Run Tectonic subprocess
 */
function runTectonic(inputFile: string, outputDir: string): Promise<{
  success: boolean;
  error?: string;
}> {
  return new Promise((resolve) => {
    // Build command arguments
    const args = [
      '--outdir', outputDir,
      '--keep-logs',
      '--chatter', 'minimal',
      inputFile
    ];
    
    console.log(`[LATEX DEBUG] Running Tectonic command: tectonic ${args.join(' ')}`);
    
    const tectonic = spawn('tectonic', args);
    
    let stdout = '';
    let stderr = '';
    
    tectonic.stdout.on('data', (data) => {
      const chunk = data.toString();
      stdout += chunk;
      console.log(`[LATEX DEBUG] Tectonic stdout: ${chunk}`);
    });
    
    tectonic.stderr.on('data', (data) => {
      const chunk = data.toString();
      stderr += chunk;
      console.log(`[LATEX DEBUG] Tectonic stderr: ${chunk}`);
    });
    
    tectonic.on('close', (code) => {
      console.log(`[LATEX DEBUG] Tectonic process exited with code: ${code}`);
      
      if (code === 0) {
        console.log('[LATEX DEBUG] Tectonic compilation successful');
        resolve({ success: true });
      } else {
        console.log('[LATEX DEBUG] Tectonic compilation failed');
        console.log(`[LATEX DEBUG] Full stdout: ${stdout}`);
        console.log(`[LATEX DEBUG] Full stderr: ${stderr}`);
        
        resolve({
          success: false,
          error: stderr || stdout || `Tectonic exited with code ${code}`
        });
      }
    });
    
    tectonic.on('error', (err) => {
      console.log(`[LATEX DEBUG] Failed to start Tectonic: ${err.message}`);
      resolve({
        success: false,
        error: `Failed to start Tectonic: ${err.message}`
      });
    });
    
    // Set a timeout for compilation (2 minutes)
    const timeout = setTimeout(() => {
      console.log('[LATEX DEBUG] Tectonic compilation timed out after 2 minutes');
      tectonic.kill();
      resolve({
        success: false,
        error: 'Compilation timed out after 2 minutes'
      });
    }, 2 * 60 * 1000);
    
    tectonic.on('close', () => {
      clearTimeout(timeout);
    });
  });
}

/**
 * Parse Tectonic error log to extract line numbers and error messages
 */
function parseErrorLog(errorLog: string): { line: number; message: string }[] {
  const errors: { line: number; message: string }[] = [];
  
  // Common LaTeX error patterns
  const patterns = [
    // Line number pattern
    /l\.(\d+)/,
    // Missing item
    /Missing \\\w+ inserted/,
    // Undefined control sequence
    /Undefined control sequence/,
    // Missing brace
    /Missing [{}] inserted/,
    // Extra brace
    /Extra [{}]/,
    // Missing math delimiter
    /Missing \$ inserted/,
    // TikZ errors
    /A node must have a label/,
    /Argument of \\pgffor@next has an extra }/
  ];
  
  // Split the error log into lines
  const lines = errorLog.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Look for line number references
    const lineMatch = line.match(/l\.(\d+)/);
    
    if (lineMatch) {
      const lineNumber = parseInt(lineMatch[1], 10);
      
      // Look for error message in this line or the next
      let errorMessage = line;
      
      // If error message is on the next line, add it
      if (i + 1 < lines.length && patterns.some(p => p.test(lines[i + 1]))) {
        errorMessage += ' ' + lines[i + 1];
      }
      
      errors.push({
        line: lineNumber,
        message: errorMessage.trim()
      });
    }
  }
  
  return errors;
}

/**
 * Check if file exists
 */
async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Fix compilation errors in LaTeX using AI
 */
export async function fixCompilationErrors(
  latex: string,
  errorDetails: string
): Promise<string> {
  // Create a prompt for the AI to fix the errors
  const prompt = `
I have a LaTeX document that fails to compile with the following errors:
${errorDetails}

Please fix these errors in the following LaTeX code and return ONLY the corrected code:

${latex}
`;

  try {
    // Use OpenAI specifically for error fixing
    const openaiClient = process.env.OPENAI_API_KEY 
      ? new (await import('openai')).default({ apiKey: process.env.OPENAI_API_KEY })
      : null;
    
    if (!openaiClient) {
      throw new Error('OpenAI API not configured for error fixing');
    }
    
    const response = await openaiClient.chat.completions.create({
      model: 'gpt-4o', // Use the most powerful model for error fixing
      messages: [
        { role: 'system', content: 'You are a LaTeX expert. Fix the errors in the provided LaTeX code and return only the corrected code without any explanations or markdown.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.2,
    });
    
    const fixedLatex = response.choices[0].message.content || '';
    
    // Check if the response contains LaTeX code by looking for \documentclass
    if (fixedLatex.includes('\\documentclass')) {
      return fixedLatex;
    }
    
    // If the response doesn't contain LaTeX code, extract it
    const latexRegex = /```latex\s*([\s\S]*?)\s*```/;
    const match = fixedLatex.match(latexRegex);
    
    if (match && match[1]) {
      return match[1].trim();
    }
    
    // Try to extract code between ``` and ``` if no language specified
    const codeBlockRegex = /```\s*([\s\S]*?)\s*```/;
    const codeMatch = fixedLatex.match(codeBlockRegex);
    
    if (codeMatch && codeMatch[1]) {
      return codeMatch[1].trim();
    }
    
    // If extraction fails, return the whole response
    return fixedLatex;
  } catch (error) {
    console.error('Error fixing LaTeX with AI:', error);
    
    // Fallback to original LaTeX if AI fixing fails
    return latex;
  }
}
