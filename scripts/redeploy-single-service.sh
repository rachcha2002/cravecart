#!/bin/bash

set -e

# Check if a service name was provided
if [ $# -eq 0 ]; then
  echo "Please provide a service name (e.g., user-service, order-service)"
  echo "Usage: $0 <service-name>"
  exit 1
fi

SERVICE=$1

# Colors for terminal output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ID=$(gcloud config get-value project)
REGION="us-central1"
NAMESPACE="cravecart"

# Validate service name
VALID_SERVICES=("user-service" "order-service" "restaurant-service" "payment-service" "notification-service" "delivery-service")
VALID=0
for valid_service in "${VALID_SERVICES[@]}"; do
  if [ "$SERVICE" == "$valid_service" ]; then
    VALID=1
    break
  fi
done

if [ $VALID -eq 0 ]; then
  echo -e "${RED}Invalid service name: $SERVICE${NC}"
  echo -e "Valid services are: ${YELLOW}${VALID_SERVICES[*]}${NC}"
  exit 1
fi

echo -e "${YELLOW}Starting rebuild and redeployment of $SERVICE...${NC}"

# Ensure kubectl is using the correct context
echo -e "${YELLOW}Verifying kubectl context...${NC}"
kubectl config current-context

# Build and push the service image
echo -e "${YELLOW}Building and pushing $SERVICE...${NC}"

# Navigate to service directory
cd services/$SERVICE || { echo -e "${RED}Service directory not found!${NC}"; exit 1; }

# Build the Docker image
echo -e "${GREEN}Building Docker image for $SERVICE...${NC}"
docker build -t gcr.io/$PROJECT_ID/$SERVICE:latest .

# Push to Google Container Registry
echo -e "${GREEN}Pushing $SERVICE image to GCR...${NC}"
docker push gcr.io/$PROJECT_ID/$SERVICE:latest

# Go back to root directory
cd ../..

echo -e "${GREEN}Successfully built and pushed $SERVICE!${NC}"

# Deploy to Kubernetes
echo -e "${YELLOW}Deploying $SERVICE to Kubernetes...${NC}"

# Create namespace if it doesn't exist
kubectl get namespace $NAMESPACE > /dev/null 2>&1 || kubectl create namespace $NAMESPACE

# Apply the ConfigMap
echo -e "${GREEN}Applying ConfigMap for $SERVICE...${NC}"
kubectl apply -f kubernetes/configmaps/$SERVICE-config.yaml

# Apply the Deployment
echo -e "${GREEN}Applying Deployment for $SERVICE...${NC}"
kubectl apply -f kubernetes/deployments/$SERVICE.yaml

# Apply the Service
echo -e "${GREEN}Applying Service for $SERVICE...${NC}"
kubectl apply -f kubernetes/services/$SERVICE.yaml

# Wait for deployment to be ready
echo -e "${YELLOW}Waiting for deployment to be ready...${NC}"
kubectl rollout status deployment/$SERVICE -n $NAMESPACE

# Get service information
echo -e "${GREEN}$SERVICE has been redeployed successfully!${NC}"
echo -e "${YELLOW}Service Details:${NC}"
kubectl get service $SERVICE -n $NAMESPACE

# Get pod information
echo -e "${YELLOW}Pod Details:${NC}"
kubectl get pods -l app=$SERVICE -n $NAMESPACE

echo -e "${GREEN}$SERVICE rebuild and redeployment completed!${NC}" 