# Quick Start: Chat Persistence

## 1. Install & Start MongoDB

**Install MongoDB (if not already installed):**

```bash
# macOS
xcode-select --install  # Install Xcode Command-Line Tools
brew tap mongodb/brew
brew update
brew install mongodb-community@7.0

# Linux (Ubuntu/Debian)
wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org

# Docker (easiest)
docker pull mongodb/mongodb-community-server:latest
```

**Start MongoDB:**

```bash
# macOS
brew services start mongodb-community@7.0

# Linux
sudo systemctl start mongod

# Docker (easiest)
docker run -d --name mongodb -p 27017:27017 mongodb/mongodb-community-server:latest
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
