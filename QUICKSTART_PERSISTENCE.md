# Quick Start: Chat Persistence

## 1. Start MongoDB

```bash
# macOS
brew services start mongodb-community

# Linux
sudo systemctl start mongod

# Docker (easiest)
docker run -d --name mongodb -p 27017:27017 mongo:7.0
```

## 2. Configure Environment

Add to `.env.local`:
```bash
MONGODB_URI=mongodb://localhost:27017/chatnexus
```

## 3. Start Next.js

```bash
npm run dev
```

## 4. Test the API

```bash
# Run automated tests
./scripts/test-api.sh

# Or test manually
curl -X POST http://localhost:3000/api/conversations \
  -H "Content-Type: application/json" \
  -d '{"title":"Test Chat"}' | jq
```

## 5. Verify in MongoDB

```bash
mongosh mongodb://localhost:27017/chatnexus

# View data
db.conversations.find().pretty()
db.messages.find().pretty()
```

## That's it! 🎉

Your chat messages are now persisted to MongoDB.

## Next Steps

- See `docs/MONGODB_SETUP.md` for detailed setup
- See `scripts/README.md` for all test commands
- See `docs/CHAT_PERSISTENCE_IMPLEMENTATION_SUMMARY.md` for architecture details
