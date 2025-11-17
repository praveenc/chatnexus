import { NextResponse } from 'next/server';
import type { ProviderType } from '@/lib/providers';
import { BedrockClient, ListFoundationModelsCommand } from '@aws-sdk/client-bedrock';
import { fromNodeProviderChain } from '@aws-sdk/credential-providers';

const LMSTUDIO_BASE_URL = 'http://localhost:1234/v1';
const OLLAMA_BASE_URL = 'http://localhost:11434/api';

async function checkLMStudio() {
  try {
    const response = await fetch(`${LMSTUDIO_BASE_URL}/models`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(2000),
    });
    return response.ok;
  } catch {
    return false;
  }
}

async function checkOllama() {
  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/tags`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(2000),
    });
    return response.ok;
  } catch {
    return false;
  }
}

async function checkBedrock() {
  try {
    const region = process.env.AWS_REGION || 'us-east-1';

    const bedrockClient = process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
      ? new BedrockClient({
          region,
          credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
            sessionToken: process.env.AWS_SESSION_TOKEN,
          },
        })
      : new BedrockClient({
          region,
          credentials: fromNodeProviderChain(),
        });

    const command = new ListFoundationModelsCommand({});
    await bedrockClient.send(command);

    return true;
  } catch (err) {
    console.error('Bedrock health check failed:', err);
    return false;
  }
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
          status = await checkBedrock();
          message = status
            ? 'AWS Bedrock is accessible'
            : 'Cannot access AWS Bedrock. Check credentials and IAM permissions.';
          break;
      }

      return NextResponse.json({ status, message, provider });
    }

    // Check all providers
    const [lmstudioStatus, ollamaStatus, bedrockStatus] = await Promise.all([
      checkLMStudio(),
      checkOllama(),
      checkBedrock(),
    ]);

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
          ? 'AWS Bedrock is accessible'
          : 'Cannot access AWS Bedrock. Check credentials and IAM permissions.',
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
