#!/bin/bash

# Manual API Test Commands
# Copy and paste these commands one by one

echo "=== ChatNexus API Manual Tests ==="
echo ""

echo "1. Create a conversation:"
echo 'curl -X POST http://localhost:3000/api/conversations \
  -H "Content-Type: application/json" \
  -d '"'"'{"title":"My Test Chat"}'"'"' | jq'
echo ""

echo "2. List all conversations:"
echo 'curl http://localhost:3000/api/conversations | jq'
echo ""

echo "3. Send a chat message (replace CONVERSATION_ID):"
echo 'curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '"'"'{
    "conversationId": "CONVERSATION_ID",
    "messages": [{"role":"user","parts":[{"type":"text","text":"Hello!"}]}],
    "model": "qwen3:14b",
    "provider": "ollama"
  }'"'"
echo ""

echo "4. Get conversation messages (replace CONVERSATION_ID):"
echo 'curl http://localhost:3000/api/conversations/CONVERSATION_ID | jq'
echo ""

echo "5. Delete conversation (replace CONVERSATION_ID):"
echo 'curl -X DELETE http://localhost:3000/api/conversations/CONVERSATION_ID | jq'
echo ""

echo "=== Quick Test (all in one) ==="
echo ""
echo '# Create and test in one go
CONV_ID=$(curl -s -X POST http://localhost:3000/api/conversations \
  -H "Content-Type: application/json" \
  -d '"'"'{"title":"Quick Test"}'"'"' | jq -r .id)

echo "Created conversation: $CONV_ID"

# List conversations
curl -s http://localhost:3000/api/conversations | jq

# Get messages
curl -s http://localhost:3000/api/conversations/$CONV_ID | jq

# Delete
curl -s -X DELETE http://localhost:3000/api/conversations/$CONV_ID | jq'
