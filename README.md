# AI LaTeX Generator

A comprehensive web-based AI LaTeX Generator that simplifies document creation through advanced AI integrations and intelligent document generation tools.

## Key Features

- AI-powered LaTeX generation from simple text descriptions
- Multiple AI provider support (OpenAI, Anthropic, Groq)
- PDF preview and download
- User authentication and subscription tiers
- Collaborative editing functionality
- User-friendly tag system for non-LaTeX users

## Tech Stack

- React.js frontend with TypeScript
- Express.js backend
- PostgreSQL database with Drizzle ORM
- PDF.js for document rendering
- Multi-AI provider integration
- Tectonic for LaTeX compilation

## Railway Deployment Instructions

### Prerequisites

1. GitHub account (for Railway login)
2. Railway account
3. API keys for AI providers (OpenAI, Anthropic, Groq)

### Steps to Deploy

1. **Sign up for Railway**
   - Go to [Railway.app](https://railway.app/)
   - Sign up with GitHub

2. **Create a New Project**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose this repository

3. **Set Up PostgreSQL Database**
   - In your project, click "New Service"
   - Select "Database" → "PostgreSQL"
   - Wait for the database to be provisioned

4. **Set Environment Variables**
   
   Click on your web service, go to "Variables" tab, and add:
   
   - `DATABASE_URL` (Copy this from the PostgreSQL service's "Connect" tab)
   - `SESSION_SECRET` (A random string for securing sessions)
   - `OPENAI_API_KEY` (Your OpenAI API key)
   - `ANTHROPIC_API_KEY` (Your Anthropic API key)
   - `GROQ_API_KEY` (Your Groq API key)
   - Any other API keys needed for service integrations

5. **Deploy**
   - Railway will automatically deploy your application
   - After deployment, click on "Generate Domain" to get a public URL

6. **Run Database Migrations**
   - Go to your project settings
   - Add a one-time job with the command: `npm run db:push`
   - This will set up your database schema

## Local Development

1. Clone this repository
2. Install dependencies: `npm install`
3. Create a `.env` file with the required environment variables
4. Run the application: `npm run dev`

## License

[MIT License](LICENSE)