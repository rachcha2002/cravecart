#!/bin/bash

# Exit on error
set -e

echo "🔄 Building and deploying web portals to GKE..."

# Navigate to project root
ROOT_DIR=$(git rev-parse --show-toplevel 2>/dev/null || echo "/e/cravecart")
cd "$ROOT_DIR"

# Create namespace if it doesn't exist
echo "🌐 Creating namespace cravecartweb if it doesn't exist..."
kubectl apply -f kubernetes/namespace/cravecartweb.yaml

# Function to build and deploy a web portal
build_and_deploy() {
  local portal=$1
  echo "🔨 Building $portal..."
  
  # Navigate to portal directory
  cd "$ROOT_DIR/web/$portal"
  
  # Build Docker image
  docker build -t gcr.io/cravecart-web-458310/$portal:latest .
  
  # Push to Google Container Registry
  echo "⬆️ Pushing $portal image to GCR..."
  docker push gcr.io/cravecart-web-458310/$portal:latest
  
  # Deploy ConfigMap and Deployment
  echo "🚀 Deploying $portal..."
  kubectl apply -f "$ROOT_DIR/kubernetes/configmaps/$portal-config.yaml"
  kubectl apply -f "$ROOT_DIR/kubernetes/deployments/$portal.yaml"
}

# Deploy ConfigMaps
echo "📋 Applying ConfigMaps..."
kubectl apply -f kubernetes/configmaps/customer-portal-config.yaml
kubectl apply -f kubernetes/configmaps/restaurant-portal-config.yaml
kubectl apply -f kubernetes/configmaps/admin-portal-config.yaml

# Build and deploy each portal
build_and_deploy "customer-portal"
build_and_deploy "restaurant-portal" 
build_and_deploy "admin-portal"

# Wait for services to be assigned external IPs
echo "⏳ Waiting for LoadBalancer services to get external IPs..."
kubectl wait --namespace cravecartweb \
  --for=condition=available \
  --timeout=300s \
  deployments --all

echo "✅ All web portals deployed successfully!"
echo ""
echo "📊 External access points:"
echo "Customer Portal: $(kubectl get svc -n cravecartweb customer-portal -o jsonpath='{.status.loadBalancer.ingress[0].ip}')"
echo "Restaurant Portal: $(kubectl get svc -n cravecartweb restaurant-portal -o jsonpath='{.status.loadBalancer.ingress[0].ip}')"
echo "Admin Portal: $(kubectl get svc -n cravecartweb admin-portal -o jsonpath='{.status.loadBalancer.ingress[0].ip}')" 