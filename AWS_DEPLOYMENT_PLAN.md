# AWS Deployment Plan for UPSC Evaluation System

## Architecture Overview

```
Internet → ALB → ECS Fargate (Frontend + Backend) → RDS PostgreSQL
                        ↓
                   S3 (Static Assets)
                        ↓
                   CloudWatch (Monitoring)
```

## Deployment Options

### Option 1: ECS Fargate (Recommended)
**Best for**: Scalable, managed container deployment

**Services needed:**
- **ECS Fargate** - Container orchestration
- **Application Load Balancer** - Route traffic
- **RDS PostgreSQL** - Managed database
- **S3** - Static assets and file storage
- **CloudWatch** - Logging and monitoring
- **ECR** - Docker image registry

**Estimated monthly cost**: $50-150 (depending on usage)

### Option 2: EC2 + Docker Compose
**Best for**: Cost-effective, simple setup

**Services needed:**
- **EC2 t3.medium** - Single server instance
- **RDS PostgreSQL** - Managed database
- **S3** - Static assets
- **Route 53** - DNS management

**Estimated monthly cost**: $30-80

### Option 3: AWS App Runner
**Best for**: Minimal configuration, automatic scaling

**Services needed:**
- **App Runner** - For both frontend and backend
- **RDS PostgreSQL** - Database
- **S3** - File storage

**Estimated monthly cost**: $40-120

## Implementation Steps

### Phase 1: Containerization

#### 1. Create Dockerfile for Frontend
```dockerfile
# Dockerfile.frontend
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY --from=builder /app/dist ./dist
COPY server ./server
EXPOSE 3000
CMD ["npm", "start"]
```

#### 2. Create Dockerfile for Backend
```dockerfile
# Dockerfile.backend
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY backend/ ./
EXPOSE 8001
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8001"]
```

#### 3. Docker Compose for Local Testing
```yaml
version: '3.8'
services:
  frontend:
    build:
      context: .
      dockerfile: Dockerfile.frontend
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
    depends_on:
      - backend

  backend:
    build:
      context: .
      dockerfile: Dockerfile.backend
    ports:
      - "8001:8001"
    environment:
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - DATABASE_URL=${DATABASE_URL}
    depends_on:
      - db

  db:
    image: postgres:15
    environment:
      POSTGRES_DB: upsc_evaluation
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

### Phase 2: AWS Infrastructure Setup

#### 1. Database (RDS PostgreSQL)
```bash
# Create RDS instance
aws rds create-db-instance \
  --db-name upsc_evaluation \
  --db-instance-identifier upsc-eval-db \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --master-username admin \
  --master-user-password <secure-password> \
  --allocated-storage 20 \
  --storage-encrypted
```

#### 2. Container Registry (ECR)
```bash
# Create ECR repositories
aws ecr create-repository --repository-name upsc-frontend
aws ecr create-repository --repository-name upsc-backend
```

#### 3. ECS Cluster Setup
```bash
# Create ECS cluster
aws ecs create-cluster --cluster-name upsc-evaluation-cluster
```

### Phase 3: CI/CD Pipeline

#### GitHub Actions Workflow
```yaml
# .github/workflows/deploy.yml
name: Deploy to AWS

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-west-2

      - name: Build and push Docker images
        run: |
          # Build and push frontend
          docker build -f Dockerfile.frontend -t upsc-frontend .
          aws ecr get-login-password | docker login --username AWS --password-stdin $ECR_REGISTRY
          docker tag upsc-frontend:latest $ECR_REGISTRY/upsc-frontend:latest
          docker push $ECR_REGISTRY/upsc-frontend:latest

          # Build and push backend
          docker build -f Dockerfile.backend -t upsc-backend .
          docker tag upsc-backend:latest $ECR_REGISTRY/upsc-backend:latest
          docker push $ECR_REGISTRY/upsc-backend:latest

      - name: Deploy to ECS
        run: |
          aws ecs update-service --cluster upsc-evaluation-cluster --service upsc-frontend-service --force-new-deployment
          aws ecs update-service --cluster upsc-evaluation-cluster --service upsc-backend-service --force-new-deployment
```

## Environment Variables for Production

### Frontend Environment
```bash
NODE_ENV=production
DATABASE_URL=postgresql://admin:password@upsc-eval-db.region.rds.amazonaws.com:5432/upsc_evaluation
SESSION_SECRET=<generate-secure-secret>
BACKEND_URL=http://upsc-backend-service:8001
```

### Backend Environment
```bash
OPENAI_API_KEY=<your-openai-key>
DATABASE_URL=postgresql://admin:password@upsc-eval-db.region.rds.amazonaws.com:5432/upsc_evaluation
CORS_ORIGINS=https://your-domain.com
LOG_LEVEL=info
```

## Security Considerations

1. **Secrets Management**: Use AWS Secrets Manager for API keys
2. **Network Security**: VPC with private subnets for database
3. **SSL/TLS**: Use ACM for HTTPS certificates
4. **IAM Roles**: Least privilege access for ECS tasks
5. **Security Groups**: Restrict inbound traffic

## Monitoring & Logging

1. **CloudWatch**: Application logs and metrics
2. **AWS X-Ray**: Distributed tracing
3. **Health Checks**: ALB health checks for containers
4. **Alarms**: Set up CloudWatch alarms for key metrics

## Cost Optimization

1. **Auto Scaling**: Scale containers based on demand
2. **Spot Instances**: Use Fargate Spot for non-critical workloads
3. **Reserved Capacity**: For predictable workloads
4. **S3 Intelligent Tiering**: For static assets

## Next Steps

1. **Test local Docker setup**: `docker-compose up`
2. **Set up AWS account**: Create IAM users and policies
3. **Create infrastructure**: Use Terraform or CloudFormation
4. **Set up CI/CD**: Configure GitHub Actions
5. **Deploy and test**: Monitor performance and costs

## Estimated Timeline

- **Week 1**: Containerization and local testing
- **Week 2**: AWS infrastructure setup
- **Week 3**: CI/CD pipeline configuration  
- **Week 4**: Production deployment and monitoring setup