import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const ENV_FILE_PATH = path.join(process.cwd(), '.env');

// Read current environment variables
export async function GET() {
  try {
    // Return current env vars (masked for security)
    return NextResponse.json({
      AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID ? '••••••••' : '',
      AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY ? '••••••••' : '',
      AWS_REGION: process.env.AWS_REGION || '',
      TAVILY_API_KEY: process.env.TAVILY_API_KEY ? '••••••••' : '',
      hasAwsCredentials: !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY),
      hasTavilyKey: !!process.env.TAVILY_API_KEY,
    });
  } catch (error) {
    console.error('Failed to read settings:', error);
    return NextResponse.json(
      { error: 'Failed to read settings' },
      { status: 500 }
    );
  }
}

// Update environment variables
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION, TAVILY_API_KEY } = body;

    // Read existing .env file or create new content
    let envContent = '';
    try {
      envContent = await fs.readFile(ENV_FILE_PATH, 'utf-8');
    } catch (error) {
      // File doesn't exist, will create new one
      envContent = '# Environment Variables\n';
    }

    // Parse existing env file
    const envLines = envContent.split('\n');
    const envMap = new Map<string, string>();
    
    envLines.forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key) {
          envMap.set(key.trim(), valueParts.join('=').trim());
        }
      }
    });

    // Update values (only if not masked)
    if (AWS_ACCESS_KEY_ID && !AWS_ACCESS_KEY_ID.includes('•')) {
      envMap.set('AWS_ACCESS_KEY_ID', AWS_ACCESS_KEY_ID);
    }
    if (AWS_SECRET_ACCESS_KEY && !AWS_SECRET_ACCESS_KEY.includes('•')) {
      envMap.set('AWS_SECRET_ACCESS_KEY', AWS_SECRET_ACCESS_KEY);
    }
    if (AWS_REGION) {
      envMap.set('AWS_REGION', AWS_REGION);
    }
    if (TAVILY_API_KEY && !TAVILY_API_KEY.includes('•')) {
      envMap.set('TAVILY_API_KEY', TAVILY_API_KEY);
    }

    // Build new env file content
    const newEnvContent = [
      '# AWS Bedrock Configuration',
      `AWS_ACCESS_KEY_ID=${envMap.get('AWS_ACCESS_KEY_ID') || ''}`,
      `AWS_SECRET_ACCESS_KEY=${envMap.get('AWS_SECRET_ACCESS_KEY') || ''}`,
      `AWS_REGION=${envMap.get('AWS_REGION') || 'us-east-1'}`,
      '',
      '# Tavily Web Search',
      `TAVILY_API_KEY=${envMap.get('TAVILY_API_KEY') || ''}`,
      '',
    ].join('\n');

    // Write to .env file
    await fs.writeFile(ENV_FILE_PATH, newEnvContent, 'utf-8');

    return NextResponse.json({ 
      success: true,
      message: 'Settings saved. Please restart the development server for changes to take effect.',
    });
  } catch (error) {
    console.error('Failed to save settings:', error);
    return NextResponse.json(
      { error: 'Failed to save settings', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
