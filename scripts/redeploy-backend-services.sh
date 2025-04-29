#!/bin/bash

set -e

# Colors for terminal output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ID=$(gcloud config get-value project)
REGION="us-central1"
SERVICES=("user-service" "order-service" "restaurant-service" "payment-service" "notification-service" "delivery-service")
NAMESPACE="cravecart"

echo -e "${YELLOW}Starting rebuild and redeployment of all backend services...${NC}"

# Ensure kubectl is using the correct context
echo -e "${YELLOW}Verifying kubectl context...${NC}"
kubectl config current-context

# Function to build and push a service
build_and_push() {
  local service=$1
  echo -e "${YELLOW}Building and pushing $service...${NC}"
  
  # Navigate to service directory
  cd services/$service
  
  # Build the Docker image
  echo -e "${GREEN}Building Docker image for $service...${NC}"
  docker build -t gcr.io/$PROJECT_ID/$service:latest .
  
  # Push to Google Container Registry
  echo -e "${GREEN}Pushing $service image to GCR...${NC}"
  docker push gcr.io/$PROJECT_ID/$service:latest
  
  # Go back to root directory
  cd ../..
  
  echo -e "${GREEN}Successfully built and pushed $service!${NC}"
}

# Function to deploy a service
deploy_service() {
  local service=$1
  echo -e "${YELLOW}Deploying $service to Kubernetes...${NC}"
  
  # Apply the ConfigMap
  echo -e "${GREEN}Applying ConfigMap for $service...${NC}"
  kubectl apply -f kubernetes/configmaps/$service-config.yaml
  
  # Apply the Deployment
  echo -e "${GREEN}Applying Deployment for $service...${NC}"
  kubectl apply -f kubernetes/deployments/$service.yaml
  
  # Apply the Service
  echo -e "${GREEN}Applying Service for $service...${NC}"
  kubectl apply -f kubernetes/services/$service.yaml
  
  echo -e "${GREEN}Successfully deployed $service!${NC}"
}

# Main execution

# Create namespace if it doesn't exist
kubectl get namespace $NAMESPACE > /dev/null 2>&1 || kubectl create namespace $NAMESPACE

# Process each service
for service in "${SERVICES[@]}"; do
  echo -e "${YELLOW}Processing $service...${NC}"
  
  # Build and push Docker image
  build_and_push $service
  
  # Deploy to Kubernetes
  deploy_service $service
  
  echo -e "${GREEN}Completed processing for $service!${NC}"
done

# Wait for deployments to be ready
echo -e "${YELLOW}Waiting for all deployments to be ready...${NC}"
for service in "${SERVICES[@]}"; do
  kubectl rollout status deployment/$service -n $NAMESPACE
done

# Get all services
echo -e "${GREEN}All services have been redeployed successfully!${NC}"
echo -e "${YELLOW}Current Services:${NC}"
kubectl get services -n $NAMESPACE

# Get all pods
echo -e "${YELLOW}Current Pods:${NC}"
kubectl get pods -n $NAMESPACE

echo -e "${GREEN}Backend services rebuild and redeployment completed!${NC}" 