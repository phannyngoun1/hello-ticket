#!/bin/bash

echo "🐘 Starting PostgreSQL Database with Docker Compose (macOS)"
echo "============================================================"
echo ""

# Check if Docker is running (macOS specific check)
if ! docker info > /dev/null 2>&1; then
    echo "❌ Error: Docker is not running"
    echo "   Please start Docker Desktop for Mac and try again"
    echo "   Open Docker Desktop from Applications folder"
    exit 1
fi

# Check if docker compose is available (try both v2 and v1)
if docker compose version > /dev/null 2>&1; then
    COMPOSE_CMD="docker compose"
    echo "✅ Using Docker Compose V2 (docker compose)"
elif command -v docker-compose > /dev/null 2>&1; then
    COMPOSE_CMD="docker-compose"
    echo "✅ Using Docker Compose V1 (docker-compose)"
else
    echo "❌ Error: Docker Compose is not installed"
    echo "   Docker Desktop for Mac should include Docker Compose"
    echo "   Please reinstall Docker Desktop from: https://www.docker.com/products/docker-desktop"
    exit 1
fi
echo ""

# Start database
echo "📦 Starting PostgreSQL Database (Port 5432)..."
$COMPOSE_CMD up -d

# Wait for database to be healthy
echo ""
echo "⏳ Waiting for database to be ready..."
sleep 5

# Check database health
echo ""
echo "🔍 Checking database status..."
$COMPOSE_CMD ps

echo ""
echo "✅ Testing database connection..."

# Test database
if docker exec hello-ticket-postgres pg_isready -U ticket -d ticket > /dev/null 2>&1; then
    echo "   ✅ PostgreSQL Database (Port 5432): Ready"
else
    echo "   ❌ PostgreSQL Database (Port 5432): Not ready"
fi

echo ""
echo "============================================================"
echo "🎉 PostgreSQL Database is running on macOS!"
echo ""
echo "📝 Connection string:"
echo "   postgresql://ticket:ticket_pass@localhost:5432/ticket"
echo ""
echo "🔧 Useful commands:"
echo "   View logs:        $COMPOSE_CMD logs -f"
echo "   Stop database:    $COMPOSE_CMD down"
echo "   Restart:          $COMPOSE_CMD restart"
echo ""
echo "💡 macOS Tips:"
echo "   • Docker runs in a VM - performance is good but not native"
echo "   • Check Docker Desktop settings for resource allocation"
echo "   • Database persists in Docker volumes (survives restarts)"
echo ""
echo "🚀 Next steps:"
echo "   1. Install dependencies: pip3 install -r backend/requirements.txt"
echo "   2. Start application:    cd backend && python3 -m uvicorn app.main:app --reload"
echo ""

