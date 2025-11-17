import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { createOllama } from 'ollama-ai-provider-v2';
import { createAmazonBedrock } from '@ai-sdk/amazon-bedrock';
import { streamText, convertToModelMessages, type UIMessage, tool } from 'ai';
import type { ProviderType } from '@/lib/providers';
import { tavily } from '@tavily/core';
import { z } from 'zod';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

// Initialize Tavily client only if API key is available
const tavilyClient = process.env.TAVILY_API_KEY 
  ? tavily({ apiKey: process.env.TAVILY_API_KEY })
  : null;

// Create provider instances
const lmstudio = createOpenAICompatible({
  name: 'lmstudio',
  baseURL: 'http://localhost:1234/v1',
});

const ollama = createOllama({
  baseURL: 'http://localhost:11434/api',
});

// Create Bedrock instance - will use environment variables or AWS credential chain
const bedrock = createAmazonBedrock({
  region: process.env.AWS_REGION || 'us-east-1',
  // Credentials will be loaded from environment variables:
  // AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_SESSION_TOKEN (optional)
});

export async function POST(req: Request) {
  const {
    messages,
    model: modelKey,
    provider = 'lmstudio',
    temperature = 0.7,
    maxTokens = 2000,
  }: { 
    messages: UIMessage[]; 
    model: string;
    provider?: ProviderType;
    temperature?: number;
    maxTokens?: number;
  } = await req.json();

  try {
    // Select the appropriate provider
    let selectedProvider;
    let errorContext = '';
    
    switch (provider) {
      case 'ollama':
        selectedProvider = ollama;
        errorContext = 'Make sure Ollama is running on http://localhost:11434';
        break;
      case 'bedrock':
        selectedProvider = bedrock;
        errorContext = 'Make sure AWS credentials are configured (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION)';
        break;
      case 'lmstudio':
      default:
        selectedProvider = lmstudio;
        errorContext = 'Make sure LM Studio is running on http://localhost:1234';
        break;
    }
    
    // Check if Tavily is configured
    const hasTavilyKey = !!process.env.TAVILY_API_KEY && tavilyClient !== null;
    
    // Use AI SDK's streamText with selected provider
    const result = streamText({
      model: selectedProvider(modelKey),
      system: hasTavilyKey 
        ? 'You are a helpful assistant with access to web search. When you need current information or facts, use the search tool to find accurate, up-to-date information.'
        : 'You are a helpful assistant that can answer questions and help with tasks',
      messages: convertToModelMessages(messages),
      temperature,
      maxOutputTokens: maxTokens,
      maxRetries: provider === 'bedrock' ? 2 : 1, // Bedrock may need retries for cold starts
      // Add Tavily search tool if API key is configured
      ...(hasTavilyKey ? {
        tools: {
          webSearch: tool({
            description: 'Search the web for current information, news, facts, or any topic. Use this when you need up-to-date or factual information.',
            inputSchema: z.object({
              query: z.string().describe('The search query to look up on the web'),
            }),
            execute: async ({ query }) => {
              if (!tavilyClient) {
                return { error: 'Tavily API key not configured' };
              }
              try {
                const response = await tavilyClient.search(query, {
                  maxResults: 5,
                  includeAnswer: true,
                  includeRawContent: false,
                });
                
                return {
                  answer: response.answer,
                  results: response.results.map((r: any) => ({
                    title: r.title,
                    url: r.url,
                    content: r.content,
                    score: r.score,
                  })),
                };
              } catch (error) {
                console.error('Tavily search error:', error);
                return {
                  error: 'Failed to search the web. Please try again.',
                };
              }
            },
          }),
        },
      } : {}),
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error(`${provider} API error:`, error);
    
    // Provide helpful error messages
    let errorMessage = 'Failed to generate response';
    let errorDetails = error instanceof Error ? error.message : 'Unknown error';
    
    if (provider === 'bedrock') {
      if (errorDetails.includes('credentials') || errorDetails.includes('AccessDenied')) {
        errorMessage = 'AWS credentials not configured or invalid';
        errorDetails = 'Please set AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, and AWS_REGION environment variables';
      } else if (errorDetails.includes('ResourceNotFoundException')) {
        errorMessage = 'Model not available in your AWS region';
        errorDetails = 'Please check model access in AWS Bedrock console';
      }
    }
    
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        details: errorDetails,
        provider,
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}