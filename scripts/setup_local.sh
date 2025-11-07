#!/bin/bash

echo "🚀 Setting up MetaPortal for local development..."

# Set script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_DIR"

echo "📂 Project directory: $PROJECT_DIR"

# Create virtual environment
echo "🐍 Creating Python virtual environment..."
if [ ! -d "venv" ]; then
    python -m venv venv
fi

# Activate virtual environment
echo "⚡ Activating virtual environment..."
source venv/Scripts/activate

# Install dependencies
echo "📦 Installing Python dependencies..."
python -m pip install --upgrade pip
pip install -r requirements.txt

# Update .env for local development
echo "📝 Updating .env for local development..."
cat > .env << EOL
# Database Configuration (SQLite for local development)
DATABASE_URL=sqlite:///./metaportal.db

# Redis Configuration (optional for local dev)
REDIS_URL=redis://localhost:6379/0
REDIS_PASSWORD=

# Security Configuration
SECRET_KEY=local-development-secret-key-metaportal-2025
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_MINUTES=1440

# Application Configuration
APP_NAME=MetaPortal
APP_VERSION=1.0.0
DEBUG=true
LOG_LEVEL=INFO
LOG_FORMAT=text

# API Configuration
API_V1_PREFIX=/api/v1
DOCS_URL=/api/docs
REDOC_URL=/api/redoc

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:8080,http://127.0.0.1:3000

# Rate Limiting
RATE_LIMIT_PER_MINUTE=100

# Pagination
DEFAULT_PAGE_SIZE=20
MAX_PAGE_SIZE=100

# Search Configuration
SEARCH_RESULTS_LIMIT=1000

# Monitoring
ENABLE_METRICS=true

# Database Connection Pool
DATABASE_POOL_SIZE=5
DATABASE_MAX_OVERFLOW=10

# Environment
ENVIRONMENT=development
EOL

# Initialize database
echo "🗄️ Initializing database..."
python -c "
import sys
sys.path.append('.')
from app.core.database import DatabaseManager
DatabaseManager.create_tables()
print('✅ Database tables created!')
"

# Generate sample data
echo "📊 Generating sample airport management data..."
python scripts/generate_sample_data.py

echo ""
echo "🎉 Local setup completed successfully!"
echo ""
echo "🚀 To start the server:"
echo "   source venv/bin/activate"
echo "   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"
echo ""
echo "📍 Access URLs:"
echo "   🔧 Backend API: http://localhost:8000"
echo "   📚 API Documentation: http://localhost:8000/api/docs"
echo "   ⚡ Health Check: http://localhost:8000/health"
echo ""
echo "🔐 Login Credentials:"
echo "   Email: john.smith@airport.com"
echo "   Password: password123"