#!/bin/bash

# Exit on error
set -e

echo "🔄 Rebuilding payment-service..."

# Navigate to project root (assuming script is run from anywhere)
ROOT_DIR=$(git rev-parse --show-toplevel 2>/dev/null || echo "/e/cravecart")
cd "$ROOT_DIR"

# Set project ID
PROJECT_ID="cravecart-457103"

# Build the Docker image
echo "🔨 Building Docker image..."
docker build -t gcr.io/$PROJECT_ID/payment-service:latest -f services/payment-service/Dockerfile services/payment-service

# Push the image to Google Container Registry
echo "⬆️ Pushing to Google Container Registry..."
docker push gcr.io/$PROJECT_ID/payment-service:latest

# Ensure the namespace exists
NAMESPACE="cravecart"
echo "🔍 Checking if namespace $NAMESPACE exists..."
if ! kubectl get namespace $NAMESPACE &> /dev/null; then
  echo "📦 Creating namespace $NAMESPACE..."
  kubectl create namespace $NAMESPACE
fi

# Update the Kubernetes deployment
echo "🚀 Redeploying to Kubernetes..."
kubectl rollout restart deployment payment-service -n $NAMESPACE || {
  echo "⚠️ Deployment not found. Creating the deployment..."
  
  # Check if the deployment yaml exists
  if [ -f "kubernetes/deployments/payment-service.yaml" ]; then
    kubectl apply -f kubernetes/deployments/payment-service.yaml
  else
    echo "❌ Deployment YAML file not found. Please create kubernetes/deployments/payment-service.yaml first."
    exit 1
  fi
}

kubectl rollout status deployment payment-service -n $NAMESPACE --timeout=180s

echo "✅ payment-service rebuild and deployment complete!"
echo "📊 Check status with: kubectl get pods -n $NAMESPACE -l app=payment-service" 