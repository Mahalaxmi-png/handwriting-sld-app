#!/bin/bash

# Handwriting SLD App Deployment Script
echo "🚀 Starting Handwriting SLD App Deployment..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Build and start services
echo "📦 Building Docker images..."
docker-compose build

echo "🔄 Starting services..."
docker-compose up -d

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 10

# Check service status
echo "📊 Checking service status..."
docker-compose ps

# Show logs
echo "📋 Showing recent logs..."
docker-compose logs --tail=20

echo "✅ Deployment complete!"
echo "🌐 Frontend: http://localhost:80"
echo "🔧 Backend: http://localhost:5000"
echo ""
echo "To stop services: docker-compose down"
echo "To view logs: docker-compose logs -f"
echo "To restart: docker-compose restart"
