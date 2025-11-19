# Test Scripts

## Prerequisites

1. **Start MongoDB:**
   ```bash
   # macOS
   brew services start mongodb-community
   
   # Linux
   sudo systemctl start mongod
   
   # Docker
   docker run -d --name mongodb -p 27017:27017 mongo:7.0
   ```

2. **Start Next.js dev server:**
   ```bash
   npm run dev
   ```

3. **Verify MongoDB connection:**
   ```bash
   mongosh mongodb://localhost:27017/chatnexus
   ```

## Automated Test Script

Runs all API endpoint tests automatically:

```bash
./scripts/test-api.sh
```

**Tests:**
- ✓ Create conversation
- ✓ List conversations
- ✓ Send chat message with persistence
- ✓ Get conversation messages
- ✓ Delete conversation
- ✓ Verify deletion

## Manual Test Commands

View available test commands:

```bash
./scripts/test-manual.sh
```

Or run individual tests:

```bash
# Create conversation
curl -X POST http://localhost:3000/api/conversations \
  -H "Content-Type: application/json" \
  -d '{"title":"My Test Chat"}' | jq

# List conversations
curl http://localhost:3000/api/conversations | jq

# Get conversation messages (replace {id})
curl http://localhost:3000/api/conversations/{id} | jq

# Delete conversation (replace {id})
curl -X DELETE http://localhost:3000/api/conversations/{id} | jq
```

## Quick Test (One-liner)

```bash
CONV_ID=$(curl -s -X POST http://localhost:3000/api/conversations \
  -H "Content-Type: application/json" \
  -d '{"title":"Quick Test"}' | jq -r .id) && \
echo "Created: $CONV_ID" && \
curl -s http://localhost:3000/api/conversations/$CONV_ID | jq && \
curl -s -X DELETE http://localhost:3000/api/conversations/$CONV_ID | jq
```

## Verify in MongoDB

```bash
# Connect to MongoDB
mongosh mongodb://localhost:27017/chatnexus

# List collections
show collections

# View conversations
db.conversations.find().pretty()

# View messages
db.messages.find().pretty()

# Count documents
db.conversations.countDocuments()
db.messages.countDocuments()
```

## Troubleshooting

**Connection refused:**
- Ensure MongoDB is running: `brew services list` or `systemctl status mongod`
- Check MONGODB_URI in `.env.local`

**404 errors:**
- Ensure Next.js dev server is running: `npm run dev`
- Check server is on port 3000

**Empty responses:**
- Wait 2-3 seconds after sending chat message for async save
- Check server logs for errors
