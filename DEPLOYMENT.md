# Personal Assistant - Deployment Guide

Complete deployment guide for the Personal Assistant system in production.

## Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Mobile Apps   │    │   Web Client    │    │   Admin Panel   │
│  (iOS/Android)  │    │   (Optional)    │    │   (Optional)    │
└─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘
          │                      │                      │
          └──────────────────────┼──────────────────────┘
                                 │
                    ┌─────────────▼─────────────┐
                    │      Load Balancer       │
                    │     (Nginx/Cloudflare)   │
                    └─────────────┬─────────────┘
                                  │
                    ┌─────────────▼─────────────┐
                    │     FastAPI Backend      │
                    │    (Multiple Instances)   │
                    └─────────────┬─────────────┘
                                  │
          ┌───────────────────────┼───────────────────────┐
          │                       │                       │
┌─────────▼─────────┐   ┌─────────▼─────────┐   ┌─────────▼─────────┐
│   PostgreSQL      │   │      Redis        │   │  External APIs    │
│   (Primary DB)    │   │   (Cache/Queue)   │   │ (OpenAI, Google)  │
└───────────────────┘   └───────────────────┘   └───────────────────┘
```

## Production Infrastructure

### Recommended Stack

**Cloud Provider**: AWS, Google Cloud, or DigitalOcean
**Container Orchestration**: Docker + Kubernetes or Docker Compose
**Database**: PostgreSQL (managed service recommended)
**Cache/Queue**: Redis (managed service recommended)
**Load Balancer**: Nginx or cloud provider LB
**CDN**: CloudFlare or AWS CloudFront
**Monitoring**: Prometheus + Grafana or DataDog
**Logging**: ELK Stack or cloud logging service

## Backend Deployment

### Docker Configuration

Create `backend/Dockerfile`:

```dockerfile
FROM python:3.9-slim

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Set work directory
WORKDIR /app

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy project
COPY . .

# Create non-root user
RUN adduser --disabled-password --gecos '' appuser
RUN chown -R appuser:appuser /app
USER appuser

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8000/health || exit 1

# Run the application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Docker Compose for Development

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  backend:
    build: ./backend
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://postgres:password@db:5432/personal_assistant
      - REDIS_URL=redis://redis:6379
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - JWT_SECRET=${JWT_SECRET}
    depends_on:
      - db
      - redis
    volumes:
      - ./backend:/app
    restart: unless-stopped

  db:
    image: postgres:13
    environment:
      - POSTGRES_DB=personal_assistant
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    restart: unless-stopped

  redis:
    image: redis:6-alpine
    ports:
      - "6379:6379"
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/ssl/certs
    depends_on:
      - backend
    restart: unless-stopped

volumes:
  postgres_data:
```

### Kubernetes Deployment

Create `k8s/backend-deployment.yaml`:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: personal-assistant-backend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: personal-assistant-backend
  template:
    metadata:
      labels:
        app: personal-assistant-backend
    spec:
      containers:
      - name: backend
        image: your-registry/personal-assistant-backend:latest
        ports:
        - containerPort: 8000
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: db-secret
              key: url
        - name: OPENAI_API_KEY
          valueFrom:
            secretKeyRef:
              name: api-keys
              key: openai
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 8000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 8000
          initialDelaySeconds: 5
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: personal-assistant-backend-service
spec:
  selector:
    app: personal-assistant-backend
  ports:
  - port: 80
    targetPort: 8000
  type: ClusterIP
```

## Database Setup

### PostgreSQL Configuration

**Production Settings** (`postgresql.conf`):

```ini
# Connection Settings
max_connections = 100
shared_buffers = 256MB
effective_cache_size = 1GB
maintenance_work_mem = 64MB
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100
random_page_cost = 1.1
effective_io_concurrency = 200

# Logging
log_destination = 'stderr'
logging_collector = on
log_directory = 'log'
log_filename = 'postgresql-%Y-%m-%d_%H%M%S.log'
log_min_duration_statement = 1000
log_line_prefix = '%t [%p]: [%l-1] user=%u,db=%d,app=%a,client=%h '
```

**Backup Strategy**:

```bash
# Daily backup script
#!/bin/bash
BACKUP_DIR="/backups"
DB_NAME="personal_assistant"
DATE=$(date +%Y%m%d_%H%M%S)

pg_dump -h localhost -U postgres $DB_NAME | gzip > $BACKUP_DIR/backup_$DATE.sql.gz

# Keep only last 7 days
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +7 -delete
```

### Database Migrations

For production deployments, implement proper migration system:

```python
# backend/migrations/001_initial.py
from alembic import op
import sqlalchemy as sa

def upgrade():
    # Create tables
    op.create_table('users', ...)
    op.create_table('tasks', ...)
    # Add indexes
    op.create_index('idx_tasks_user_id', 'tasks', ['user_id'])

def downgrade():
    # Rollback changes
    op.drop_table('tasks')
    op.drop_table('users')
```

## Mobile App Deployment

### iOS App Store

1. **Prepare for submission**:
   ```bash
   # Update version in app.json
   {
     "expo": {
       "version": "1.0.0",
       "ios": {
         "buildNumber": "1"
       }
     }
   }
   
   # Build for App Store
   eas build --platform ios --profile production
   ```

2. **App Store Connect setup**:
   - Create app listing
   - Upload screenshots (required sizes)
   - Set app description and keywords
   - Configure pricing and availability
   - Submit for review

3. **Required assets**:
   - App icon (1024x1024px)
   - Screenshots for all device sizes
   - Privacy policy URL
   - App description and keywords

### Google Play Store

1. **Prepare Android build**:
   ```bash
   # Build AAB for Play Store
   eas build --platform android --profile production
   ```

2. **Play Console setup**:
   - Create app listing
   - Upload AAB file
   - Set up content rating
   - Configure pricing and distribution
   - Submit for review

3. **Required configurations**:
   - Target API level 33+ (Android 13)
   - App signing by Google Play
   - Privacy policy and permissions explanation

### Build Profiles

Create `eas.json`:

```json
{
  "cli": {
    "version": ">= 3.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "ios": {
        "simulator": true
      }
    },
    "production": {
      "env": {
        "API_URL": "https://api.personalassistant.com"
      }
    }
  },
  "submit": {
    "production": {}
  }
}
```

## Environment Configuration

### Production Environment Variables

**Backend** (`.env.production`):

```bash
# Application
DEBUG=false
LOG_LEVEL=INFO
CORS_ORIGINS=https://app.personalassistant.com

# Database
DATABASE_URL=postgresql://user:pass@prod-db-host:5432/personal_assistant
DATABASE_POOL_SIZE=20
DATABASE_MAX_OVERFLOW=30

# Cache/Queue
REDIS_URL=redis://prod-redis-host:6379
REDIS_POOL_SIZE=10

# Security
JWT_SECRET=super-secret-production-key-min-32-chars
JWT_EXPIRY_HOURS=168

# AI Services
OPENAI_API_KEY=sk-prod-openai-key
OPENAI_ORG_ID=org-your-org-id

# Google Services
GOOGLE_CLIENT_ID=prod-google-client-id
GOOGLE_CLIENT_SECRET=prod-google-client-secret

# Monitoring
SENTRY_DSN=https://your-sentry-dsn
DATADOG_API_KEY=your-datadog-key

# Rate Limiting
RATE_LIMIT_PER_MINUTE=60
RATE_LIMIT_BURST=10
```

**Mobile App** (build-time configuration):

```typescript
// config/production.ts
export const config = {
  API_BASE_URL: 'https://api.personalassistant.com',
  SENTRY_DSN: 'https://your-sentry-dsn',
  ANALYTICS_KEY: 'your-analytics-key',
  ENABLE_LOGGING: false,
  CACHE_TIMEOUT: 300000, // 5 minutes
};
```

## Security Configuration

### SSL/TLS Setup

**Nginx Configuration** (`nginx.conf`):

```nginx
server {
    listen 80;
    server_name api.personalassistant.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.personalassistant.com;

    ssl_certificate /etc/ssl/certs/fullchain.pem;
    ssl_certificate_key /etc/ssl/private/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
    ssl_prefer_server_ciphers off;

    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload";

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req zone=api burst=20 nodelay;

    location / {
        proxy_pass http://backend:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### API Security

1. **Rate Limiting**: Implement per-user and per-IP rate limits
2. **Input Validation**: Strict Pydantic schemas for all inputs
3. **Authentication**: JWT with short expiry and refresh tokens
4. **Authorization**: Role-based access control
5. **Data Encryption**: Encrypt sensitive data at rest
6. **API Versioning**: Version API endpoints for backward compatibility

## Monitoring & Observability

### Application Monitoring

**Prometheus Metrics** (`backend/monitoring.py`):

```python
from prometheus_client import Counter, Histogram, Gauge
import time

# Metrics
REQUEST_COUNT = Counter('http_requests_total', 'Total HTTP requests', ['method', 'endpoint', 'status'])
REQUEST_DURATION = Histogram('http_request_duration_seconds', 'HTTP request duration')
ACTIVE_USERS = Gauge('active_users_total', 'Number of active users')
AI_AGENT_CALLS = Counter('ai_agent_calls_total', 'AI agent calls', ['agent_type', 'status'])

# Middleware
@app.middleware("http")
async def monitor_requests(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    duration = time.time() - start_time
    
    REQUEST_COUNT.labels(
        method=request.method,
        endpoint=request.url.path,
        status=response.status_code
    ).inc()
    
    REQUEST_DURATION.observe(duration)
    return response
```

**Grafana Dashboard**:

- API response times and error rates
- Database connection pool status
- AI agent success rates and latencies
- User activity and task creation rates
- System resource usage (CPU, memory, disk)

### Logging Strategy

```python
import structlog
import logging.config

# Structured logging configuration
logging.config.dictConfig({
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "json": {
            "()": structlog.stdlib.ProcessorFormatter,
            "processor": structlog.dev.ConsoleRenderer(colors=False),
        },
    },
    "handlers": {
        "default": {
            "level": "INFO",
            "class": "logging.StreamHandler",
            "formatter": "json",
        },
    },
    "loggers": {
        "": {
            "handlers": ["default"],
            "level": "INFO",
        },
    }
})

logger = structlog.get_logger()

# Usage
logger.info("User action", user_id="123", action="create_task", task_id="456")
```

## Performance Optimization

### Database Optimization

1. **Connection Pooling**: Use asyncpg pool with proper sizing
2. **Query Optimization**: Add indexes on frequently queried columns
3. **Read Replicas**: Use read replicas for analytics queries
4. **Caching**: Cache frequently accessed data in Redis

### API Optimization

1. **Response Compression**: Enable gzip compression
2. **Pagination**: Implement cursor-based pagination for large datasets
3. **Background Tasks**: Use Celery for heavy operations
4. **CDN**: Serve static assets from CDN

### Mobile App Optimization

1. **Bundle Size**: Optimize bundle size with tree shaking
2. **Image Optimization**: Compress and optimize images
3. **Caching**: Implement proper caching strategy
4. **Lazy Loading**: Load screens and components on demand

## Disaster Recovery

### Backup Strategy

1. **Database**: Automated daily backups with point-in-time recovery
2. **File Storage**: Replicated across multiple regions
3. **Configuration**: Version-controlled infrastructure as code
4. **Secrets**: Secure backup of encryption keys and secrets

### Recovery Procedures

1. **Database Recovery**:
   ```bash
   # Restore from backup
   gunzip -c backup_20240115_120000.sql.gz | psql -h localhost -U postgres personal_assistant
   ```

2. **Application Recovery**:
   ```bash
   # Deploy from last known good configuration
   kubectl apply -f k8s/
   kubectl rollout restart deployment/personal-assistant-backend
   ```

3. **Data Center Failover**:
   - DNS failover to secondary region
   - Database failover to standby
   - Application deployment in secondary region

## Cost Optimization

### Infrastructure Costs

1. **Right-sizing**: Monitor and adjust instance sizes
2. **Auto-scaling**: Scale based on demand
3. **Reserved Instances**: Use reserved instances for predictable workloads
4. **Spot Instances**: Use spot instances for non-critical workloads

### API Costs

1. **OpenAI Usage**: Monitor and optimize AI agent calls
2. **Google APIs**: Implement caching for calendar/email data
3. **Database**: Optimize queries to reduce compute costs
4. **Bandwidth**: Use CDN to reduce data transfer costs

## Compliance & Privacy

### Data Protection

1. **GDPR Compliance**: Implement data deletion and export
2. **Data Encryption**: Encrypt data in transit and at rest
3. **Access Logs**: Log all data access for auditing
4. **Data Retention**: Implement data retention policies

### Privacy Features

1. **Data Minimization**: Collect only necessary data
2. **User Consent**: Clear consent mechanisms
3. **Data Portability**: Allow users to export their data
4. **Right to Deletion**: Implement account deletion

## Deployment Checklist

### Pre-Deployment

- [ ] All tests passing (unit, integration, e2e)
- [ ] Security scan completed
- [ ] Performance testing completed
- [ ] Database migrations tested
- [ ] Backup and recovery procedures tested
- [ ] Monitoring and alerting configured
- [ ] Documentation updated

### Deployment Process

- [ ] Blue-green deployment or rolling update
- [ ] Database migrations applied
- [ ] Configuration updated
- [ ] Health checks passing
- [ ] Monitoring dashboards showing green
- [ ] Smoke tests completed

### Post-Deployment

- [ ] Monitor error rates and performance
- [ ] Verify all features working
- [ ] Check logs for any issues
- [ ] Update status page
- [ ] Notify stakeholders of successful deployment

## Support & Maintenance

### Ongoing Tasks

1. **Security Updates**: Regular dependency updates
2. **Performance Monitoring**: Continuous performance optimization
3. **User Feedback**: Implement user feedback and feature requests
4. **Cost Optimization**: Regular cost analysis and optimization
5. **Compliance**: Ensure ongoing compliance with regulations

### Emergency Procedures

1. **Incident Response**: Clear escalation procedures
2. **Rollback Plan**: Quick rollback to previous version
3. **Communication**: Status page and user communication
4. **Post-Mortem**: Analysis and improvement process

This deployment guide provides a comprehensive framework for taking the Personal Assistant system from development to production. Adjust the specific technologies and configurations based on your requirements and constraints.
