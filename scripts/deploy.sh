#!/bin/bash

echo "🚀 Starting MetaPortal Deployment..."

# Set script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_DIR"

echo "📂 Project directory: $PROJECT_DIR"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check if Docker Compose is available
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install it and try again."
    exit 1
fi

# Copy environment file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "⚠️  Please edit .env file with your configuration before continuing."
    echo "   Press any key to continue after editing .env..."
    read -n 1 -s
fi

# Start Docker services
echo "🐳 Starting Docker services..."
docker-compose down --remove-orphans
docker-compose up -d postgres redis

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
for i in {1..30}; do
    if docker-compose exec -T postgres pg_isready -U metaportal_user -d metaportal > /dev/null 2>&1; then
        echo "✅ PostgreSQL is ready!"
        break
    fi
    echo "   Attempt $i/30: PostgreSQL not ready yet..."
    sleep 2
done

# Wait for Redis to be ready
echo "⏳ Waiting for Redis to be ready..."
for i in {1..30}; do
    if docker-compose exec -T redis redis-cli ping > /dev/null 2>&1; then
        echo "✅ Redis is ready!"
        break
    fi
    echo "   Attempt $i/30: Redis not ready yet..."
    sleep 2
done

# Build and start backend
echo "🔧 Building and starting backend..."
docker-compose up -d --build backend

# Wait for backend to be ready
echo "⏳ Waiting for backend to be ready..."
for i in {1..60}; do
    if curl -f http://localhost:8000/health > /dev/null 2>&1; then
        echo "✅ Backend is ready!"
        break
    fi
    echo "   Attempt $i/60: Backend not ready yet..."
    sleep 3
done

# Run database migrations
echo "🗄️ Running database migrations..."
docker-compose exec -T backend alembic upgrade head

# Generate sample data
echo "📊 Generating sample airport management data..."
docker-compose exec -T backend python scripts/generate_sample_data.py

# Start additional services
echo "🔧 Starting additional services..."
docker-compose up -d celery_worker celery_beat flower nginx

# Print access information
echo ""
echo "🎉 MetaPortal deployment completed successfully!"
echo ""
echo "📍 Access URLs:"
echo "   🌐 Frontend: http://localhost:3000"
echo "   🔧 Backend API: http://localhost:8000"
echo "   📚 API Documentation: http://localhost:8000/api/docs"
echo "   🌺 Flower (Celery): http://localhost:5555"
echo "   ⚡ Health Check: http://localhost:8000/health"
echo ""
echo "🔐 Login Credentials:"
echo "   Email: john.smith@airport.com"
echo "   Password: password123"
echo ""
echo "📊 Sample Data Created:"
echo "   • Airport management domain structure"
echo "   • Flight operations, passenger services, security data"
echo "   • Sample tables with realistic airport data"
echo "   • Users with different roles and permissions"
echo ""
echo "🔍 To view logs:"
echo "   docker-compose logs -f backend"
echo "   docker-compose logs -f frontend"
echo ""
echo "🛑 To stop all services:"
echo "   docker-compose down"