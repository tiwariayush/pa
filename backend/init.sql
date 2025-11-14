-- Initial database setup for Personal Assistant
-- This will run when the PostgreSQL container starts

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create initial user for testing
-- Password will be hashed by the application
-- This is just for development/testing
