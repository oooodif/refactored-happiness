/**
 * Fallback for Tectonic compilation in deployment environments
 * This provides a way to handle LaTeX when Tectonic is not available
 */
import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import axios from 'axios';

/**
 * Check if Tectonic is installed and working
 */
export async function isTectonicAvailable(): Promise<boolean> {
  return new Promise((resolve) => {
    const tectonic = spawn('tectonic', ['--version']);
    
    tectonic.on('close', (code) => {
      resolve(code === 0);
    });
    
    tectonic.on('error', () => {
      resolve(false);
    });
    
    // Set a timeout in case tectonic hangs
    setTimeout(() => {
      tectonic.kill();
      resolve(false);
    }, 2000);
  });
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
      processEnvironments: true
    },
    options: {
      skipHtmlTags: ['script', 'noscript', 'style', 'textarea', 'pre']
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
    }
    pre {
      background-color: #f5f5f5;
      padding: 10px;
      border-radius: 5px;
      overflow-x: auto;
    }
    .latex-content {
      white-space: pre-wrap;
      font-family: monospace;
    }
  </style>
</head>
<body>
  <h1>LaTeX Preview</h1>
  <p><em>Note: This is a preview. PDF compilation is not available in this deployment environment.</em></p>
  <h2>Raw LaTeX</h2>
  <pre class="latex-content">${escapeHtml(latexContent)}</pre>
</body>
</html>
  `;
  
  // Convert HTML to base64
  return Buffer.from(htmlContent).toString('base64');
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