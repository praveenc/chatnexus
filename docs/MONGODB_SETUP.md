# MongoDB Setup Guide

## Starting MongoDB Server

### macOS

```bash
# Using Homebrew services (recommended)
brew services start mongodb-community

# Or run directly
mongod --config /opt/homebrew/etc/mongod.conf

# Verify it's running
brew services list | grep mongodb
```

### Linux (Ubuntu/Debian)

```bash
# Start MongoDB service
sudo systemctl start mongod

# Enable auto-start on boot
sudo systemctl enable mongod

# Check status
sudo systemctl status mongod
```

### Windows

```bash
# Start as Windows service
net start MongoDB

# Or run directly
"C:\Program Files\MongoDB\Server\7.0\bin\mongod.exe" --dbpath="C:\data\db"
```

### Docker (Cross-platform)

```bash
# Run MongoDB in Docker
docker run -d \
  --name mongodb \
  -p 27017:27017 \
  -v ~/data/db:/data/db \
  mongo:7.0

# Stop MongoDB
docker stop mongodb

# Start existing container
docker start mongodb
```

## Verify Connection

```bash
# Connect using mongosh
mongosh mongodb://localhost:27017/chatnexus

# Or check if port is listening
lsof -i :27017  # macOS/Linux
netstat -an | grep 27017  # Windows
```

## Stop MongoDB Server

### macOS
```bash
brew services stop mongodb-community
```

### Linux
```bash
sudo systemctl stop mongod
```

### Windows
```bash
net stop MongoDB
```

### Docker
```bash
docker stop mongodb
```

## Troubleshooting

### Port Already in Use
```bash
# Find process using port 27017
lsof -i :27017  # macOS/Linux
netstat -ano | findstr :27017  # Windows

# Kill the process
kill -9 <PID>  # macOS/Linux
taskkill /PID <PID> /F  # Windows
```

### Permission Issues
```bash
# Fix data directory permissions (macOS/Linux)
sudo chown -R $(whoami) ~/data/db
```

### Connection Refused
- Ensure MongoDB is running: `brew services list` or `systemctl status mongod`
- Check firewall settings
- Verify MONGODB_URI in .env.local matches your setup
