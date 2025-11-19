# Chat Persistence with MongoDB - Backend Implementation Plan

## Current Structure Analysis

**Key Files:**
- `app/page.tsx` - Main chat interface using `useChat` hook
- `app/api/chat/route.ts` - Chat streaming endpoint
- No existing persistence layer
- Uses Vercel AI SDK's `streamText` and `toUIMessageStreamResponse`

**Current Flow:**
1. User sends message via `useChat`
2. POST to `/api/chat` with messages array
3. Streams response back
4. Messages stored only in client state

## Backend Implementation Plan

### 1. Database Schema (Minimal)

```typescript
// lib/db/schema.ts
interface ChatMessage {
  _id: ObjectId;
  conversationId: string;  // Group messages by conversation
  role: 'user' | 'assistant' | 'system';
  content: string;
  parts: Array<{
    type: string;
    text?: string;
    // ... other part types
  }>;
  createdAt: Date;
}

interface Conversation {
  _id: ObjectId;
  title: string;  // Auto-generated from first message
  createdAt: Date;
  updatedAt: Date;
}
```

### 2. MongoDB Connection

```typescript
// lib/db/mongodb.ts
import { MongoClient } from 'mongodb';

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (!global._mongoClientPromise) {
  client = new MongoClient(process.env.MONGODB_URI!);
  global._mongoClientPromise = client.connect();
}
clientPromise = global._mongoClientPromise;

export default clientPromise;
```

### 3. API Endpoints (Minimal Set)

**Required Routes:**

```
POST   /api/conversations          # Create new conversation
GET    /api/conversations          # List conversations
GET    /api/conversations/[id]     # Get conversation with messages
DELETE /api/conversations/[id]     # Delete conversation
POST   /api/chat                   # Modified to save messages
```

### 4. Modified Chat Route

```typescript
// app/api/chat/route.ts
export const runtime = 'nodejs'; // Required for MongoDB driver

export async function POST(req: Request) {
  const {
    messages,
    conversationId,
    model: modelKey,
    provider = 'lmstudio',
    temperature = 0.7,
    maxTokens = 2000,
  } = await req.json();
  
  // Save user message (non-blocking)
  if (conversationId) {
    saveMessage(conversationId, messages[messages.length - 1])
      .catch(err => console.error('Failed to save user message:', err));
  }
  
  const result = streamText({
    model: selectedProvider(modelKey),
    messages: convertToModelMessages(messages),
    temperature,
    maxOutputTokens: maxTokens,
  });
  
  // Save assistant response after streaming completes
  if (conversationId) {
    result.then(async (finalResult) => {
      await saveMessage(conversationId, {
        role: 'assistant',
        parts: finalResult.parts // Preserves full UIMessage structure
      });
      // Update conversation timestamp
      await updateConversation(conversationId);
    }).catch(err => console.error('Failed to save assistant message:', err));
  }
  
  return result.toUIMessageStreamResponse();
}
```

### 5. Core Database Operations

```typescript
// lib/db/operations.ts
import clientPromise from './mongodb';
import type { UIMessage } from 'ai';
import { ObjectId } from 'mongodb';

export async function createConversation(title: string = 'New Chat') {
  const db = (await clientPromise).db('chatnexus');
  const result = await db.collection('conversations').insertOne({
    title,
    createdAt: new Date(),
    updatedAt: new Date()
  });
  return result.insertedId.toString();
}

export async function saveMessage(conversationId: string, message: UIMessage) {
  const db = (await clientPromise).db('chatnexus');
  await db.collection('messages').insertOne({
    conversationId,
    role: message.role,
    parts: message.parts,
    createdAt: new Date()
  });
}

export async function updateConversation(conversationId: string) {
  const db = (await clientPromise).db('chatnexus');
  await db.collection('conversations').updateOne(
    { _id: new ObjectId(conversationId) },
    { $set: { updatedAt: new Date() } }
  );
}

export async function getConversationMessages(conversationId: string) {
  const db = (await clientPromise).db('chatnexus');
  const messages = await db.collection('messages')
    .find({ conversationId })
    .sort({ createdAt: 1 })
    .toArray();
  
  // Convert to UIMessage format
  return messages.map(msg => ({
    id: msg._id.toString(),
    role: msg.role,
    parts: msg.parts,
  }));
}

export async function listConversations() {
  const db = (await clientPromise).db('chatnexus');
  return db.collection('conversations')
    .find()
    .sort({ updatedAt: -1 })
    .limit(50) // Limit to recent 50 conversations
    .toArray();
}

export async function deleteConversation(conversationId: string) {
  const db = (await clientPromise).db('chatnexus');
  const objectId = new ObjectId(conversationId);
  
  // Delete conversation and all its messages
  await Promise.all([
    db.collection('conversations').deleteOne({ _id: objectId }),
    db.collection('messages').deleteMany({ conversationId })
  ]);
}
```

### 6. Environment Variables

```bash
# .env.local
MONGODB_URI=mongodb://localhost:27017/chatnexus
```

### 7. Dependencies

```bash
npm install mongodb
```

## Implementation Priority

### Phase 1 (Core)
- MongoDB connection
- Save messages on chat
- Single conversation support

### Phase 2 (Multi-conversation)
- Create/list conversations
- Load conversation history
- Update sidebar with conversation list

### Phase 3 (Polish)
- Delete conversations
- Auto-generate titles
- Search conversations

## Key Design Decisions

- **No authentication** initially (add later if needed)
- **Simple schema** - no complex relationships
- **Async saves** - don't block streaming
- **Client-side state** remains primary, DB is backup
- **Minimal indexes** - only on conversationId and createdAt

## MongoDB Setup

### Local Development

1. Install MongoDB Community Edition:
   ```bash
   # macOS
   brew tap mongodb/brew
   brew install mongodb-community
   
   # Ubuntu
   sudo apt-get install mongodb
   
   # Windows
   # Download from https://www.mongodb.com/try/download/community
   ```

2. Start MongoDB:
   ```bash
   # macOS/Linux
   mongod --dbpath ~/data/db
   
   # Or use brew services (macOS)
   brew services start mongodb-community
   ```

3. Verify connection:
   ```bash
   mongosh mongodb://localhost:27017/chatnexus
   ```

### Database Indexes (Optional for Phase 1)

```javascript
// Run in mongosh
use chatnexus

// Index for faster conversation lookups
db.messages.createIndex({ conversationId: 1, createdAt: 1 })

// Index for conversation list sorting
db.conversations.createIndex({ updatedAt: -1 })
```

## Testing Strategy

1. **Unit Tests** - Database operations
2. **Integration Tests** - API endpoints
3. **Manual Testing** - Full chat flow with persistence

## Migration Path

Since there's no existing data, no migration needed. New installations will:
1. Connect to MongoDB on first run
2. Create collections automatically
3. Start saving messages immediately

## Rollback Plan

If issues arise:
1. Remove MongoDB connection code
2. Revert to client-side only state
3. No data loss (client state unaffected)
