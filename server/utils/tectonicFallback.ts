/**
 * Fallback for Tectonic compilation in deployment environments
 * This provides a way to handle LaTeX when Tectonic is not available
 */
import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';

/**
 * Check if Tectonic is installed and working
 */
export async function isTectonicAvailable(): Promise<boolean> {
  console.log('[LATEX DEBUG] Checking if Tectonic is available...');
  
  return new Promise((resolve) => {
    try {
      const tectonic = spawn('tectonic', ['--version']);
      
      let stdout = '';
      let stderr = '';
      
      tectonic.stdout.on('data', (data) => {
        stdout += data.toString();
      });
      
      tectonic.stderr.on('data', (data) => {
        stderr += data.toString();
      });
      
      tectonic.on('close', (code) => {
        console.log(`[LATEX DEBUG] Tectonic version check exited with code ${code}`);
        if (stdout) console.log(`[LATEX DEBUG] Tectonic version check output: ${stdout.trim()}`);
        if (stderr) console.log(`[LATEX DEBUG] Tectonic version check error: ${stderr.trim()}`);
        
        resolve(code === 0);
      });
      
      tectonic.on('error', (err) => {
        console.log(`[LATEX DEBUG] Failed to execute Tectonic command: ${err.message}`);
        resolve(false);
      });
      
      // Set a timeout in case tectonic hangs
      setTimeout(() => {
        console.log('[LATEX DEBUG] Tectonic version check timed out');
        tectonic.kill();
        resolve(false);
      }, 2000);
    } catch (err) {
      console.log(`[LATEX DEBUG] Exception when checking Tectonic: ${err instanceof Error ? err.message : String(err)}`);
      resolve(false);
    }
  });
}

/**
 * Extract the main content from the LaTeX document for preview
 * This function attempts to find the main body content between \begin{document} and \end{document}
 */
function extractMainContent(latexContent: string): string {
  // Try to extract content between \begin{document} and \end{document}
  const bodyMatch = latexContent.match(/\\begin{document}([\s\S]*?)\\end{document}/);
  
  if (bodyMatch && bodyMatch[1]) {
    // Process the extracted content to make it more MathJax-friendly
    let content = bodyMatch[1]
      // Keep math environments as they are
      .replace(/\\begin{(equation|align|gather|multline)(\*?)}([\s\S]*?)\\end{\1\2}/g, (match) => match)
      .replace(/\\begin{(array|matrix|pmatrix|bmatrix|Bmatrix|vmatrix|Vmatrix)}([\s\S]*?)\\end{\1}/g, (match) => match)
      // Replace section commands with HTML headers
      .replace(/\\section{([^}]+)}/g, '<h2>$1</h2>')
      .replace(/\\subsection{([^}]+)}/g, '<h3>$1</h3>')
      .replace(/\\subsubsection{([^}]+)}/g, '<h4>$1</h4>')
      // Replace simple formatting
      .replace(/\\textbf{([^}]+)}/g, '<strong>$1</strong>')
      .replace(/\\textit{([^}]+)}/g, '<em>$1</em>')
      .replace(/\\\underline{([^}]+)}/g, '<u>$1</u>')
      // Handle paragraphs
      .replace(/\n\n+/g, '<p></p>')
      // Replace \item with list items
      .replace(/\\item\s/g, '<li>')
      // Replace itemize and enumerate environments
      .replace(/\\begin{itemize}([\s\S]*?)\\end{itemize}/g, '<ul>$1</ul>')
      .replace(/\\begin{enumerate}([\s\S]*?)\\end{enumerate}/g, '<ol>$1</ol>');
      
    return content;
  }
  
  // If no document environment, just sanitize a bit and return as-is
  return latexContent
    .replace(/\\documentclass[\s\S]*?(?=\\begin{document}|$)/, '')  // Remove preamble
    .replace(/\\begin{document}|\\end{document}/g, '');             // Remove document tags
}

/**
 * Escape HTML special characters to prevent XSS
 */
function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Simple HTML wrapper for LaTeX - used as a fallback
 * when Tectonic is not available
 */
export async function generateHTMLPreview(latexContent: string): Promise<string> {
  // Create a simple HTML preview of the LaTeX code
  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>LaTeX Preview</title>
  <script>
  MathJax = {
    tex: {
      inlineMath: [['$', '$'], ['\\\\(', '\\\\)']],
      displayMath: [['$$', '$$'], ['\\\\[', '\\\\]']],
      processEscapes: true,
      processEnvironments: true,
      packages: ['base', 'ams', 'noerrors', 'noundefined', 'autoload', 'color', 'colortbl']
    },
    options: {
      skipHtmlTags: ['script', 'noscript', 'style', 'textarea', 'pre.code'],
      enableMenu: false
    },
    svg: {
      fontCache: 'global'
    },
    startup: {
      pageReady() {
        return MathJax.startup.defaultPageReady().then(() => {
          document.querySelector('.loading').style.display = 'none';
          document.querySelector('.content').style.display = 'block';
        });
      }
    }
  };
  </script>
  <script id="MathJax-script" async src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"></script>
  <style>
    body {
      font-family: 'Latin Modern Roman', serif;
      line-height: 1.6;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f8f9fa;
      color: #333;
    }
    .banner {
      background-color: #fdf6e3;
      border: 1px solid #e6d9b8;
      border-radius: 5px;
      padding: 10px 15px;
      margin-bottom: 20px;
      color: #7c6f51;
    }
    pre {
      background-color: #f5f5f5;
      padding: 15px;
      border-radius: 5px;
      overflow-x: auto;
      border: 1px solid #e0e0e0;
    }
    .latex-content {
      white-space: pre-wrap;
      font-family: monospace;
      font-size: 0.9em;
    }
    h1 {
      color: #0f4c75;
      border-bottom: 2px solid #e0e0e0;
      padding-bottom: 8px;
    }
    h2 {
      color: #0f4c75;
      margin-top: 25px;
    }
    .loading {
      display: block;
      text-align: center;
      margin: 50px 0;
    }
    .content {
      display: none;
    }
    .spinner {
      border: 4px solid #f3f3f3;
      border-radius: 50%;
      border-top: 4px solid #3498db;
      width: 40px;
      height: 40px;
      animation: spin 1s linear infinite;
      margin: 0 auto 20px auto;
    }
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    .math-preview {
      background-color: white;
      padding: 15px;
      border-radius: 5px;
      margin-top: 20px;
      border: 1px solid #e0e0e0;
    }
  </style>
</head>
<body>
  <div class="loading">
    <div class="spinner"></div>
    <p>Rendering LaTeX preview...</p>
  </div>
  
  <div class="content">
    <h1>LaTeX Preview</h1>
    
    <div class="banner">
      <strong>Note:</strong> This is an HTML preview as PDF compilation is currently unavailable in this environment. 
      LaTeX math formulas are rendered using MathJax.
    </div>
    
    <div class="math-preview">
      <h2>Rendered Preview</h2>
      <div id="rendered-math">
        ${extractMainContent(latexContent)}
      </div>
    </div>
    
    <h2>Raw LaTeX</h2>
    <pre class="latex-content">${escapeHtml(latexContent)}</pre>
  </div>
  
  <script>
    // Attempt to scroll to first equation or figure if exists
    window.addEventListener('load', function() {
      setTimeout(() => {
        const firstEq = document.querySelector('.mjx-math');
        if (firstEq) {
          firstEq.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 1500);
    });
  </script>
</body>
</html>
  `;
  
  // Convert HTML to base64
  return Buffer.from(htmlContent).toString('base64');
}

/**
 * Alternative compilation using Tectonic in a controlled environment
 * This can be a backup solution if direct Tectonic execution fails
 */
export async function createTectonicBackupPDF(latexContent: string): Promise<string | null> {
  try {
    // Create temporary directory for LaTeX file
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'latex-backup-'));
    const inputFile = path.join(tempDir, 'input.tex');
    
    // Write LaTeX content to file
    await fs.writeFile(inputFile, latexContent);
    
    return await compileTectonicWithRetry(inputFile, tempDir);
  } catch (error) {
    console.error('Backup PDF creation failed:', error);
    return null;
  }
}

/**
 * Try different Tectonic compilation methods
 */
async function compileTectonicWithRetry(inputFile: string, tempDir: string): Promise<string | null> {
  // Try different ways to invoke Tectonic
  const methods = [
    // Standard method
    async () => {
      const result = await new Promise<boolean>((resolve) => {
        const tectonic = spawn('tectonic', [
          '--outdir', tempDir,
          '--keep-logs',
          inputFile
        ]);
        
        tectonic.on('close', (code) => resolve(code === 0));
        tectonic.on('error', () => resolve(false));
        
        // Set a timeout
        setTimeout(() => {
          tectonic.kill();
          resolve(false);
        }, 30000);
      });
      
      return result;
    },
    
    // Try with absolute path
    async () => {
      const tectonicPath = '/nix/store/mypv97ahq8pnkgqd8pz4za41vw5wxm3n-tectonic-0.14.1/bin/tectonic';
      const result = await new Promise<boolean>((resolve) => {
        const tectonic = spawn(tectonicPath, [
          '--outdir', tempDir,
          '--keep-logs',
          inputFile
        ]);
        
        tectonic.on('close', (code) => resolve(code === 0));
        tectonic.on('error', () => resolve(false));
        
        // Set a timeout
        setTimeout(() => {
          tectonic.kill();
          resolve(false);
        }, 30000);
      });
      
      return result;
    }
  ];
  
  // Try each method
  for (const method of methods) {
    try {
      const success = await method();
      
      if (success) {
        // Check if PDF was generated
        const pdfPath = path.join(tempDir, 'input.pdf');
        try {
          const pdfData = await fs.readFile(pdfPath);
          return pdfData.toString('base64');
        } catch (err) {
          continue; // Try next method if PDF file doesn't exist
        }
      }
    } catch (error) {
      continue; // Try next method
    }
  }
  
  return null; // All methods failed
}