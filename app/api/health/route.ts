import { NextResponse } from 'next/server';
import type { ProviderType } from '@/lib/providers';

const LMSTUDIO_BASE_URL = 'http://localhost:1234/v1';
const OLLAMA_BASE_URL = 'http://localhost:11434/api';

async function checkLMStudio() {
  try {
    const response = await fetch(`${LMSTUDIO_BASE_URL}/models`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(2000), // 2 second timeout
    });
    return response.ok;
  } catch (error) {
    return false;
  }
}

async function checkOllama() {
  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/tags`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(2000), // 2 second timeout
    });
    return response.ok;
  } catch (error) {
    return false;
  }
}

function checkBedrock() {
  // Check if AWS credentials are configured
  const hasAccessKey = !!process.env.AWS_ACCESS_KEY_ID;
  const hasSecretKey = !!process.env.AWS_SECRET_ACCESS_KEY;
  const hasRegion = !!process.env.AWS_REGION;
  
  return hasAccessKey && hasSecretKey && hasRegion;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const provider = searchParams.get('provider') as ProviderType | null;

  try {
    if (provider) {
      // Check specific provider
      let status = false;
      let message = '';

      switch (provider) {
        case 'lmstudio':
          status = await checkLMStudio();
          message = status 
            ? 'LM Studio is running' 
            : 'LM Studio is not running on http://localhost:1234';
          break;
        case 'ollama':
          status = await checkOllama();
          message = status 
            ? 'Ollama is running' 
            : 'Ollama is not running on http://localhost:11434';
          break;
        case 'bedrock':
          status = checkBedrock();
          message = status 
            ? 'AWS credentials configured' 
            : 'AWS credentials not configured. Set AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, and AWS_REGION';
          break;
      }

      return NextResponse.json({ status, message, provider });
    }

    // Check all providers
    const [lmstudioStatus, ollamaStatus] = await Promise.all([
      checkLMStudio(),
      checkOllama(),
    ]);
    const bedrockStatus = checkBedrock();

    return NextResponse.json({
      lmstudio: {
        status: lmstudioStatus,
        message: lmstudioStatus 
          ? 'LM Studio is running' 
          : 'LM Studio is not running on http://localhost:1234',
      },
      ollama: {
        status: ollamaStatus,
        message: ollamaStatus 
          ? 'Ollama is running' 
          : 'Ollama is not running on http://localhost:11434',
      },
      bedrock: {
        status: bedrockStatus,
        message: bedrockStatus 
          ? 'AWS credentials configured' 
          : 'AWS credentials not configured',
      },
    });
  } catch (error) {
    console.error('Health check error:', error);
    return NextResponse.json(
      { error: 'Health check failed' },
      { status: 500 }
    );
  }
}
