# Vercel Deployment Guide for AI LaTeX Generator

## Database Setup

This application requires a PostgreSQL database. Follow these steps to set it up for Vercel:

1. Create a [Neon](https://neon.tech) account (they offer a free tier perfect for this application)
2. Create a new project
3. In the Neon dashboard, copy your connection string
4. Add a DATABASE_URL environment variable in Vercel with this connection string

## Environment Variables

Set these environment variables in the Vercel dashboard:

- `DATABASE_URL`: Your Neon PostgreSQL connection string
- `OPENAI_API_KEY`: Your OpenAI API key (if using OpenAI)
- `ANTHROPIC_API_KEY`: Your Anthropic API key (if using Claude)
- `GROQ_API_KEY`: Your Groq API key (if using Groq)
- `SESSION_SECRET`: A long random string for securing sessions

## Deployment Steps

1. In Vercel, create a new project and import your GitHub repository
2. Set the Framework Preset to "Vite"
3. Add the environment variables listed above
4. Deploy!

## After Deployment

After your first deployment:

1. Run database migrations using the Vercel CLI or directly in the database
2. Check that authentication is working properly
3. Verify that all API endpoints are functioning