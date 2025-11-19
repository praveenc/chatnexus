# MongoDB Setup Guide

## Starting MongoDB Server

### SageMaker Code Editor / Container Environments

SageMaker Code Editor runs in a container without systemd. Use direct MongoDB commands:

```bash
# Start MongoDB in background
mongod --fork --logpath ~/mongodb.log --dbpath ~/data/db

# Or run in foreground (in a separate terminal)
mongod --dbpath ~/data/db

# Check if running
pgrep -l mongod

# Stop MongoDB
pkill mongod
```

**Note:** MongoDB must be installed first. See installation section below.

### macOS

```bash
# Using Homebrew services (recommended)
brew services start mongodb-community

# Or run directly
mongod --config /opt/homebrew/etc/mongod.conf

# Verify it's running
brew services list | grep mongodb
```

## MongoDB Installation

### SageMaker Code Editor / Ubuntu Container

```bash
# Create data directory
mkdir -p ~/data/db

# Import MongoDB GPG key
wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -

# Add MongoDB repository
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list

# Update package list
sudo apt-get update

# Install MongoDB
sudo apt-get install -y mongodb-org

# Start MongoDB (no systemctl in containers)
mongod --fork --logpath ~/mongodb.log --dbpath ~/data/db

# Verify it's running
pgrep -l mongod
```

### Linux (Ubuntu/Debian)

```bash
# Install MongoDB
wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org

# Start MongoDB service
sudo systemctl start mongod

# Enable auto-start on boot
sudo systemctl enable mongod

# Check status
sudo systemctl status mongod
```

### Amazon Linux 2023

```bash
# Create MongoDB repo file
sudo tee /etc/yum.repos.d/mongodb-org-7.0.repo << EOF
[mongodb-org-7.0]
name=MongoDB Repository
baseurl=https://repo.mongodb.org/yum/amazon/2023/mongodb-org/7.0/x86_64/
gpgcheck=1
enabled=1
gpgkey=https://www.mongodb.org/static/pgp/server-7.0.asc
EOF

# Install MongoDB
sudo yum install -y mongodb-org

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

### Docker (Recommended for SageMaker/Containers)

**Best option for container environments like SageMaker Code Editor:**

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

# View logs
docker logs mongodb
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

### SageMaker Code Editor / Container
```bash
pkill mongod
```

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
