#!/bin/bash

# Personal Assistant - Development Setup Script
# This script sets up the complete development environment

set -e

echo "🚀 Setting up Personal Assistant development environment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the project root
if [ ! -f "README.md" ] || [ ! -d "backend" ] || [ ! -d "mobile" ]; then
    print_error "Please run this script from the project root directory"
    exit 1
fi

# Check for required tools
print_status "Checking required tools..."

# Check Python
if ! command -v python3 &> /dev/null; then
    print_error "Python 3 is required but not installed"
    exit 1
fi
print_success "Python 3 found"

# Check Node.js
if ! command -v node &> /dev/null; then
    print_error "Node.js is required but not installed"
    exit 1
fi
print_success "Node.js found"

# Check PostgreSQL
if ! command -v psql &> /dev/null; then
    print_warning "PostgreSQL not found. Please install PostgreSQL 13+"
fi

# Setup Backend
print_status "Setting up backend environment..."

cd backend

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    print_status "Creating Python virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Install Python dependencies
print_status "Installing Python dependencies..."
pip install -r requirements.txt

# Setup environment file
if [ ! -f ".env" ]; then
    print_status "Creating backend .env file..."
    cp env.example .env
    print_warning "Please edit backend/.env with your configuration"
fi

# Create database if PostgreSQL is available
if command -v createdb &> /dev/null; then
    print_status "Creating database..."
    createdb personal_assistant 2>/dev/null || print_warning "Database might already exist"
fi

cd ..

# Setup Mobile App
print_status "Setting up mobile app..."

cd mobile

# Install dependencies
print_status "Installing mobile app dependencies..."
npm install

# Check if Expo CLI is installed
if ! command -v expo &> /dev/null; then
    print_status "Installing Expo CLI..."
    npm install -g @expo/cli
fi

cd ..

print_success "Setup complete!"

echo ""
echo "📋 Next Steps:"
echo ""
echo "1. Configure your environment:"
echo "   - Edit backend/.env with your API keys and database URL"
echo "   - Set OPENAI_API_KEY for AI functionality"
echo "   - Configure Google credentials for calendar integration"
echo ""
echo "2. Start the backend server:"
echo "   cd backend"
echo "   source venv/bin/activate"
echo "   uvicorn main:app --reload"
echo ""
echo "3. Start the mobile app:"
echo "   cd mobile"
echo "   npm start"
echo ""
echo "4. Update mobile API endpoint:"
echo "   - Edit mobile/src/services/api.ts"
echo "   - Replace localhost with your machine's IP for device testing"
echo ""
echo "🎉 Happy coding!"
