import { NextResponse } from 'next/server';

// LMStudio API endpoint
const LMSTUDIO_BASE_URL = 'http://localhost:1234/v1';

export async function POST(req: Request) {
  try {
    const { modelKey } = await req.json();
    
    if (!modelKey) {
      return NextResponse.json(
        { error: 'Model key is required' },
        { status: 400 }
      );
    }
    
    // Fetch model info from LMStudio's OpenAI-compatible API
    const response = await fetch(`${LMSTUDIO_BASE_URL}/models`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`LMStudio API returned ${response.status}`);
    }

    const data = await response.json();
    const modelInfo = data.data?.find((m: any) => m.id === modelKey);
    
    if (!modelInfo) {
      return NextResponse.json(
        { error: 'Model not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      modelKey: modelInfo.id,
      displayName: modelInfo.id,
      architecture: 'Unknown',
      contextLength: modelInfo.context_length || 4096,
      maxContextLength: modelInfo.context_length || 4096,
      trainedForToolUse: false,
      vision: false,
      format: 'Unknown',
      path: 'Unknown',
    });
  } catch (error) {
    console.error('Failed to get model info:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get model info',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
