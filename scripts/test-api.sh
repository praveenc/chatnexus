#!/bin/bash

# ChatNexus API Test Script
# Tests MongoDB persistence endpoints

set -e

BASE_URL="http://localhost:3000"
CONVERSATION_ID=""

echo "🧪 Testing ChatNexus API Endpoints"
echo "=================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test 1: Create Conversation
echo -e "${BLUE}Test 1: Create Conversation${NC}"
RESPONSE=$(curl -s -X POST "$BASE_URL/api/conversations" \
  -H "Content-Type: application/json" \
  -d '{"title":"Test Chat"}')

CONVERSATION_ID=$(echo $RESPONSE | grep -o '"id":"[^"]*"' | cut -d'"' -f4)

if [ -n "$CONVERSATION_ID" ]; then
  echo -e "${GREEN}✓ Created conversation: $CONVERSATION_ID${NC}"
else
  echo -e "${RED}✗ Failed to create conversation${NC}"
  echo "Response: $RESPONSE"
  exit 1
fi
echo ""

# Test 2: List Conversations
echo -e "${BLUE}Test 2: List Conversations${NC}"
RESPONSE=$(curl -s "$BASE_URL/api/conversations")
COUNT=$(echo $RESPONSE | grep -o '"id"' | wc -l)
echo -e "${GREEN}✓ Found $COUNT conversation(s)${NC}"
echo ""

# Test 3: Send Chat Message (with persistence)
echo -e "${BLUE}Test 3: Send Chat Message${NC}"
curl -s -X POST "$BASE_URL/api/chat" \
  -H "Content-Type: application/json" \
  -d "{
    \"conversationId\": \"$CONVERSATION_ID\",
    \"messages\": [{
      \"role\": \"user\",
      \"parts\": [{\"type\": \"text\", \"text\": \"Hello, this is a test message\"}]
    }],
    \"model\": \"qwen3:14b\",
    \"provider\": \"ollama\"
  }" > /dev/null

echo -e "${GREEN}✓ Sent message to conversation${NC}"
echo ""

# Wait for message to be saved
sleep 2

# Test 4: Get Conversation Messages
echo -e "${BLUE}Test 4: Get Conversation Messages${NC}"
RESPONSE=$(curl -s "$BASE_URL/api/conversations/$CONVERSATION_ID")
MESSAGE_COUNT=$(echo $RESPONSE | grep -o '"role"' | wc -l)

if [ "$MESSAGE_COUNT" -gt 0 ]; then
  echo -e "${GREEN}✓ Retrieved $MESSAGE_COUNT message(s)${NC}"
  echo "Sample message:"
  echo $RESPONSE | python3 -m json.tool 2>/dev/null | head -20 || echo $RESPONSE | head -200
else
  echo -e "${RED}✗ No messages found${NC}"
fi
echo ""

# Test 5: Delete Conversation
echo -e "${BLUE}Test 5: Delete Conversation${NC}"
RESPONSE=$(curl -s -X DELETE "$BASE_URL/api/conversations/$CONVERSATION_ID")

if echo $RESPONSE | grep -q "success"; then
  echo -e "${GREEN}✓ Deleted conversation${NC}"
else
  echo -e "${RED}✗ Failed to delete conversation${NC}"
  echo "Response: $RESPONSE"
fi
echo ""

# Test 6: Verify Deletion
echo -e "${BLUE}Test 6: Verify Deletion${NC}"
RESPONSE=$(curl -s "$BASE_URL/api/conversations/$CONVERSATION_ID")

if echo $RESPONSE | grep -q "error"; then
  echo -e "${GREEN}✓ Conversation successfully deleted${NC}"
else
  echo -e "${RED}✗ Conversation still exists${NC}"
fi
echo ""

echo "=================================="
echo -e "${GREEN}✓ All tests completed!${NC}"
