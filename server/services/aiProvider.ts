import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import axios from 'axios';
import { AI_MODELS } from '@/lib/constants';
import { LATEX_SYSTEM_PROMPT } from '../utils/prompts';
import { SubscriptionTier } from '@shared/schema';

// Configure API clients
const openaiClient = process.env.OPENAI_API_KEY 
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

const anthropicClient = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null;

// Fallback API keys for alternative services
const groqApiKey = process.env.GROQ_API_KEY;
const togetherApiKey = process.env.TOGETHER_API_KEY;
const huggingfaceApiKey = process.env.HUGGINGFACE_API_KEY;
const fireworksApiKey = process.env.FIREWORKS_API_KEY;
const openrouterApiKey = process.env.OPENROUTER_API_KEY;

// Track API provider status
const providerStatus = {
  openai: { available: !!openaiClient, rateLimited: false, lastError: null },
  anthropic: { available: !!anthropicClient, rateLimited: false, lastError: null },
  groq: { available: !!groqApiKey, rateLimited: false, lastError: null },
  together: { available: !!togetherApiKey, rateLimited: false, lastError: null },
  huggingface: { available: !!huggingfaceApiKey, rateLimited: false, lastError: null },
  fireworks: { available: !!fireworksApiKey, rateLimited: false, lastError: null },
  openrouter: { available: !!openrouterApiKey, rateLimited: false, lastError: null }
};

// API provider configurations
const providers = {
  openai: {
    name: 'OpenAI',
    models: {
      'gpt-4o': { tier: SubscriptionTier.Power },
      'gpt-3.5-turbo': { tier: SubscriptionTier.Basic }
    },
    async generateLatex(prompt: string, model: string = 'gpt-4o'): Promise<string> {
      if (!openaiClient) throw new Error('OpenAI API not configured');

      const response = await openaiClient.chat.completions.create({
        model: model,
        messages: [
          { role: 'system', content: LATEX_SYSTEM_PROMPT },
          { role: 'user', content: prompt }
        ],
        temperature: 0.2,
        max_tokens: 4000
      });

      return extractLatexFromResponse(response.choices[0].message.content || '');
    }
  },
  
  anthropic: {
    name: 'Anthropic',
    models: {
      'claude-3-7-sonnet-20250219': { tier: SubscriptionTier.Pro },
      'claude-3-haiku-20240307': { tier: SubscriptionTier.Basic }
    },
    async generateLatex(prompt: string, model: string = 'claude-3-7-sonnet-20250219'): Promise<string> {
      if (!anthropicClient) throw new Error('Anthropic API not configured');

      const response = await anthropicClient.messages.create({
        model: model,
        system: LATEX_SYSTEM_PROMPT,
        max_tokens: 4000,
        temperature: 0.2,
        messages: [{ role: 'user', content: prompt }]
      });

      const textContent = response.content[0].type === 'text' 
        ? (response.content[0] as {type: 'text', text: string}).text 
        : '';
      return extractLatexFromResponse(textContent);
    }
  },
  
  groq: {
    name: 'Groq',
    models: {
      'llama3-8b-8192': { tier: SubscriptionTier.Free },
      'mixtral-8x7b-32768': { tier: SubscriptionTier.Free }
    },
    // Track token usage for Groq
    totalTokensUsed: 0,
    MAX_TOKENS: 1_000_000, // About $50 worth of tokens
    
    async generateLatex(prompt: string, model: string = 'llama3-8b-8192'): Promise<string> {
      if (!groqApiKey) throw new Error('Groq API not configured');
      
      // Estimate tokens in the request (very rough estimate: ~1.3 tokens per word)
      const systemPromptTokens = Math.ceil(LATEX_SYSTEM_PROMPT.split(/\s+/).length * 1.3);
      const promptTokens = Math.ceil(prompt.split(/\s+/).length * 1.3);
      const estimatedRequestTokens = systemPromptTokens + promptTokens + 4000; // Include max response tokens
      
      // Check if we'll exceed our budget
      if (this.totalTokensUsed + estimatedRequestTokens > this.MAX_TOKENS) {
        throw new Error('Groq spending limit exceeded. Using fallback providers.');
      }

      try {
        const response = await axios.post(
          'https://api.groq.com/openai/v1/chat/completions',
          {
            model: model,
            messages: [
              { role: 'system', content: LATEX_SYSTEM_PROMPT },
              { role: 'user', content: prompt }
            ],
            temperature: 0.2,
            max_tokens: 4000
          },
          {
            headers: {
              'Authorization': `Bearer ${groqApiKey}`,
              'Content-Type': 'application/json'
            }
          }
        );

        // Update token usage (use actual tokens if available, otherwise use estimates)
        const tokensUsed = response.data.usage?.total_tokens || estimatedRequestTokens;
        this.totalTokensUsed += tokensUsed;
        console.log(`Groq token usage: ${this.totalTokensUsed}/${this.MAX_TOKENS}`);
        
        return extractLatexFromResponse(response.data.choices[0].message.content || '');
      } catch (error) {
        // If we get a 429 (rate limit) error, might be approaching limits, so track it
        const errorObj = error as any;
        if (errorObj.response?.status === 429) {
          this.totalTokensUsed = this.MAX_TOKENS; // Mark as at limit
        }
        throw error;
      }
    }
  },
  
  together: {
    name: 'TogetherAI',
    models: {
      'mistral-7b-instruct': { tier: SubscriptionTier.Free }
    },
    async generateLatex(prompt: string, model: string = 'mistral-7b-instruct'): Promise<string> {
      if (!togetherApiKey) throw new Error('TogetherAI API not configured');

      const response = await axios.post(
        'https://api.together.xyz/v1/chat/completions',
        {
          model: model,
          messages: [
            { role: 'system', content: LATEX_SYSTEM_PROMPT },
            { role: 'user', content: prompt }
          ],
          temperature: 0.2,
          max_tokens: 4000
        },
        {
          headers: {
            'Authorization': `Bearer ${togetherApiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return extractLatexFromResponse(response.data.choices[0].message.content || '');
    }
  },
  
  huggingface: {
    name: 'HuggingFace',
    models: {
      'HuggingFaceH4/zephyr-7b-beta': { tier: SubscriptionTier.Free }
    },
    async generateLatex(prompt: string, model: string = 'HuggingFaceH4/zephyr-7b-beta'): Promise<string> {
      if (!huggingfaceApiKey) throw new Error('HuggingFace API not configured');

      const response = await axios.post(
        `https://api-inference.huggingface.co/models/${model}`,
        {
          inputs: `<|system|>\n${LATEX_SYSTEM_PROMPT}\n<|user|>\n${prompt}\n<|assistant|>`,
          parameters: {
            temperature: 0.2,
            max_new_tokens: 4000
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${huggingfaceApiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return extractLatexFromResponse(response.data.generated_text || '');
    }
  },
  
  openrouter: {
    name: 'OpenRouter',
    models: {
      'google/gemini-pro': { tier: SubscriptionTier.Basic },
      'anthropic/claude-3-sonnet': { tier: SubscriptionTier.Pro },
      'openai/gpt-4': { tier: SubscriptionTier.Power }
    },
    async generateLatex(prompt: string, model: string = 'google/gemini-pro'): Promise<string> {
      if (!openrouterApiKey) throw new Error('OpenRouter API not configured');

      const response = await axios.post(
        'https://openrouter.ai/api/v1/chat/completions',
        {
          model: model,
          messages: [
            { role: 'system', content: LATEX_SYSTEM_PROMPT },
            { role: 'user', content: prompt }
          ],
          temperature: 0.2,
          max_tokens: 4000
        },
        {
          headers: {
            'Authorization': `Bearer ${openrouterApiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': process.env.DOMAIN || 'http://localhost:5000',
            'X-Title': 'AI LaTeX Generator'
          }
        }
      );

      return extractLatexFromResponse(response.data.choices[0].message.content || '');
    }
  }
};

/**
 * Generate LaTeX from input content with fallback mechanisms
 */
export async function generateLatex(
  content: string, 
  documentType: string,
  options?: {
    model?: string;
    splitTables?: boolean;
    useMath?: boolean;
  }
): Promise<{ success: boolean; latex?: string; error?: string }> {
  // Prepare the prompt with document type and options
  const prompt = preparePrompt(content, documentType, options);
  
  // Try the specified model first
  if (options?.model) {
    try {
      const latex = await callProviderWithModel(options.model, prompt);
      return { success: true, latex };
    } catch (error) {
      console.error(`Error with specified model ${options.model}:`, error);
      // Fall through to provider chain
    }
  }
  
  // Provider fallback chain - try providers in order
  const providerChain = determineProviderChain();
  
  for (const provider of providerChain) {
    try {
      // Skip if provider is unavailable or rate limited
      if (!providerStatus[provider].available || providerStatus[provider].rateLimited) {
        continue;
      }
      
      // Get default model for the provider
      const defaultModel = Object.keys(providers[provider].models)[0];
      
      // Call the provider
      const latex = await providers[provider].generateLatex(prompt, defaultModel);
      console.log(`Successfully generated LaTeX using ${providers[provider].name}`);
      
      return { success: true, latex };
    } catch (error) {
      console.error(`Error with provider ${provider}:`, error);
      
      // Update provider status
      providerStatus[provider].lastError = error;
      
      // Check for rate limiting
      const errorObj = error as any;
      if (errorObj.response?.status === 429 || 
          (typeof errorObj.message === 'string' && errorObj.message.includes('rate limit'))) {
        providerStatus[provider].rateLimited = true;
        
        // Reset rate limit status after 5 minutes
        setTimeout(() => {
          providerStatus[provider].rateLimited = false;
        }, 5 * 60 * 1000);
      }
    }
  }
  
  return { 
    success: false, 
    error: "All AI providers failed to generate LaTeX. Please try again later." 
  };
}

/**
 * Call a specific AI provider based on the model name
 */
export async function callProviderWithModel(model: string, prompt: string): Promise<string> {
  // Find which provider owns this model
  for (const [providerName, provider] of Object.entries(providers)) {
    if (model in provider.models) {
      return provider.generateLatex(prompt, model);
    }
  }
  
  throw new Error(`Model "${model}" not found in any provider`);
}

/**
 * Determine provider chain based on availability
 */
function determineProviderChain(): string[] {
  // Default priority: groq, together, huggingface, anthropic, openai, openrouter
  const defaultChain = ['groq', 'together', 'huggingface', 'anthropic', 'openai', 'openrouter'];
  
  // Filter to only available providers and sort by priority
  return defaultChain.filter(provider => providerStatus[provider].available);
}

/**
 * Get available models based on user's subscription tier
 */
export async function getAvailableModels(userTier: string): Promise<any[]> {
  const availableModels = [];
  
  // Collect models from all providers that match the user's tier or lower
  for (const [providerName, provider] of Object.entries(providers)) {
    // Skip unavailable providers
    if (!providerStatus[providerName].available) continue;
    
    for (const [modelName, modelInfo] of Object.entries(provider.models)) {
      const tierAccess = {
        [SubscriptionTier.Free]: [SubscriptionTier.Free],
        [SubscriptionTier.Basic]: [SubscriptionTier.Free, SubscriptionTier.Basic],
        [SubscriptionTier.Pro]: [SubscriptionTier.Free, SubscriptionTier.Basic, SubscriptionTier.Pro],
        [SubscriptionTier.Power]: [SubscriptionTier.Free, SubscriptionTier.Basic, SubscriptionTier.Pro, SubscriptionTier.Power]
      };
      
      if (tierAccess[userTier].includes(modelInfo.tier)) {
        availableModels.push({
          id: modelName,
          name: `${modelName} (${provider.name})`,
          provider: providerName,
          tier: modelInfo.tier
        });
      }
    }
  }
  
  return availableModels;
}

/**
 * Prepare prompt with document type and options
 */
function preparePrompt(
  content: string, 
  documentType: string,
  options?: {
    splitTables?: boolean;
    useMath?: boolean;
  }
): string {
  // Check if content is empty or undefined
  if (!content || content.trim() === '') {
    content = 'Generate a simple example document.';
  }
  
  // Format the prompt with document type first, then user content clearly marked
  let prompt = `Document Type: ${documentType}\n\nUSER CONTENT:\n${content}\n`;
  
  // Add options
  if (options) {
    const optionsText = [];
    
    if (options.splitTables !== undefined) {
      optionsText.push(`Split Tables: ${options.splitTables ? 'Yes' : 'No'}`);
    }
    
    if (options.useMath !== undefined) {
      optionsText.push(`Use Math Mode: ${options.useMath ? 'Yes' : 'No'}`);
    }
    
    if (optionsText.length > 0) {
      prompt = `${prompt}\nOptions:\n${optionsText.join('\n')}`;
    }
  }
  
  // Add specific instructions to prevent unwanted math equations in regenerations
  // and emphasize that user content must be incorporated exactly as provided
  prompt = `${prompt}\n\nIMPORTANT INSTRUCTIONS:\n1. INCORPORATE THE USER CONTENT EXACTLY AS PROVIDED - DO NOT IGNORE OR REPLACE THE TEXT ABOVE.\n2. DO NOT ADD ANY MATH EQUATIONS UNLESS EXPLICITLY REQUESTED.\n3. DO NOT INSERT MATHEMATICAL EXPRESSIONS THAT ARE NOT LITERALLY PRESENT IN THE USER CONTENT.\n4. TREAT ALL USER TEXT LITERALLY, ESPECIALLY WHEN REGENERATING CONTENT.`;
  
  return prompt;
}

/**
 * Extract LaTeX code from AI response
 */
function extractLatexFromResponse(response: string): string {
  // Try to extract code between ```latex and ``` markers
  const latexRegex = /```latex\s*([\s\S]*?)\s*```/;
  const match = response.match(latexRegex);
  
  if (match && match[1]) {
    return match[1].trim();
  }
  
  // Try to extract code between ``` and ``` if no language specified
  const codeBlockRegex = /```\s*([\s\S]*?)\s*```/;
  const codeMatch = response.match(codeBlockRegex);
  
  if (codeMatch && codeMatch[1]) {
    return codeMatch[1].trim();
  }
  
  // If no code blocks found, try to find LaTeX content by looking for \documentclass and \end{document}
  const documentClassRegex = /\\documentclass[\s\S]*?\\end{document}/;
  const documentClassMatch = response.match(documentClassRegex);
  
  if (documentClassMatch && documentClassMatch[0]) {
    return documentClassMatch[0].trim();
  }
  
  // If we just have \documentclass but not a full match
  if (response.includes('\\documentclass')) {
    // Find the starting position of \documentclass
    const startPos = response.indexOf('\\documentclass');
    return response.substring(startPos).trim();
  }
  
  // Return the whole response as a fallback
  return response.trim();
}

/**
 * Modify existing LaTeX content based on user notes or omission instructions
 * @param latexContent Existing LaTeX content to modify
 * @param notes User notes or instructions for the modification
 * @param isOmit Whether this is an omission request (remove specific content)
 * @param options Additional options for generation
 * @returns Object with success status and modified LaTeX content
 */
export async function modifyLatex(
  latexContent: string,
  notes: string,
  isOmit: boolean = false,
  options: any = {}
) {
  try {
    // Construct a prompt for the AI to modify the LaTeX
    let prompt = isOmit
      ? `EXISTING LATEX CODE:\n\`\`\`latex\n${latexContent}\n\`\`\`\n\nREMOVE THE FOLLOWING CONTENT FROM THE LATEX CODE (make no other changes):\n${notes}\n\nReturn the complete modified LaTeX code with the specified content removed.`
      : `EXISTING LATEX CODE:\n\`\`\`latex\n${latexContent}\n\`\`\`\n\nMODIFY THE LATEX CODE ACCORDING TO THESE INSTRUCTIONS:\n${notes}\n\nReturn the complete modified LaTeX code with the requested changes applied.`;

    // Default to using the most powerful model for modifications
    // This ensures precise, accurate changes
    const modelToUse = options.model || 'gpt-4o';
    
    // Use the provider selection logic we already have
    const result = await callProviderWithModel(prompt, modelToUse);
    
    // Extract the LaTeX from the response
    const modifiedLatex = extractLatexFromResponse(result);
    
    return {
      success: true,
      latex: modifiedLatex
    };
  } catch (error) {
    console.error('Error modifying LaTeX:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to modify LaTeX content',
      latex: latexContent // Return the original unmodified content
    };
  }
}

// exports are already defined individually throughout the file
