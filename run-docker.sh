#!/bin/bash

# Personal Assistant - Docker Startup Script
set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Starting Personal Assistant with Docker...${NC}"

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}📝 Creating .env file from template...${NC}"
    cp env.template .env
    echo -e "${RED}⚠️  IMPORTANT: Please edit .env file with your OpenAI API key!${NC}"
    echo -e "${RED}   Get your key from: https://platform.openai.com/api-keys${NC}"
    echo ""
    read -p "Press Enter after you've added your OpenAI API key to .env file..."
fi

# Generate JWT secret if not provided
if ! grep -q "JWT_SECRET=your-super-secret" .env; then
    echo -e "${BLUE}🔑 JWT secret already configured${NC}"
else
    echo -e "${BLUE}🔑 Generating JWT secret...${NC}"
    JWT_SECRET=$(openssl rand -base64 32 2>/dev/null || python3 -c "import secrets; print(secrets.token_urlsafe(32))" 2>/dev/null || echo "fallback-secret-$(date +%s)-please-change-in-production")
    sed -i.bak "s/JWT_SECRET=your-super-secret.*/JWT_SECRET=$JWT_SECRET/" .env
    rm -f .env.bak
fi

# Check if OpenAI API key is set
if grep -q "OPENAI_API_KEY=your-openai-api-key-here" .env; then
    echo -e "${RED}❌ Please set your OpenAI API key in .env file${NC}"
    echo -e "${RED}   Edit the .env file and replace 'your-openai-api-key-here' with your actual API key${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Environment configuration looks good!${NC}"

# Stop any existing containers
echo -e "${BLUE}🛑 Stopping existing containers...${NC}"
docker-compose down --remove-orphans 2>/dev/null || true

# Build and start containers
echo -e "${BLUE}🏗️  Building and starting containers...${NC}"
docker-compose up --build -d

# Wait for services to be healthy
echo -e "${BLUE}⏳ Waiting for services to be ready...${NC}"

# Wait for database
echo -n "  Database: "
timeout=60
counter=0
while [ $counter -lt $timeout ]; do
    if docker-compose exec -T db pg_isready -U postgres >/dev/null 2>&1; then
        echo -e "${GREEN}✅ Ready${NC}"
        break
    fi
    echo -n "."
    sleep 2
    counter=$((counter + 2))
done

if [ $counter -ge $timeout ]; then
    echo -e "${RED}❌ Database failed to start${NC}"
    exit 1
fi

# Wait for Redis
echo -n "  Redis: "
counter=0
while [ $counter -lt $timeout ]; do
    if docker-compose exec -T redis redis-cli ping >/dev/null 2>&1; then
        echo -e "${GREEN}✅ Ready${NC}"
        break
    fi
    echo -n "."
    sleep 2
    counter=$((counter + 2))
done

# Wait for backend
echo -n "  Backend API: "
counter=0
while [ $counter -lt $timeout ]; do
    if curl -s http://localhost:8000/health >/dev/null 2>&1; then
        echo -e "${GREEN}✅ Ready${NC}"
        break
    fi
    echo -n "."
    sleep 2
    counter=$((counter + 2))
done

echo ""
echo -e "${GREEN}🎉 Personal Assistant is running!${NC}"
echo ""
echo -e "${BLUE}📍 Service URLs:${NC}"
echo "  🔗 Backend API: http://localhost:8000"
echo "  📚 API Docs: http://localhost:8000/docs"
echo "  🗄️  Database: localhost:5432 (postgres/dev_password_123)"
echo "  🔴 Redis: localhost:6379"
echo "  🌐 Nginx: http://localhost:80"
echo ""
echo -e "${BLUE}🧪 Test the API:${NC}"
echo "  curl http://localhost:8000/health"
echo ""
echo -e "${BLUE}📱 Next: Start the mobile app${NC}"
echo "  cd mobile"
echo "  npm install"
echo "  npm start"
echo ""
echo -e "${YELLOW}📋 View logs with: docker-compose logs -f${NC}"
echo -e "${YELLOW}🛑 Stop with: docker-compose down${NC}"
