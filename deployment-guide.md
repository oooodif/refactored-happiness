# Railway Deployment Guide for AI LaTeX Generator with Tectonic Integration

This guide provides a comprehensive approach to deploying the AI LaTeX Generator application on Railway, with robust fallback mechanisms for LaTeX compilation using Tectonic.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Deployment Configuration](#deployment-configuration)
3. [Important: Docker Conflicts](#important-docker-conflicts)
4. [Fallback Mechanism](#fallback-mechanism)
5. [Environment Variables](#environment-variables)
6. [Database Setup](#database-setup)
7. [Troubleshooting](#troubleshooting)

## Prerequisites

- Railway account (https://railway.app)
- GitHub repository with your application code
- Necessary API keys:
  - OpenAI API key
  - Anthropic API key (optional)
  - Groq API key (optional)

## Deployment Configuration

## Important: Docker Conflicts

When deploying to Railway, you may encounter errors related to Docker or Nix package installation:

```
[stage-0 6/17] RUN nix-env -if .nixpacks/nixpkgs-ffeebf0acf3ae8b29f8c7049cd911b9636efd7e7.nix && nix-collect-garbage -d
"nix-env -if .nixpacks/nixpkgs-ffeebf0acf3ae8b29f8c7049cd911b9636efd7e7.nix && nix-collect-garbage -d" did not complete successfully: exit code: 1
```

Or Docker-related messages like:

```
[internal] load build definition from Dockerfile
```

To resolve these issues:

1. **Remove any Dockerfile** from your project - Railway will attempt to use Docker if it finds a Dockerfile, which conflicts with Nixpacks
2. **Check for `.dockerignore`** - Remove this file as well to avoid confusing the build system
3. **Use Railway's service settings** - In your Railway dashboard, navigate to your service settings and explicitly set the builder to "Nixpacks"
4. **Verify nixpacks.toml** - Ensure your nixpacks.toml file is in the root directory and uses compatible package names
5. **Check for conflicting configuration** - Remove any docker-compose.yml or similar files

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

### Docker Build Failures

If you encounter errors like "Error: Docker build failed":

1. **Manually override the builder**:
   - In your Railway dashboard, go to your service settings
   - Set the "Builder" to "Nixpacks" explicitly
   - Save settings and redeploy

2. **Clean your repository**:
   - Ensure there are no Docker-related files in your repository:
     ```
     rm -f Dockerfile docker-compose.yml .dockerignore
     ```
   - Use the provided script to handle Docker files in node_modules:
     ```
     node scripts/prepare-railway-deploy.js
     ```
   - This script will:
     - Find all Docker-related files in node_modules
     - Rename them to prevent detection by Railway
     - Update .npmignore with proper exclusion patterns
     - Create a log for easy restoration after deployment
   - After deployment, you can restore the renamed files:
     ```
     node scripts/restore-railway-files.js
     ```
   - Commit and push these changes to your repository

3. **Verify your `.railway.toml` file**:
   - Your file should include Node.js and TypeScript packages:
     ```toml
     [build]
     builder             = "NIXPACKS"
     buildCommand        = "npm run build"
     packages            = "nodejs_20 nodePackages.typescript tectonic"
     
     [deploy]
     preDeployCommand    = "npm run db:push"
     startCommand        = "NODE_ENV=production NODE_PATH=. npx tsx server/index.ts"
     
     healthcheckPath     = "/health"
     healthcheckTimeout  = 180
     restartPolicyType   = "ON_FAILURE"
     ```
   - Important: Use `npx tsx` instead of just `tsx` to ensure the command is found

4. **Verify your railway.json file**:
   - Your railway.json file should include Node.js and TypeScript packages:
     ```json
     {
       "$schema": "https://railway.app/railway.schema.json",
       "build": {
         "builder": "NIXPACKS",
         "buildCommand": "npm run build",
         "packages": ["nodejs_20", "nodePackages.typescript", "tectonic"]
       },
       "deploy": {
         "preDeployCommand": "npm run build && npm run db:push",
         "startCommand": "NODE_ENV=production NODE_PATH=. npx tsx server/index.ts",
         "healthcheckPath": "/health",
         "healthcheckTimeout": 180,
         "restartPolicyType": "ON_FAILURE",
         "restartPolicyMaxRetries": 10
       }
     }
     ```
   - Note: The duplicate "npm run build" in both buildCommand and preDeployCommand may be redundant but shouldn't cause issues
   - Important: Railway requires Node.js to be explicitly specified as a package, it's not automatically detected

5. **Verify the .npmignore file**:
   - An .npmignore file has been created to exclude Docker-related files:
     ```
     # Ignore Docker-related files to prevent Railway from detecting them
     **/Dockerfile
     **/docker-compose.yml
     **/docker-compose.yaml
     **/.dockerignore
     **/docker/
     
     # Ignore development files
     node_modules
     .git
     .github
     .gitlab
     .vscode
     .idea
     .env.local
     .env.*.local
     
     # Ignore test files
     **/*.test.js
     **/*.spec.js
     **/__tests__/
     **/test/
     **/tests/
     
     # Ignore documentation
     docs/
     *.md
     !README.md
     ```
   - This helps prevent Railway from detecting these files during deployment
   - Note: The prepare-railway-deploy.js script will also update this file if needed

6. **Troubleshooting Common Deployment Issues**:

   - **Error: Docker build failed**
     - This likely means Railway is using Docker instead of Nixpacks.
     - Solution: Use `scripts/prepare-railway-deploy.js` to hide Docker files.
     - Check the Railway dashboard and explicitly set the builder to "Nixpacks".

   - **Error: undefined variable 'latin-modern-math'**
     - This error occurs because the package doesn't exist in Nixpkgs.
     - Solution: Remove 'latin-modern-math' from nixpacks.toml and other config files.

   - **Error: npm: command not found**
     - Railway is not installing Node.js before running npm commands.
     - Solution: Add "nodejs_20" and "nodePackages.typescript" to the packages list in all config files.

   - **Error: tsx: command not found**
     - The tsx command isn't in PATH after Node.js installation.
     - Solution: Change the start command to use `npx tsx` instead of just `tsx`.
     
   - **Missing environment variables**
     - Make sure to set all required environment variables in Railway dashboard:
       - DATABASE_URL (set by PostgreSQL plugin)
       - OPENAI_API_KEY
       - ANTHROPIC_API_KEY
       - GROQ_API_KEY
       - SESSION_SECRET (can be any secure random string)
       - STRIPE_SECRET_KEY
       - VITE_STRIPE_PUBLISHABLE_KEY

7. **Last resort: Start from a fresh project**:
   - If you continue to encounter Docker-related failures, consider creating a new Railway project
   - Connect it to your repository
   - Add the PostgreSQL plugin
   - Set your environment variables
   - Deploy with Nixpacks explicitly selected