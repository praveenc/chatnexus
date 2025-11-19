import { NextResponse } from 'next/server';
import { createConversation, listConversations } from '@/lib/db/operations';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const conversations = await listConversations();
    return NextResponse.json(conversations);
  } catch (error) {
    console.error('Failed to list conversations:', error);
    return NextResponse.json(
      { error: 'Failed to list conversations' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const { title } = await req.json();
    const conversationId = await createConversation(title);
    return NextResponse.json({ id: conversationId });
  } catch (error) {
    console.error('Failed to create conversation:', error);
    return NextResponse.json(
      { error: 'Failed to create conversation' },
      { status: 500 }
    );
  }
}
