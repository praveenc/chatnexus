import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { createOllama } from 'ollama-ai-provider-v2';
import { createAmazonBedrock } from '@ai-sdk/amazon-bedrock';
import { streamText, convertToModelMessages, type UIMessage } from 'ai';
import type { ProviderType } from '@/lib/providers';
// import { tavily } from '@tavily/core';
// import { z } from 'zod';
// import { tool } from 'ai';
import { fromNodeProviderChain } from '@aws-sdk/credential-providers';
import { saveMessage, updateConversation } from '@/lib/db/operations';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

// Require Node.js runtime for MongoDB driver
export const runtime = 'nodejs';

// TAVILY WEB SEARCH - COMMENTED OUT
// Initialize Tavily client only if API key is available
// const tavilyClient = process.env.TAVILY_API_KEY
//   ? tavily({ apiKey: process.env.TAVILY_API_KEY })
//   : null;

// Create provider instances
const lmstudio = createOpenAICompatible({
  name: 'lmstudio',
  baseURL: 'http://localhost:1234/v1',
});

const ollama = createOllama({
  baseURL: 'http://localhost:11434/api',
});

/**
 * Create Bedrock instance with flexible credential loading
 * Supports: environment variables, AWS profiles, IAM roles, etc.
 */
function createBedrockProvider() {
  const region = process.env.AWS_REGION || 'us-east-1';

  // If explicit credentials are provided, use them
  if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
    return createAmazonBedrock({
      region,
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      sessionToken: process.env.AWS_SESSION_TOKEN,
    });
  }

  // Otherwise, use AWS credential provider chain (IAM roles, profiles, etc.)
  return createAmazonBedrock({
    region,
    credentialProvider: fromNodeProviderChain(),
  });
}

const bedrock = createBedrockProvider();

export async function POST(req: Request) {
  const {
    messages,
    conversationId,
    model: modelKey,
    provider = 'lmstudio',
    temperature = 0.7,
    maxTokens = 2000,
  }: {
    messages: UIMessage[];
    conversationId?: string;
    model: string;
    provider?: ProviderType;
    temperature?: number;
    maxTokens?: number;
  } = await req.json();

  // Save user message (non-blocking)
  if (conversationId && messages.length > 0) {
    saveMessage(conversationId, messages[messages.length - 1])
      .catch(err => console.error('Failed to save user message:', err));
  }

  try {
    // Select the appropriate provider
    let selectedProvider;

    switch (provider) {
      case 'ollama':
        selectedProvider = ollama;
        break;
      case 'bedrock':
        selectedProvider = bedrock;
        break;
      case 'lmstudio':
      default:
        selectedProvider = lmstudio;
        break;
    }

    // TAVILY WEB SEARCH - COMMENTED OUT
    // Check if Tavily is configured
    // const hasTavilyKey = !!process.env.TAVILY_API_KEY && tavilyClient !== null;

    // Use AI SDK's streamText with selected provider
    const result = streamText({
      model: selectedProvider(modelKey),
      system: 'You are a helpful assistant that can answer questions and help with tasks',
      messages: convertToModelMessages(messages),
      temperature,
      maxOutputTokens: maxTokens,
      maxRetries: provider === 'bedrock' ? 2 : 1, // Bedrock may need retries for cold starts

      // TAVILY WEB SEARCH TOOL - COMMENTED OUT
      // Add Tavily search tool if API key is configured
      // ...(hasTavilyKey ? {
      //   tools: {
      //     webSearch: tool({
      //       description: 'Search the web for current information, news, facts, or any topic. Use this when you need up-to-date or factual information.',
      //       inputSchema: z.object({
      //         query: z.string().describe('The search query to look up on the web'),
      //       }),
      //       execute: async ({ query }) => {
      //         if (!tavilyClient) {
      //           return { error: 'Tavily API key not configured' };
      //         }
      //         try {
      //           const response = await tavilyClient.search(query, {
      //             maxResults: 5,
      //             includeAnswer: true,
      //             includeRawContent: false,
      //           });
      //
      //           return {
      //             answer: response.answer,
      //             results: response.results.map((r: { title: string; url: string; content: string; score: number }) => ({
      //               title: r.title,
      //               url: r.url,
      //               content: r.content,
      //               score: r.score,
      //             })),
      //           };
      //         } catch (error) {
      //           console.error('Tavily search error:', error);
      //           return {
      //             error: 'Failed to search the web. Please try again.',
      //           };
      //         }
      //       },
      //     }),
      //   },
      // } : {}),
    });

    // Save assistant response after streaming completes (non-blocking)
    if (conversationId) {
      result.then(async (finalResult) => {
        await saveMessage(conversationId, {
          role: 'assistant',
          parts: finalResult.parts,
        });
        await updateConversation(conversationId);
      }).catch(err => console.error('Failed to save assistant message:', err));
    }

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