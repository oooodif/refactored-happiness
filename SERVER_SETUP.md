# AI LaTeX Generator Server Setup Guide

## Setup Overview

This guide provides the exact steps to get your AI LaTeX Generator working on Railway, including PDF generation with Tectonic.

## Option 1: The Docker Approach (Recommended)

Using Docker gives you complete control over dependencies and ensures Tectonic is installed correctly.

### Step 1: Deploy with the Dockerfile

1. Push these files to your repository (they're already created in this project):
   - `Dockerfile`
   - `.dockerignore` (if missing, create with `node_modules` and `.git` entries)

2. In Railway, create a new service from your GitHub repo
   - Select "Deploy from GitHub repo"
   - Choose Docker deployment option
   - Railway will automatically detect and use the Dockerfile

### Step 2: Add Required Environment Variables

Make sure these environment variables are set in Railway:
- `DATABASE_URL` - Your PostgreSQL connection string
- `NODE_ENV=production`
- `OPENAI_API_KEY` - Your OpenAI API key
- `GROQ_API_KEY` - Your Groq API key
- `ANTHROPIC_API_KEY` - Your Anthropic API key
- `STRIPE_SECRET_KEY` - Your Stripe secret key
- `VITE_STRIPE_PUBLISHABLE_KEY` - Your Stripe publishable key

## Option 2: Using Railway's Built-in Deployment with Nixpacks

If you prefer not to use Docker, you can use Railway's built-in deployment with custom configuration.

### Step 1: Add Configuration Files

1. Ensure these files are in your repository (they're already created):
   - `nixpacks.toml`
   - `.railway.toml`
   - `build.sh` (and ensure it's executable with `chmod +x build.sh`)

### Step 2: Deploy to Railway

1. In Railway, create a new service from your GitHub repo
   - Select "Deploy from GitHub repo"
   - Choose "Nixpacks" as the builder

### Step 3: Add Environment Variables (same as Option 1)

## Verifying Tectonic Installation

After deployment, you can check if Tectonic is properly installed by viewing the build logs in Railway. Look for:

```
tectonic --version
Tectonic 0.14.1
```

## Troubleshooting

### If PDF Generation Still Doesn't Work

1. **Check Build Logs**: Ensure Tectonic was installed successfully during build
   
2. **Check Runtime Logs**: Look for errors like "Failed to start Tectonic: spawn tectonic ENOENT"
   
3. **Try Running Command Manually**: Use Railway's shell access to run:
   ```
   tectonic --version
   ```

4. **Additional Dependencies**: If still encountering issues, you might need to add more TeX dependencies:
   ```
   # Add to Dockerfile
   RUN apt-get install -y texlive-full
   ```
   Note: This installs the full TeXLive distribution (2+ GB) and will significantly increase build time.

## Extra Resources

- [Tectonic Documentation](https://tectonic-typesetting.github.io/book/latest/)
- [Railway Deployment Docs](https://docs.railway.app/guides/dockerfiles)
- [LaTeX Resources](https://www.latex-project.org/)