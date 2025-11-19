import { NextResponse } from 'next/server';
import { getConversationMessages, deleteConversation } from '@/lib/db/operations';

export const runtime = 'nodejs';

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const messages = await getConversationMessages(params.id);
    return NextResponse.json({ messages });
  } catch (error) {
    console.error('Failed to get conversation messages:', error);
    return NextResponse.json(
      { error: 'Failed to get conversation messages' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await deleteConversation(params.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete conversation:', error);
    return NextResponse.json(
      { error: 'Failed to delete conversation' },
      { status: 500 }
    );
  }
}
