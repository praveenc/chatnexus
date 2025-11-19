import clientPromise from './mongodb';
import type { UIMessage } from 'ai';
import { ObjectId } from 'mongodb';

const DB_NAME = 'chatnexus';

export async function createConversation(title: string = 'New Chat') {
  const db = (await clientPromise).db(DB_NAME);
  const result = await db.collection('conversations').insertOne({
    title,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  return result.insertedId.toString();
}

export async function saveMessage(conversationId: string, message: UIMessage) {
  const db = (await clientPromise).db(DB_NAME);
  await db.collection('messages').insertOne({
    conversationId,
    role: message.role,
    parts: message.parts,
    createdAt: new Date(),
  });
}

export async function updateConversation(conversationId: string) {
  const db = (await clientPromise).db(DB_NAME);
  await db.collection('conversations').updateOne(
    { _id: new ObjectId(conversationId) },
    { $set: { updatedAt: new Date() } }
  );
}

export async function getConversationMessages(conversationId: string) {
  const db = (await clientPromise).db(DB_NAME);
  const messages = await db
    .collection('messages')
    .find({ conversationId })
    .sort({ createdAt: 1 })
    .toArray();

  // Convert to UIMessage format
  return messages.map((msg) => ({
    id: msg._id.toString(),
    role: msg.role as 'user' | 'assistant' | 'system',
    parts: msg.parts,
  }));
}

export async function listConversations() {
  const db = (await clientPromise).db(DB_NAME);
  const conversations = await db
    .collection('conversations')
    .find()
    .sort({ updatedAt: -1 })
    .limit(50)
    .toArray();

  return conversations.map((conv) => ({
    id: conv._id.toString(),
    title: conv.title,
    createdAt: conv.createdAt,
    updatedAt: conv.updatedAt,
  }));
}

export async function deleteConversation(conversationId: string) {
  const db = (await clientPromise).db(DB_NAME);
  const objectId = new ObjectId(conversationId);

  await Promise.all([
    db.collection('conversations').deleteOne({ _id: objectId }),
    db.collection('messages').deleteMany({ conversationId }),
  ]);
}
