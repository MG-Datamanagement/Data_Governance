#!/bin/bash

set -e

echo "🚀 Starting MetaPortal Development Environment"
echo "=============================================="

# Set script directory and project root
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_DIR"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

echo_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

echo_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

echo_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if Docker is installed and running
echo_info "Checking Docker installation..."
if ! command -v docker &> /dev/null; then
    echo_error "Docker is not installed. Please install Docker first."
    exit 1
fi

if ! docker info &> /dev/null; then
    echo_error "Docker is not running. Please start Docker first."
    exit 1
fi
echo_success "Docker is available and running"

# Check if Docker Compose is available
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo_error "Docker Compose is not available. Please install Docker Compose."
    exit 1
fi
echo_success "Docker Compose is available"

# Start Docker services
echo_info "Starting PostgreSQL, Redis, and Solr services..."
if command -v docker-compose &> /dev/null; then
    docker-compose up -d
else
    docker compose up -d
fi

# Wait for services to be healthy
echo_info "Waiting for services to be ready..."
max_attempts=30
attempt=0

while [ $attempt -lt $max_attempts ]; do
    attempt=$((attempt + 1))
    
    # Check PostgreSQL
    if docker exec metaportal_postgres pg_isready -U metaportal_user -d metaportal_db &> /dev/null; then
        postgres_ready=true
    else
        postgres_ready=false
    fi
    
    # Check Redis
    if docker exec metaportal_redis redis-cli ping | grep -q PONG; then
        redis_ready=true
    else
        redis_ready=false
    fi
    
    # Check Solr
    if curl -s "http://localhost:8983/solr/admin/cores?action=STATUS" &> /dev/null; then
        solr_ready=true
    else
        solr_ready=false
    fi
    
    if [ "$postgres_ready" = true ] && [ "$redis_ready" = true ] && [ "$solr_ready" = true ]; then
        echo_success "All services are ready!"
        break
    fi
    
    echo_info "Waiting for services... (attempt $attempt/$max_attempts)"
    sleep 2
done

if [ $attempt -eq $max_attempts ]; then
    echo_error "Services failed to start within expected time"
    exit 1
fi

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo_info "Creating Python virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo_info "Activating Python virtual environment..."
source venv/bin/activate

# Install/update Python dependencies
echo_info "Installing Python dependencies..."
python -m pip install --upgrade pip
pip install -r requirements.txt

# Run database migrations
echo_info "Running database migrations..."
alembic upgrade head

# Generate sample data if database is empty
echo_info "Checking if sample data needs to be generated..."
python -c "
import sys, os
sys.path.append('.')
from sqlalchemy import create_engine, text
from app.core.config import settings

engine = create_engine(settings.database_url)
with engine.connect() as conn:
    result = conn.execute(text('SELECT COUNT(*) FROM users')).scalar()
    if result == 0:
        print('GENERATE_DATA')
    else:
        print('DATA_EXISTS')
" > /tmp/data_check

if grep -q "GENERATE_DATA" /tmp/data_check; then
    echo_info "Generating sample airport management data..."
    python scripts/generate_sample_data.py
    python scripts/comprehensive_seed_data.py
    
    # Configure Solr schema and load data
    echo_info "Configuring Solr schema..."
    if [ -f "scripts/configure_solr_schema.sh" ]; then
        chmod +x scripts/configure_solr_schema.sh
        ./scripts/configure_solr_schema.sh
        echo_success "Solr schema configured successfully"
    else
        echo_warning "Solr schema configuration script not found at scripts/configure_solr_schema.sh"
    fi
    
    echo_info "Loading data into Solr..."
    if [ -f "scripts/load_data_to_solr.py" ]; then
        python scripts/load_data_to_solr.py
        echo_success "Data loaded into Solr successfully"
    else
        echo_warning "Solr data loading script not found at scripts/load_data_to_solr.py"
    fi
else
    echo_success "Sample data already exists, skipping generation"
    
    # Check if Solr core has data, if not, load it
    echo_info "Checking if Solr needs data..."
    solr_count=$(curl -s "http://localhost:8983/solr/suggestions_core/select?q=*:*&rows=1" | grep -o '"numFound":[0-9]*' | cut -d: -f2)
    if [ "$solr_count" -eq 0 ]; then
        echo_info "Solr core is empty, loading data..."
        
        if [ -f "scripts/configure_solr_schema.sh" ]; then
            chmod +x scripts/configure_solr_schema.sh
            ./scripts/configure_solr_schema.sh
            echo_success "Solr schema configured successfully"
        fi
        
        if [ -f "scripts/load_data_to_solr.py" ]; then
            python scripts/load_data_to_solr.py
            echo_success "Data loaded into Solr successfully"
        fi
    else
        echo_success "Solr already contains data"
    fi
fi

# Check if Node.js is installed
echo_info "Checking Node.js installation..."
if ! command -v node &> /dev/null; then
    echo_warning "Node.js is not installed. Frontend will not start automatically."
    echo_warning "Please install Node.js 18+ to run the frontend."
    frontend_available=false
else
    node_version=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$node_version" -lt 18 ]; then
        echo_warning "Node.js version is too old (requires 18+). Frontend may not work properly."
    fi
    frontend_available=true
    echo_success "Node.js is available"
fi

# Install frontend dependencies if Node.js is available
if [ "$frontend_available" = true ]; then
    echo_info "Installing frontend dependencies..."
    cd frontend
    npm install
    cd ..
fi

echo ""
echo_success "🎉 MetaPortal development environment is ready!"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo_info "📍 Service URLs:"
echo "   🔧 Backend API:        http://localhost:8000"
echo "   📚 API Documentation:  http://localhost:8000/docs"
echo "   📊 ReDoc:              http://localhost:8000/redoc"
echo "   🗄️  PostgreSQL:        localhost:5434 (external) / 5432 (container)"
echo "   🚀 Redis:              localhost:6379"
echo "   🔍 Solr:               http://localhost:8983/solr"
if [ "$frontend_available" = true ]; then
echo "   🌐 Frontend:           http://localhost:3000"
fi
echo ""
echo_info "🔐 Login Credentials:"
echo "   👤 Admin User:         john.smith@airport.com"
echo "   🔑 Password:           password123"
echo ""
echo_info "🛠️  To start services manually:"
echo ""
echo "   Backend (in project root):"
echo "   $ source venv/bin/activate"
echo "   $ uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"
echo ""
if [ "$frontend_available" = true ]; then
echo "   Frontend (in frontend/ directory):"
echo "   $ cd frontend && npm run dev"
echo ""
fi
echo_info "🐳 Docker services (PostgreSQL + Redis + Solr) are running in the background"
echo "   To stop: docker-compose down"
echo "   To view logs: docker-compose logs -f"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Ask if user wants to start services now
echo ""
read -p "🚀 Do you want to start the backend and frontend servers now? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo_info "Starting development servers..."
    
    # Start backend in background
    source venv/bin/activate
    uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 &
    BACKEND_PID=$!
    
    # Start frontend in background if available
    if [ "$frontend_available" = true ]; then
        cd frontend
        npm run dev &
        FRONTEND_PID=$!
        cd ..
    fi
    
    echo ""
    echo_success "🎉 Services are starting!"
    echo_info "Backend PID: $BACKEND_PID"
    if [ "$frontend_available" = true ]; then
        echo_info "Frontend PID: $FRONTEND_PID"
    fi
    echo ""
    echo_warning "Press Ctrl+C to stop all services"
    
    # Function to cleanup on exit
    cleanup() {
        echo ""
        echo_info "Stopping services..."
        kill $BACKEND_PID 2>/dev/null || true
        if [ "$frontend_available" = true ]; then
            kill $FRONTEND_PID 2>/dev/null || true
        fi
        echo_success "Services stopped"
        exit 0
    }
    
    # Set trap to cleanup on script exit
    trap cleanup INT TERM
    
    # Wait for services to start
    sleep 3
    
    echo_info "Services should be available at:"
    echo "   🔧 Backend: http://localhost:8000"
    if [ "$frontend_available" = true ]; then
        echo "   🌐 Frontend: http://localhost:3000"
    fi
    
    # Keep script running
    wait
else
    echo_info "You can start the services manually using the commands shown above."
fi
























# #!/bin/bash

# set -e

# echo "🚀 Starting MetaPortal Development Environment"
# echo "=============================================="

# # Set script directory and project root
# SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
# PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
# cd "$PROJECT_DIR"

# # Colors for output
# RED='\033[0;31m'
# GREEN='\033[0;32m'
# YELLOW='\033[1;33m'
# BLUE='\033[0;34m'
# NC='\033[0m' # No Color

# echo_info() {
#     echo -e "${BLUE}ℹ️  $1${NC}"
# }

# echo_success() {
#     echo -e "${GREEN}✅ $1${NC}"
# }

# echo_warning() {
#     echo -e "${YELLOW}⚠️  $1${NC}"
# }

# echo_error() {
#     echo -e "${RED}❌ $1${NC}"
# }

# # Check if Docker is installed and running
# echo_info "Checking Docker installation..."
# if ! command -v docker &> /dev/null; then
#     echo_error "Docker is not installed. Please install Docker first."
#     exit 1
# fi

# if ! docker info &> /dev/null; then
#     echo_error "Docker is not running. Please start Docker first."
#     exit 1
# fi
# echo_success "Docker is available and running"

# # Check if Docker Compose is available
# if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
#     echo_error "Docker Compose is not available. Please install Docker Compose."
#     exit 1
# fi
# echo_success "Docker Compose is available"

# # Start Docker services
# echo_info "Starting PostgreSQL and Redis services..."
# if command -v docker-compose &> /dev/null; then
#     docker-compose up -d
# else
#     docker compose up -d
# fi

# # Wait for services to be healthy
# echo_info "Waiting for services to be ready..."
# max_attempts=30
# attempt=0

# while [ $attempt -lt $max_attempts ]; do
#     attempt=$((attempt + 1))
    
#     # Check PostgreSQL
#     if docker exec metaportal_postgres pg_isready -U metaportal_user -d metaportal_db &> /dev/null; then
#         postgres_ready=true
#     else
#         postgres_ready=false
#     fi
    
#     # Check Redis
#     if docker exec metaportal_redis redis-cli ping | grep -q PONG; then
#         redis_ready=true
#     else
#         redis_ready=false
#     fi
    
#     if [ "$postgres_ready" = true ] && [ "$redis_ready" = true ]; then
#         echo_success "All services are ready!"
#         break
#     fi
    
#     echo_info "Waiting for services... (attempt $attempt/$max_attempts)"
#     sleep 2
# done

# if [ $attempt -eq $max_attempts ]; then
#     echo_error "Services failed to start within expected time"
#     exit 1
# fi

# # Check if virtual environment exists
# if [ ! -d "venv" ]; then
#     echo_info "Creating Python virtual environment..."
#     python3 -m venv venv
# fi

# # Activate virtual environment
# echo_info "Activating Python virtual environment..."
# source venv/bin/activate

# # Install/update Python dependencies
# echo_info "Installing Python dependencies..."
# pip install --upgrade pip
# pip install -r requirements.txt

# # Run database migrations
# echo_info "Running database migrations..."
# alembic upgrade head

# # Generate sample data if database is empty
# echo_info "Checking if sample data needs to be generated..."
# python -c "
# import sys, os
# sys.path.append('.')
# from sqlalchemy import create_engine, text
# from app.core.config import settings

# engine = create_engine(settings.database_url)
# with engine.connect() as conn:
#     result = conn.execute(text('SELECT COUNT(*) FROM users')).scalar()
#     if result == 0:
#         print('GENERATE_DATA')
#     else:
#         print('DATA_EXISTS')
# " > /tmp/data_check

# if grep -q "GENERATE_DATA" /tmp/data_check; then
#     echo_info "Generating sample airport management data..."
#     python scripts/generate_sample_data.py
# else
#     echo_success "Sample data already exists, skipping generation"
# fi

# # Check if Node.js is installed
# echo_info "Checking Node.js installation..."
# if ! command -v node &> /dev/null; then
#     echo_warning "Node.js is not installed. Frontend will not start automatically."
#     echo_warning "Please install Node.js 18+ to run the frontend."
#     frontend_available=false
# else
#     node_version=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
#     if [ "$node_version" -lt 18 ]; then
#         echo_warning "Node.js version is too old (requires 18+). Frontend may not work properly."
#     fi
#     frontend_available=true
#     echo_success "Node.js is available"
# fi

# # Install frontend dependencies if Node.js is available
# if [ "$frontend_available" = true ]; then
#     echo_info "Installing frontend dependencies..."
#     cd frontend
#     npm install
#     cd ..
# fi

# echo ""
# echo_success "🎉 MetaPortal development environment is ready!"
# echo ""
# echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
# echo ""
# echo_info "📍 Service URLs:"
# echo "   🔧 Backend API:        http://localhost:8000"
# echo "   📚 API Documentation:  http://localhost:8000/docs"
# echo "   📊 ReDoc:              http://localhost:8000/redoc"
# echo "   🗄️  PostgreSQL:        localhost:5432"
# echo "   🚀 Redis:              localhost:6379"
# if [ "$frontend_available" = true ]; then
# echo "   🌐 Frontend:           http://localhost:3000"
# fi
# echo ""
# echo_info "🔐 Login Credentials:"
# echo "   👤 Admin User:         john.smith@airport.com"
# echo "   🔑 Password:           password123"
# echo ""
# echo_info "🛠️  To start services manually:"
# echo ""
# echo "   Backend (in project root):"
# echo "   $ source venv/bin/activate"
# echo "   $ uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"
# echo ""
# if [ "$frontend_available" = true ]; then
# echo "   Frontend (in frontend/ directory):"
# echo "   $ cd frontend && npm run dev"
# echo ""
# fi
# echo_info "🐳 Docker services (PostgreSQL + Redis) are running in the background"
# echo "   To stop: docker-compose down"
# echo "   To view logs: docker-compose logs -f"
# echo ""
# echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# # Ask if user wants to start services now
# echo ""
# read -p "🚀 Do you want to start the backend and frontend servers now? (y/N): " -n 1 -r
# echo
# if [[ $REPLY =~ ^[Yy]$ ]]; then
#     echo_info "Starting development servers..."
    
#     # Start backend in background
#     source venv/bin/activate
#     uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 &
#     BACKEND_PID=$!
    
#     # Start frontend in background if available
#     if [ "$frontend_available" = true ]; then
#         cd frontend
#         npm run dev &
#         FRONTEND_PID=$!
#         cd ..
#     fi
    
#     echo ""
#     echo_success "🎉 Services are starting!"
#     echo_info "Backend PID: $BACKEND_PID"
#     if [ "$frontend_available" = true ]; then
#         echo_info "Frontend PID: $FRONTEND_PID"
#     fi
#     echo ""
#     echo_warning "Press Ctrl+C to stop all services"
    
#     # Function to cleanup on exit
#     cleanup() {
#         echo ""
#         echo_info "Stopping services..."
#         kill $BACKEND_PID 2>/dev/null || true
#         if [ "$frontend_available" = true ]; then
#             kill $FRONTEND_PID 2>/dev/null || true
#         fi
#         echo_success "Services stopped"
#         exit 0
#     }
    
#     # Set trap to cleanup on script exit
#     trap cleanup INT TERM
    
#     # Wait for services to start
#     sleep 3
    
#     echo_info "Services should be available at:"
#     echo "   🔧 Backend: http://localhost:8000"
#     if [ "$frontend_available" = true ]; then
#         echo "   🌐 Frontend: http://localhost:3000"
#     fi
    
#     # Keep script running
#     wait
# else
#     echo_info "You can start the services manually using the commands shown above."
# fi