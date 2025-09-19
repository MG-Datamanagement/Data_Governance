-- Initial database setup for MetaPortal
-- This script runs when the PostgreSQL container is first created

-- Create the metaportal_user if it doesn't exist
DO
$do$
BEGIN
   IF NOT EXISTS (
      SELECT FROM pg_catalog.pg_roles
      WHERE  rolname = 'metaportal_user') THEN

      CREATE ROLE metaportal_user LOGIN PASSWORD 'metaportal_pass';
   END IF;
END
$do$;

-- Create extensions that might be useful
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Grant necessary permissions
GRANT ALL PRIVILEGES ON DATABASE metaportal_db TO metaportal_user;
GRANT CREATE ON DATABASE metaportal_db TO metaportal_user;

-- The actual tables will be created by Alembic migrations
-- This file is just for initial database setup and extensions