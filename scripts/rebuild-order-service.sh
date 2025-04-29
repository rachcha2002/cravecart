#!/bin/bash

# Exit on error
set -e

echo "🔄 Rebuilding order-service..."

# Navigate to project root (assuming script is run from anywhere)
ROOT_DIR=$(git rev-parse --show-toplevel 2>/dev/null || echo "/e/cravecart")
cd "$ROOT_DIR"

# Build the Docker image
echo "🔨 Building Docker image..."
docker build -t gcr.io/cravecart-457103/order-service:latest -f services/order-service/Dockerfile services/order-service

# Push the image to Google Container Registry
echo "⬆️ Pushing to Google Container Registry..."
docker push gcr.io/cravecart-457103/order-service:latest

# Update the Kubernetes deployment
echo "🚀 Redeploying to Kubernetes..."
kubectl rollout restart deployment order-service -n cravecart
kubectl rollout status deployment order-service -n cravecart --timeout=180s

echo "✅ order-service rebuild and deployment complete!"
echo "📊 Check status with: kubectl get pods -n cravecart -l app=order-service" 