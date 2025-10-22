# 🚀 Deployment Guide - Docker & Kubernetes

This guide explains how to deploy the 4 in a Row game using Docker and Kubernetes.

## 📋 Table of Contents

- [Docker Deployment](#docker-deployment)
- [Kubernetes Deployment](#kubernetes-deployment)
- [Production Considerations](#production-considerations)
- [Monitoring & Scaling](#monitoring--scaling)

---

## 🐳 Docker Deployment

### Prerequisites

- Docker 20.10+
- Docker Compose 2.0+

### Quick Start with Docker Compose

1. **Clone the repository**:
```bash
git clone <repository-url>
cd fourinrow
```

2. **Build and start all services**:
```bash
docker-compose up --build
```

This starts:
- PostgreSQL database (port 5432)
- Kafka & Zookeeper (port 9092)
- Node.js backend (port 5000)
- Frontend with nginx (port 80)

3. **Access the application**:
```
http://localhost
```

### Individual Service Builds

#### Build Node.js Backend
```bash
cd backend-nodejs
docker build -t fourinrow/backend-nodejs:latest .
docker run -p 5000:5000 \
  -e DATABASE_URL=postgresql://postgres:postgres@host.docker.internal:5432/fourinrow \
  fourinrow/backend-nodejs:latest
```

#### Build Go Backend
```bash
cd backend-go
docker build -t fourinrow/backend-go:latest .
docker run -p 8080:8080 \
  -e DATABASE_URL=postgresql://postgres:postgres@host.docker.internal:5432/fourinrow \
  fourinrow/backend-go:latest
```

#### Build Frontend
```bash
cd frontend
docker build -t fourinrow/frontend:latest .
docker run -p 80:80 fourinrow/frontend:latest
```

### Switching Between Backends

To use the Go backend instead of Node.js:

1. Edit `docker-compose.yml`
2. Comment out the `backend-nodejs` service
3. Uncomment the `backend-go` service
4. Update the frontend nginx config to proxy to `backend-go:8080`
5. Restart: `docker-compose up --build`

### Docker Environment Variables

Set these in `docker-compose.yml` or pass via `-e`:

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 5000 (Node) / 8080 (Go) | Server port |
| `NODE_ENV` | production | Node environment |
| `DATABASE_URL` | - | PostgreSQL connection string |
| `KAFKA_ENABLED` | false | Enable Kafka events |
| `KAFKA_BROKER` | localhost:9092 | Kafka broker address |
| `MATCHMAKING_TIMEOUT` | 10000 | Bot pairing timeout (ms) |
| `RECONNECTION_TIMEOUT` | 30000 | Reconnection window (ms) |

### Docker Compose Commands

```bash
# Start services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Rebuild and start
docker-compose up --build

# Remove volumes (resets database)
docker-compose down -v
```

---

## ☸️ Kubernetes Deployment

### Prerequisites

- Kubernetes cluster (1.20+)
- kubectl configured
- Container registry (Docker Hub, GCR, ECR, etc.)

### Setup Steps

#### 1. Build and Push Images

```bash
# Build images
docker build -t your-registry/fourinrow-backend-nodejs:v1.0 ./backend-nodejs
docker build -t your-registry/fourinrow-backend-go:v1.0 ./backend-go
docker build -t your-registry/fourinrow-frontend:v1.0 ./frontend

# Push to registry
docker push your-registry/fourinrow-backend-nodejs:v1.0
docker push your-registry/fourinrow-backend-go:v1.0
docker push your-registry/fourinrow-frontend:v1.0
```

#### 2. Update Kubernetes Manifests

Update image references in deployment files:
```yaml
# k8s/backend-nodejs-deployment.yaml
image: your-registry/fourinrow-backend-nodejs:v1.0

# k8s/backend-go-deployment.yaml
image: your-registry/fourinrow-backend-go:v1.0

# k8s/frontend-deployment.yaml
image: your-registry/fourinrow-frontend:v1.0
```

#### 3. Create Namespace and Secrets

```bash
# Create namespace
kubectl apply -f k8s/namespace.yaml

# Create database password secret
kubectl create secret generic postgres-secret \
  --from-literal=password=YOUR_SECURE_PASSWORD \
  --namespace=fourinrow
```

#### 4. Deploy Infrastructure

```bash
# Deploy ConfigMap
kubectl apply -f k8s/configmap.yaml

# Deploy PostgreSQL
kubectl apply -f k8s/postgres-deployment.yaml

# Deploy Kafka (optional)
kubectl apply -f k8s/kafka-deployment.yaml

# Wait for database to be ready
kubectl wait --for=condition=ready pod \
  -l app=postgres \
  --namespace=fourinrow \
  --timeout=300s
```

#### 5. Deploy Application

```bash
# Deploy Node.js backend (default)
kubectl apply -f k8s/backend-nodejs-deployment.yaml

# OR deploy Go backend (alternative)
kubectl apply -f k8s/backend-go-deployment.yaml

# Deploy frontend
kubectl apply -f k8s/frontend-deployment.yaml

# Deploy ingress
kubectl apply -f k8s/ingress.yaml

# Deploy autoscalers
kubectl apply -f k8s/hpa.yaml
```

#### 6. Verify Deployment

```bash
# Check all resources
kubectl get all -n fourinrow

# Check pod status
kubectl get pods -n fourinrow

# View logs
kubectl logs -f deployment/backend-nodejs -n fourinrow

# Access application
kubectl port-forward service/frontend-service 8080:80 -n fourinrow
# Visit http://localhost:8080
```

### Kubernetes Architecture

```
┌─────────────────────────────────────────┐
│           Load Balancer / Ingress        │
└─────────────────┬───────────────────────┘
                  │
        ┌─────────┴─────────┐
        │                   │
   ┌────▼─────┐      ┌─────▼──────┐
   │ Frontend │      │  Backend   │
   │ (nginx)  │      │ (Node/Go)  │
   │  Pods    │      │   Pods     │
   └──────────┘      └─────┬──────┘
                            │
                ┌───────────┴────────────┐
                │                        │
         ┌──────▼──────┐          ┌─────▼─────┐
         │  PostgreSQL │          │   Kafka   │
         │     Pod     │          │   Pods    │
         └─────────────┘          └───────────┘
```

### Scaling

#### Manual Scaling
```bash
# Scale backend
kubectl scale deployment backend-nodejs --replicas=5 -n fourinrow

# Scale frontend
kubectl scale deployment frontend --replicas=3 -n fourinrow
```

#### Auto-scaling (HPA)
The HPA manifests automatically scale based on:
- CPU usage (70% threshold)
- Memory usage (80% threshold)

```bash
# View autoscaler status
kubectl get hpa -n fourinrow

# Describe autoscaler
kubectl describe hpa backend-nodejs-hpa -n fourinrow
```

### Updating Deployments

#### Rolling Update
```bash
# Build new image
docker build -t your-registry/fourinrow-backend-nodejs:v1.1 ./backend-nodejs
docker push your-registry/fourinrow-backend-nodejs:v1.1

# Update deployment
kubectl set image deployment/backend-nodejs \
  backend-nodejs=your-registry/fourinrow-backend-nodejs:v1.1 \
  -n fourinrow

# Monitor rollout
kubectl rollout status deployment/backend-nodejs -n fourinrow
```

#### Rollback
```bash
# Rollback to previous version
kubectl rollout undo deployment/backend-nodejs -n fourinrow

# Rollback to specific revision
kubectl rollout undo deployment/backend-nodejs --to-revision=2 -n fourinrow
```

### Ingress & TLS

The ingress configuration supports HTTPS with cert-manager:

1. **Install cert-manager**:
```bash
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.yaml
```

2. **Create ClusterIssuer**:
```yaml
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: your-email@example.com
    privateKeySecretRef:
      name: letsencrypt-prod
    solvers:
    - http01:
        ingress:
          class: nginx
```

3. **Update ingress hostname** in `k8s/ingress.yaml` with your domain

### Monitoring

#### View Logs
```bash
# All pods
kubectl logs -f -l app=backend-nodejs -n fourinrow

# Specific pod
kubectl logs -f pod/backend-nodejs-xxx -n fourinrow

# Previous pod (if crashed)
kubectl logs --previous pod/backend-nodejs-xxx -n fourinrow
```

#### Resource Usage
```bash
# Pod metrics
kubectl top pods -n fourinrow

# Node metrics
kubectl top nodes
```

#### Health Checks
```bash
# Check endpoint health
kubectl exec -it deployment/backend-nodejs -n fourinrow -- \
  curl http://localhost:5000/api/health
```

---

## 🏭 Production Considerations

### Security

1. **Secrets Management**
   - Never commit secrets to git
   - Use Kubernetes Secrets or external secret managers (AWS Secrets Manager, HashiCorp Vault)
   - Rotate database passwords regularly

2. **Network Policies**
```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: backend-network-policy
  namespace: fourinrow
spec:
  podSelector:
    matchLabels:
      app: backend-nodejs
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - podSelector:
        matchLabels:
          app: frontend
  egress:
  - to:
    - podSelector:
        matchLabels:
          app: postgres
```

3. **Resource Limits**
   - Set appropriate CPU/memory limits
   - Prevent resource starvation
   - Enable Pod Priority Classes

4. **Image Security**
   - Scan images for vulnerabilities
   - Use minimal base images (alpine)
   - Run as non-root user

### High Availability

1. **Multi-zone Deployment**
```bash
kubectl label nodes node1 zone=us-east-1a
kubectl label nodes node2 zone=us-east-1b

# Update deployment with pod anti-affinity
```

2. **Database Replication**
   - Use managed PostgreSQL (RDS, Cloud SQL)
   - Set up read replicas
   - Configure backup schedules

3. **Redis for Session Management** (optional)
   - Add Redis for distributed sessions
   - Enable WebSocket sticky sessions

### Monitoring & Logging

1. **Prometheus + Grafana**
```bash
# Install Prometheus
helm install prometheus prometheus-community/kube-prometheus-stack -n monitoring

# Create ServiceMonitor
kubectl apply -f k8s/servicemonitor.yaml
```

2. **ELK Stack / Loki**
   - Centralized logging
   - Log aggregation
   - Search and analytics

3. **Application Metrics**
   - Expose custom metrics endpoint
   - Track game events, player count, etc.

### Backup Strategy

1. **Database Backups**
```bash
# PostgreSQL backup
kubectl exec -it deployment/postgres -n fourinrow -- \
  pg_dump -U postgres fourinrow > backup-$(date +%Y%m%d).sql
```

2. **Persistent Volume Snapshots**
   - Use cloud provider snapshot features
   - Schedule automated backups
   - Test restore procedures

### Cost Optimization

1. **Right-size Resources**
   - Monitor actual usage
   - Adjust requests/limits
   - Use vertical pod autoscaler

2. **Spot/Preemptible Instances**
   - Use for stateless workloads
   - Configure pod disruption budgets

3. **Auto-scaling**
   - Scale down during low traffic
   - Use cluster autoscaler

---

## 📊 Monitoring & Scaling

### Metrics to Monitor

- **Application**: Request rate, error rate, latency, active games
- **WebSocket**: Connection count, message rate, reconnections
- **Database**: Query performance, connection pool, storage usage
- **Infrastructure**: CPU, memory, network I/O, disk I/O

### Alert Rules (Example)

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: prometheus-alerts
data:
  alerts.yaml: |
    groups:
    - name: fourinrow
      rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.05
        for: 5m
        annotations:
          summary: "High error rate detected"
      
      - alert: PodCrashLooping
        expr: rate(kube_pod_container_status_restarts_total[15m]) > 0
        annotations:
          summary: "Pod is crash looping"
```

---

## 🆘 Troubleshooting

### Common Issues

1. **Pods Not Starting**
```bash
kubectl describe pod <pod-name> -n fourinrow
kubectl logs <pod-name> -n fourinrow
```

2. **Database Connection Failures**
```bash
# Check postgres service
kubectl get svc postgres-service -n fourinrow

# Test connection
kubectl exec -it deployment/backend-nodejs -n fourinrow -- \
  nc -zv postgres-service 5432
```

3. **Image Pull Errors**
```bash
# Check image pull secrets
kubectl get secrets -n fourinrow

# Create registry secret
kubectl create secret docker-registry regcred \
  --docker-server=<registry> \
  --docker-username=<username> \
  --docker-password=<password> \
  --namespace=fourinrow
```

---

## 📚 Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [Docker Compose Reference](https://docs.docker.com/compose/compose-file/)
- [Kubernetes Best Practices](https://kubernetes.io/docs/concepts/configuration/overview/)

---

**Need Help?** Open an issue on GitHub or check the project documentation.
