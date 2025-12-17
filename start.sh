#!/bin/bash

echo "🚀 Starting Hello Ticket (macOS)"
echo "==========================================="
echo ""

# Check if we're in the right directory
if [ ! -f "docker-compose.yml" ]; then
    echo "❌ Error: Please run this from the project root directory"
    exit 1
fi

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "🐳 Starting Docker Desktop..."
    open -a Docker
    echo "⏳ Waiting for Docker to start..."
    
    # Wait for Docker to start (max 60 seconds)
    for i in {1..60}; do
        if docker info > /dev/null 2>&1; then
            echo "✅ Docker is ready!"
            break
        fi
        sleep 1
    done
    
    if ! docker info > /dev/null 2>&1; then
        echo "❌ Docker failed to start. Please start Docker Desktop manually."
        exit 1
    fi
fi

# Detect Docker Compose version
if docker compose version > /dev/null 2>&1; then
    COMPOSE_CMD="docker compose"
elif command -v docker-compose > /dev/null 2>&1; then
    COMPOSE_CMD="docker-compose"
else
    echo "❌ Docker Compose not found"
    exit 1
fi

# Start PostgreSQL database
echo ""
echo "🐘 Starting PostgreSQL database..."
$COMPOSE_CMD up -d

# Wait for database
echo "⏳ Waiting for database to be ready..."
sleep 5

# Check service health
echo ""
echo "✅ Checking services..."
if docker exec hello-ticket-postgres pg_isready -U ticket > /dev/null 2>&1; then
    echo "   ✅ PostgreSQL Database (Port 5432): Ready"
else
    echo "   ⚠️  PostgreSQL Database: Starting..."
fi

echo ""
echo "==========================================="
echo "✅ Setup Complete!"
echo ""
echo "📊 Your services are running:"
echo "   PostgreSQL DB: localhost:5432"
echo ""
echo "🚀 To start your application:"
echo "   cd backend"
echo "   python3 -m uvicorn app.main:app --reload"
echo ""
echo "🛑 To stop database:"
echo "   docker compose down"
echo ""

