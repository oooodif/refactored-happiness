# Railway Deployment Guide for AI LaTeX Generator with Tectonic Integration

This guide provides a comprehensive approach to deploying the AI LaTeX Generator application on Railway, with robust fallback mechanisms for LaTeX compilation using Tectonic.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Deployment Configuration](#deployment-configuration)
3. [Fallback Mechanism](#fallback-mechanism)
4. [Environment Variables](#environment-variables)
5. [Database Setup](#database-setup)
6. [Troubleshooting](#troubleshooting)

## Prerequisites

- Railway account (https://railway.app)
- GitHub repository with your application code
- Necessary API keys:
  - OpenAI API key
  - Anthropic API key (optional)
  - Groq API key (optional)

## Deployment Configuration

### Nixpacks Configuration

The `nixpacks.toml` file in the project root configures Railway's build and deployment process:

```toml
# nixpacks.toml - Configuration for Railway deployment

[phases.setup]
nixPkgs = [
  # Tectonic and its dependencies
  "tectonic",
  "fontconfig",
  "harfbuzz",
  "openssl",
  # Ensure necessary fonts are available
  "dejavu_fonts",
  "cm_unicode",
  "lmodern",
  "latin-modern-math",
  # Required for certain LaTeX operations
  "poppler_utils",
  "ghostscript"
]

[phases.build]
cmds = [
  "npm install",
  "npm run build"
]

[phases.deploy]
cmds = [
  "npm run db:push"
]

[start]
cmd = "NODE_ENV=production NODE_PATH=. tsx server/index.ts"
```

This configuration:
1. Installs Tectonic and its dependencies through Nix
2. Adds necessary fonts for proper LaTeX rendering
3. Sets up build and deployment commands
4. Configures the application startup command

## Fallback Mechanism

The application implements a robust fallback system to handle scenarios where Tectonic may not be available or working correctly:

### Tectonic Availability Check

The system uses `isTectonicAvailable()` to detect if Tectonic is properly installed and accessible:

```typescript
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
```

### HTML Preview Fallback

When Tectonic is unavailable, the system generates an HTML preview using MathJax for LaTeX math rendering:

```typescript
export async function generateHTMLPreview(latexContent: string): Promise<string> {
  // Creates an HTML document with MathJax for LaTeX math rendering
  const htmlContent = `
<!DOCTYPE html>
<html>
  <!-- HTML with MathJax for LaTeX rendering -->
  ...
</html>
  `;
  
  // Convert HTML to base64
  return Buffer.from(htmlContent).toString('base64');
}
```

### Client-Side Handling

The client is designed to handle both PDF and HTML content:

1. The `LatexCompilationResult` interface includes an `isHtml` flag
2. The `PDFPreview` component renders both PDF and HTML content appropriately
3. The download function handles both content types with appropriate extensions

## Environment Variables

Set the following environment variables in your Railway project:

```
DATABASE_URL=postgresql://...  # Auto-configured by Railway when using PostgreSQL
OPENAI_API_KEY=sk-...          # Your OpenAI API key
ANTHROPIC_API_KEY=sk-...       # Optional: Your Anthropic API key
GROQ_API_KEY=...               # Optional: Your Groq API key
```

## Database Setup

1. Add a PostgreSQL database in your Railway project
2. The database connection will be automatically configured
3. The application will run migrations automatically during deployment via `npm run db:push`

## Troubleshooting

### Tectonic Not Working

If Tectonic isn't working in your Railway deployment:

1. The application will automatically detect this and fall back to HTML preview
2. Check Railway logs for error messages related to Tectonic
3. Verify that all required packages are listed in `nixpacks.toml`

### PDF Viewer Issues

If the PDF viewer isn't working correctly:

1. Check if the HTML fallback is active (a notice will appear in the preview)
2. Verify that the browser has permission to display embedded content
3. Check network requests for any blocked content

### Database Connection Issues

If database connections fail:

1. Verify that the PostgreSQL addon is properly connected in Railway
2. Check that `DATABASE_URL` is properly set
3. Ensure database migrations are running during deployment