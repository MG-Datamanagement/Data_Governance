# MetaPortal - Airport Data Governance Platform

A modern data governance platform designed for airport management, built with FastAPI, PostgreSQL, and Next.js.

## 🏗️ Architecture

- **Backend**: FastAPI with SQLAlchemy ORM
- **Database**: PostgreSQL (with Docker)
- **Cache**: Redis (with Docker)
- **Frontend**: Next.js 14 with TypeScript
- **Infrastructure**: Docker Compose for local development

## 🚀 Quick Start

### Prerequisites

- **Docker & Docker Compose** - Required for database services
- **Python 3.9+** - For backend development
- **Node.js 18+** - For frontend development
- **Git** - For version control

### One-Command Setup

For new developers joining the project:

```bash
./scripts/start_dev.sh
```

This script will:
- Start PostgreSQL and Redis in Docker containers
- Set up Python virtual environment
- Install all dependencies
- Run database migrations
- Generate airport management sample data
- Optionally start both backend and frontend servers

### Manual Setup

If you prefer step-by-step setup:

#### 1. Start Infrastructure Services

```bash
# Start PostgreSQL and Redis
docker-compose up -d

# Verify services are running
docker-compose ps
```

#### 2. Backend Setup

```bash
# Create and activate virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run database migrations
alembic upgrade head

# Generate sample data
python scripts/generate_sample_data.py

# Start backend server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

#### 3. Frontend Setup

```bash
# Install dependencies
cd frontend
npm install

# Start development server
npm run dev
```

## 📊 Sample Data

The platform includes comprehensive airport management sample data:

### Domains
- **Flight Operations** - Flight schedules, delays, operational data
- **Passenger Services** - Passenger information, bookings, services  
- **Security** - Security screening, baggage, safety data
- **Ground Operations** - Ground handling, cargo, maintenance
- **Finance** - Revenue, costs, financial reporting
- **Facilities** - Terminal facilities, gates, infrastructure

### Sample Tables
- `flights` - Flight information and schedules
- `aircraft` - Aircraft fleet data
- `passengers` - Passenger information (PII data)
- `bookings` - Flight reservations
- `security_screenings` - Security checkpoint data
- `baggage_tracking` - Baggage handling
- `ground_handling` - Ground services
- `revenue_summary` - Financial data
- `gate_assignments` - Airport gate management

### Data Sources
- **Flight Management System** (PostgreSQL)
- **Passenger Information System** (MySQL)
- **Security Management System** (Oracle)
- **Ground Operations Hub** (Snowflake)
- **Financial Data Warehouse** (BigQuery)

## 🔐 Login Credentials

**Admin User:**
- Email: `john.smith@airport.com`
- Password: `password123`

**Other Test Users:**
- `sarah.johnson@airport.com` (Data Steward)
- `mike.chen@airport.com` (Data Analyst)
- `lisa.rodriguez@airport.com` (Data Steward)
- `david.kim@airport.com` (Data Analyst)
- `emma.wilson@airport.com` (Viewer)

All users use password: `password123`

## 🌐 Service URLs

- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs
- **ReDoc Documentation**: http://localhost:8000/redoc
- **Frontend**: http://localhost:3000
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379

## 🛠️ Development Scripts

### Main Scripts

- **`./scripts/start_dev.sh`** - Complete development setup with Docker
- **`./scripts/setup_local.sh`** - Local setup with SQLite (no Docker required)
- **`./scripts/generate_sample_data.py`** - Generate airport sample data

### Docker Commands

```bash
# Start services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Reset database (removes all data)
docker-compose down -v
docker-compose up -d
```

### Database Management

```bash
# Create new migration
alembic revision --autogenerate -m "description"

# Apply migrations
alembic upgrade head

# Rollback migration
alembic downgrade -1

# Reset database with fresh data
docker-compose down -v
docker-compose up -d
alembic upgrade head
python scripts/generate_sample_data.py
```

## 📁 Project Structure

```
metaportal/
├── app/                    # FastAPI backend
│   ├── api/v1/            # API endpoints
│   ├── core/              # Core configuration
│   ├── models/            # SQLAlchemy models
│   └── schemas/           # Pydantic schemas
├── frontend/              # Next.js frontend
│   ├── src/app/          # App router pages
│   ├── src/components/   # React components
│   └── src/contexts/     # React contexts
├── scripts/               # Development scripts
│   ├── start_dev.sh      # Main development setup
│   ├── setup_local.sh    # Local SQLite setup
│   └── generate_sample_data.py
├── alembic/              # Database migrations
├── docker-compose.yml    # Docker services
├── .env                  # Environment variables
└── requirements.txt      # Python dependencies
```

## 🔧 Configuration

### Environment Variables

Key environment variables in `.env`:

```env
# Database
DATABASE_URL=postgresql://metaportal_user:metaportal_pass@localhost:5432/metaportal_db

# Redis
REDIS_URL=redis://localhost:6379/0

# Security
SECRET_KEY=your-secret-key-here

# Application
APP_NAME=MetaPortal - Airport Data Governance Platform
DEBUG=true
```

### Database Configuration

The application supports both PostgreSQL (production) and SQLite (local development):

- **PostgreSQL** (Docker): Full-featured setup with Docker
- **SQLite** (Local): Lightweight setup for quick development

## 🚀 Deployment

### Production Deployment

1. Update environment variables for production
2. Use production-grade database (managed PostgreSQL)
3. Configure proper secrets management
4. Set up monitoring and logging
5. Configure reverse proxy (nginx)

### Environment-Specific Configurations

- **Development**: Docker Compose with local services
- **Staging**: Cloud services with development data
- **Production**: Managed services with production security

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes
4. Run tests: `pytest`
5. Commit your changes: `git commit -m 'Add feature'`
6. Push to the branch: `git push origin feature-name`
7. Submit a pull request

### Code Style

- **Backend**: Follow PEP 8 with Black formatting
- **Frontend**: Use Prettier with TypeScript strict mode
- **Database**: Use Alembic for all schema changes

## 📋 API Documentation

### Core Endpoints

- **Tables**: `/api/v1/tables` - Data table management
- **Domains**: `/api/v1/domains` - Business domain organization
- **Tags**: `/api/v1/tags` - Data classification tags
- **Search**: `/api/v1/search` - Data discovery
- **Quality**: `/api/v1/quality` - Data quality metrics
- **Lineage**: `/api/v1/lineage` - Data lineage tracking

### Authentication

The API uses JWT authentication. Include the token in requests:

```bash
Authorization: Bearer <your-jwt-token>
```

## 📈 Data Model

### Core Entities

- **Tables** - Data assets with metadata
- **Columns** - Column-level information
- **Domains** - Business domain groupings
- **Data Sources** - External system connections
- **Tags** - Classification and labeling
- **Users** - User accounts and permissions

### Relationships

- Tables belong to Domains
- Tables connect to Data Sources
- Columns belong to Tables
- Tags can be applied to Tables and Columns
- Users own Tables and manage Domains

## 🧪 Testing

```bash
# Run backend tests
pytest

# Run frontend tests
cd frontend && npm test

# Run integration tests
pytest tests/integration/
```

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For questions and support:

1. Check the API documentation at `/docs`
2. Review the sample data structure
3. Check Docker service logs: `docker-compose logs`
4. Verify environment configuration

## 🎯 Features

### Data Governance
- **Data Discovery** - Search and explore data assets
- **Data Lineage** - Track data flow and dependencies
- **Data Quality** - Monitor and measure data quality
- **Data Classification** - Tag and categorize data

### Airport Management Focus
- Flight operations data management
- Passenger information governance
- Security and compliance tracking
- Financial data oversight
- Facility and resource management

### User Experience
- Modern web interface with dark/light themes
- Role-based access control
- Real-time search and filtering
- Responsive design for all devices