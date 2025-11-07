# 🚀 Getting Started with MetaPortal

## Quick Start (Recommended)

For new developers, use this single command to set up everything:

```bash
./scripts/start_dev.sh
```

This will:
1. ✅ Start PostgreSQL and Redis in Docker containers
2. ✅ Create Python virtual environment  
3. ✅ Install all dependencies
4. ✅ Run database migrations
5. ✅ Generate airport management sample data
6. ✅ Optionally start backend and frontend servers

## What You Get

### 🏢 Airport Management Sample Data
- **6 Business Domains**: Flight Operations, Passenger Services, Security, Ground Operations, Finance, Facilities
- **9 Sample Tables**: flights, aircraft, passengers, bookings, security_screenings, baggage_tracking, ground_handling, revenue_summary, gate_assignments
- **5 Data Sources**: Flight Management System, Passenger Information System, Security Management System, Ground Operations Hub, Financial Data Warehouse
- **10 Classification Tags**: PII, Financial, Operational, Security, Real-time, Batch, Critical, Passenger, Flight, Compliance
- **6 Test Users**: Admin, Data Stewards, Data Analysts, Viewers

### 🔐 Login Credentials
- **Email**: `john.smith@airport.com`
- **Password**: `password123`

### 🌐 Service URLs
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs
- Frontend: http://localhost:3000

## Alternative: Local SQLite Setup

For lightweight development without Docker:

```bash
./scripts/setup_local.sh
```

This uses SQLite instead of PostgreSQL and doesn't require Docker.

## Manual Docker Commands

If you need to manage Docker services manually:

```bash
# Start services
docker-compose up -d

# Stop services  
docker-compose down

# Reset database (removes all data)
docker-compose down -v
docker-compose up -d
```

## Troubleshooting

### Docker Issues
```bash
# Check if Docker is running
docker info

# View service logs
docker-compose logs -f postgres
docker-compose logs -f redis
```

### Database Issues
```bash
# Reset and regenerate data
docker-compose down -v
docker-compose up -d
alembic upgrade head
python scripts/generate_sample_data.py
```

### Frontend Issues
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
npm run dev
```

## Need Help?

1. Check the [README.md](README.md) for comprehensive documentation
2. Visit http://localhost:8000/docs for API documentation
3. Check Docker logs with `docker-compose logs -f`
4. Ensure all services are running with `docker-compose ps`

## Sample Data Overview

The airport management data includes:

- **Flights Table**: Flight schedules, delays, aircraft assignments
- **Passengers Table**: Personal information (PII tagged), bookings
- **Security Screenings**: Checkpoint data, screening results
- **Revenue Summary**: Financial reporting by service category
- **Gate Assignments**: Terminal gate management

Perfect for demonstrating data governance capabilities in an airport context!