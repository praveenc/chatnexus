import { NextResponse } from 'next/server';
import type { ProviderType } from '@/lib/providers';

// Provider API endpoints
const LMSTUDIO_BASE_URL = 'http://localhost:1234/v1';
const OLLAMA_BASE_URL = 'http://localhost:11434/api';

async function fetchLMStudioModels() {
  const response = await fetch(`${LMSTUDIO_BASE_URL}/models`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`LMStudio API returned ${response.status}`);
  }

  const data = await response.json();

  return data.data?.map((model: any) => ({
    key: model.id,
    name: model.id,
    size: 'Unknown',
    architecture: 'Unknown',
    maxContextLength: model.context_length || 4096,
    isLoaded: true,
    provider: 'lmstudio' as ProviderType,
  })) || [];
}

async function fetchOllamaModels() {
  const response = await fetch(`${OLLAMA_BASE_URL}/tags`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`Ollama API returned ${response.status}`);
  }

  const data = await response.json();

  return data.models?.map((model: any) => ({
    key: model.name,
    name: model.name,
    size: formatBytes(model.size),
    architecture: model.details?.family || 'Unknown',
    maxContextLength: 4096,
    isLoaded: true,
    provider: 'ollama' as ProviderType,
  })) || [];
}

async function fetchBedrockModels() {
  const response = await fetch('http://localhost:3000/api/bedrock/models', {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`Bedrock API returned ${response.status}`);
  }

  const data = await response.json();
  return data.models || [];
}

function formatBytes(bytes: number): string {
  if (!bytes) return 'Unknown';
  const gb = bytes / (1024 ** 3);
  if (gb >= 1) return `${gb.toFixed(1)}GB`;
  const mb = bytes / (1024 ** 2);
  return `${mb.toFixed(0)}MB`;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const provider = searchParams.get('provider') as ProviderType | null;

  try {
    let models: any[] = [];

    if (!provider || provider === 'lmstudio') {
      try {
        const lmstudioModels = await fetchLMStudioModels();
        models = [...models, ...lmstudioModels];
      } catch (error) {
        console.warn('LMStudio not available:', error);
      }
    }

    if (!provider || provider === 'ollama') {
      try {
        const ollamaModels = await fetchOllamaModels();
        models = [...models, ...ollamaModels];
      } catch (error) {
        console.warn('Ollama not available:', error);
      }
    }

    if (!provider || provider === 'bedrock') {
      try {
        const bedrockModels = await fetchBedrockModels();
        models = [...models, ...bedrockModels];
      } catch (error) {
        console.warn('Bedrock not available:', error);
      }
    }

    // If specific provider requested, filter
    const filteredModels = provider
      ? models.filter(m => m.provider === provider)
      : models;

    return NextResponse.json({
      models: filteredModels,
      count: filteredModels.length,
      providers: {
        lmstudio: models.filter(m => m.provider === 'lmstudio').length,
        ollama: models.filter(m => m.provider === 'ollama').length,
        bedrock: models.filter(m => m.provider === 'bedrock').length,
      },
    });
  } catch (error) {
    console.error('Failed to list models:', error);
    return NextResponse.json(
      {
        error: 'Failed to list models',
        details: error instanceof Error ? error.message : 'Unknown error',
        models: [],
        count: 0,
      },
      { status: 500 }
    );
  }
}
