#!/bin/bash
set -e

# Configuration
NAMESPACE="cravecartweb"
PROJECT_ID="cravecart-web-458310"
IMAGE_NAME="customer-portal"
DEPLOYMENT_NAME="customer-portal"
GCR_HOST="gcr.io"
TIMESTAMP=$(date +%Y%m%d%H%M%S)
TAG="v-$TIMESTAMP"
FULL_IMAGE_NAME="$GCR_HOST/$PROJECT_ID/$IMAGE_NAME:$TAG"

# Check for required tools
command -v docker >/dev/null 2>&1 || { echo "Docker is required but not installed. Aborting."; exit 1; }
command -v kubectl >/dev/null 2>&1 || { echo "kubectl is required but not installed. Aborting."; exit 1; }
command -v gcloud >/dev/null 2>&1 || { echo "gcloud is required but not installed. Aborting."; exit 1; }

echo "===> Checking gcloud authentication..."
gcloud auth print-access-token | docker login -u oauth2accesstoken --password-stdin $GCR_HOST

echo "===> Checking GCP project configuration..."
CURRENT_PROJECT=$(gcloud config get-value project)
if [ "$CURRENT_PROJECT" != "$PROJECT_ID" ]; then
  echo "Setting project to $PROJECT_ID..."
  gcloud config set project $PROJECT_ID
fi

echo "===> Checking Kubernetes cluster configuration..."
CLUSTER_NAME="cravecart-web-cluster"
CLUSTER_ZONE="us-central1-a"
echo "Configuring kubectl to use cluster $CLUSTER_NAME in zone $CLUSTER_ZONE..."
gcloud container clusters get-credentials $CLUSTER_NAME --zone $CLUSTER_ZONE --project $PROJECT_ID

echo "===> Verifying access to namespace $NAMESPACE..."
kubectl get namespace $NAMESPACE || (echo "Creating namespace $NAMESPACE..." && kubectl create namespace $NAMESPACE)

echo "===> Building Docker image for Customer Portal..."
# Navigate to project root
cd "$(dirname "$0")/.."

# Create a Dockerfile for customer-portal from template if needed
if [ ! -f "web/customer-portal/Dockerfile" ]; then
  echo "Creating Dockerfile for customer-portal from template..."
  cp Dockerfile.template web/customer-portal/Dockerfile
  # You might need to customize the Dockerfile here depending on your setup
fi

# Clean any previous build artifacts to ensure fresh build
echo "Cleaning previous build artifacts..."
if [ -d "web/customer-portal/build" ]; then
  rm -rf web/customer-portal/build
  echo "Removed old build directory"
fi

# Build the Docker image with no-cache to ensure fresh build
echo "Building $FULL_IMAGE_NAME with no cache..."
docker build --no-cache -t $FULL_IMAGE_NAME -f web/customer-portal/Dockerfile ./web/customer-portal

# Push to Google Container Registry
echo "===> Pushing image to Google Container Registry..."
docker push $FULL_IMAGE_NAME

# Create deployment configuration if it doesn't exist yet
mkdir -p kubernetes/deployments

echo "===> Creating or updating deployment configuration..."
cat > kubernetes/deployments/customer-portal.yaml << EOF
apiVersion: apps/v1
kind: Deployment
metadata:
  name: $DEPLOYMENT_NAME
  namespace: $NAMESPACE
  labels:
    app: $DEPLOYMENT_NAME
spec:
  replicas: 1
  selector:
    matchLabels:
      app: $DEPLOYMENT_NAME
  template:
    metadata:
      labels:
        app: $DEPLOYMENT_NAME
    spec:
      containers:
      - name: $DEPLOYMENT_NAME
        image: $FULL_IMAGE_NAME
        ports:
        - containerPort: 80
        resources:
          requests:
            cpu: 200m
            memory: 256Mi
          limits:
            cpu: 500m
            memory: 512Mi
        livenessProbe:
          httpGet:
            path: /
            port: 80
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /
            port: 80
          initialDelaySeconds: 10
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: $DEPLOYMENT_NAME
  namespace: $NAMESPACE
spec:
  selector:
    app: $DEPLOYMENT_NAME
  ports:
  - port: 80
    targetPort: 80
  type: LoadBalancer
EOF

echo "Created deployment configuration at kubernetes/deployments/customer-portal.yaml"

# Check if deployment exists
echo "===> Checking if deployment exists..."
if kubectl get deployment $DEPLOYMENT_NAME -n $NAMESPACE &> /dev/null; then
  # Update existing deployment
  echo "===> Updating existing Kubernetes deployment..."
  kubectl apply -f kubernetes/deployments/customer-portal.yaml
  
  # Force rolling restart to ensure changes take effect
  echo "===> Forcing rolling restart to ensure changes take effect..."
  kubectl rollout restart deployment/$DEPLOYMENT_NAME -n $NAMESPACE
else
  # Create new deployment
  echo "===> Creating new Kubernetes deployment..."
  kubectl apply -f kubernetes/deployments/customer-portal.yaml
  
  # Wait for deployment to be available
  echo "===> Waiting for deployment to be available..."
  kubectl rollout status deployment/$DEPLOYMENT_NAME -n $NAMESPACE --timeout=120s
fi

# Check deployment status
echo "===> Checking deployment status..."
kubectl rollout status deployment/$DEPLOYMENT_NAME -n $NAMESPACE

echo "===> Deployment complete!"
echo "Image: $FULL_IMAGE_NAME"
echo "Namespace: $NAMESPACE"
echo "Deployment: $DEPLOYMENT_NAME"
echo "Waiting for LoadBalancer IP assignment..."
kubectl get service $DEPLOYMENT_NAME -n $NAMESPACE -w 