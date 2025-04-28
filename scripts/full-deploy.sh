#!/bin/bash

# Comprehensive CraveCart deployment script
# This script handles the full deployment process:
# 1. Builds all service Docker images
# 2. Pushes images to Google Container Registry
# 3. Creates a fresh namespace
# 4. Fixes and applies all Kubernetes configurations
# 5. Checks deployment status
#
# Usage: bash full-deploy.sh [namespace]

# Set your Google Cloud project ID
PROJECT_ID="cravecart-457103"
CLUSTER_NAME="cravecart-cluster"
CLUSTER_ZONE="us-central1-a"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Get namespace from args or use default
NAMESPACE=${1:-cravecart}
echo -e "${YELLOW}[INFO]${NC} Will deploy to namespace: $NAMESPACE"

# Array of service names to build and push
SERVICES=(
  "user-service"
  "order-service"
  "payment-service"
  "restaurant-service"
  "notification-service"
  "delivery-service"
)

# Resource settings for deployments
CPU_LIMITS="2.0"
CPU_REQUESTS="1.0"
MEMORY_LIMITS="3072Mi"
MEMORY_REQUESTS="1536Mi"

# Step 1: Check if required tools are installed
echo -e "${YELLOW}[INFO]${NC} Checking required tools..."

if ! command -v docker &> /dev/null; then
  echo -e "${RED}[ERROR]${NC} Docker not found. Please install Docker first."
  exit 1
fi

if ! command -v kubectl &> /dev/null; then
  echo -e "${RED}[ERROR]${NC} kubectl not found. Please install kubectl first."
  exit 1
fi

if ! command -v gcloud &> /dev/null; then
  echo -e "${RED}[ERROR]${NC} gcloud not found. Please install Google Cloud SDK first."
  exit 1
fi

# Step 2: Authenticate with Google Cloud
echo -e "${YELLOW}[INFO]${NC} Authenticating with Google Cloud..."
gcloud auth configure-docker

# Step 3: Connect to the GKE cluster
echo -e "${YELLOW}[INFO]${NC} Connecting to GKE cluster $CLUSTER_NAME..."
gcloud container clusters get-credentials $CLUSTER_NAME --zone $CLUSTER_ZONE --project $PROJECT_ID

# Step 4: Verify kubectl connection to the cluster
echo -e "${YELLOW}[INFO]${NC} Verifying connection to Kubernetes cluster..."
if ! kubectl cluster-info &> /dev/null; then
  echo -e "${RED}[ERROR]${NC} Failed to connect to Kubernetes cluster. Check your credentials and cluster status."
  exit 1
else
  echo -e "${GREEN}[SUCCESS]${NC} Successfully connected to Kubernetes cluster."
fi

# Step 5: Build and push Docker images
echo -e "${YELLOW}[INFO]${NC} Building and pushing Docker images..."

for SERVICE in "${SERVICES[@]}"; do
  echo -e "${YELLOW}[INFO]${NC} Processing $SERVICE..."
  
  # Navigate to service directory
  cd "./services/$SERVICE" || { echo -e "${RED}[ERROR]${NC} $SERVICE directory not found"; continue; }
  
  echo -e "${YELLOW}[INFO]${NC} Building Docker image for $SERVICE..."
  docker build -t "gcr.io/$PROJECT_ID/$SERVICE:latest" .
  
  if [ $? -ne 0 ]; then
    echo -e "${RED}[ERROR]${NC} Failed to build $SERVICE image"
    cd ../..
    continue
  fi
  
  echo -e "${YELLOW}[INFO]${NC} Pushing $SERVICE image to Google Container Registry..."
  docker push "gcr.io/$PROJECT_ID/$SERVICE:latest"
  
  if [ $? -ne 0 ]; then
    echo -e "${RED}[ERROR]${NC} Failed to push $SERVICE image"
    cd ../..
    continue
  fi
  
  echo -e "${GREEN}[SUCCESS]${NC} $SERVICE image built and pushed successfully"
  
  # Return to the parent directory
  cd ../..
  echo "-------------------------"
done

# Step 6: Create a fresh namespace
echo -e "${YELLOW}[INFO]${NC} Creating namespace $NAMESPACE..."
kubectl create namespace $NAMESPACE --dry-run=client -o yaml | kubectl apply -f -

# Step 7: Fix Kubernetes YAML files
echo -e "${YELLOW}[INFO]${NC} Fixing Kubernetes YAML files..."

# Fix deployment files by updating namespace and resources
for file in kubernetes/deployments/*.yaml; do
  if [ -f "$file" ]; then
    SERVICE_NAME=$(basename "$file" .yaml)
    echo -e "${YELLOW}[INFO]${NC} Fixing deployment file for $SERVICE_NAME..."
    
    # Create a temporary file
    TEMP_FILE=$(mktemp)
    
    # Replace namespace
    sed "s/namespace: cravecart/namespace: $NAMESPACE/g" "$file" > "$TEMP_FILE"
    mv "$TEMP_FILE" "$file"
    
    # Set resource limits and requests
    TEMP_FILE=$(mktemp)
    sed -E "s/(cpu: \")[0-9]\.[0-9](\")$/\1${CPU_LIMITS}\2/" "$file" > "$TEMP_FILE"
    mv "$TEMP_FILE" "$file"
    
    TEMP_FILE=$(mktemp)
    sed -E "s/(memory: \")[0-9]+Mi(\")$/\1${MEMORY_LIMITS}\2/" "$file" > "$TEMP_FILE"
    mv "$TEMP_FILE" "$file"
    
    TEMP_FILE=$(mktemp)
    sed -E "s/(cpu: \")[0-9]\.[0-9](\") *$/\1${CPU_REQUESTS}\2/" "$file" > "$TEMP_FILE"
    mv "$TEMP_FILE" "$file"
    
    TEMP_FILE=$(mktemp)
    sed -E "s/(memory: \")[0-9]+Mi(\") *$/\1${MEMORY_REQUESTS}\2/" "$file" > "$TEMP_FILE"
    mv "$TEMP_FILE" "$file"
    
    # Remove invalid namespace field from configMapRef
    TEMP_FILE=$(mktemp)
    sed -E '/configMapRef:/,/readinessProbe:/ {
      /namespace:/d
    }' "$file" > "$TEMP_FILE"
    mv "$TEMP_FILE" "$file"
    
    # Update image to use the latest tag
    TEMP_FILE=$(mktemp)
    sed -E "s|(image: gcr.io/$PROJECT_ID/$SERVICE_NAME):.*|\1:latest|" "$file" > "$TEMP_FILE"
    mv "$TEMP_FILE" "$file"
    
    # Set replicas to 1
    TEMP_FILE=$(mktemp)
    sed -E 's/(replicas: )[0-9]+/\11/' "$file" > "$TEMP_FILE"
    mv "$TEMP_FILE" "$file"
    
    echo -e "${GREEN}[SUCCESS]${NC} Fixed $SERVICE_NAME deployment file"
  fi
done

# Fix service files
for file in kubernetes/services/*.yaml; do
  if [ -f "$file" ]; then
    SERVICE_NAME=$(basename "$file" .yaml)
    echo -e "${YELLOW}[INFO]${NC} Fixing service file for $SERVICE_NAME..."
    
    # Create a temporary file
    TEMP_FILE=$(mktemp)
    
    # Replace namespace
    sed "s/namespace: cravecart/namespace: $NAMESPACE/g" "$file" > "$TEMP_FILE"
    mv "$TEMP_FILE" "$file"
    
    # Remove namespace field from ports and spec sections
    TEMP_FILE=$(mktemp)
    sed -E '/ports:/,/}/ {
      /namespace:/d
    }
    /^[[:space:]]*namespace:[[:space:]]*cravecart[[:space:]]*$/d' "$file" > "$TEMP_FILE"
    mv "$TEMP_FILE" "$file"
    
    echo -e "${GREEN}[SUCCESS]${NC} Fixed $SERVICE_NAME service file"
  fi
done

# Fix configmap files
for file in kubernetes/configmaps/*.yaml; do
  if [ -f "$file" ]; then
    CONFIG_NAME=$(basename "$file" .yaml)
    echo -e "${YELLOW}[INFO]${NC} Fixing configmap file for $CONFIG_NAME..."
    
    # Create a temporary file
    TEMP_FILE=$(mktemp)
    
    # Replace namespace
    sed "s/namespace: cravecart/namespace: $NAMESPACE/g" "$file" > "$TEMP_FILE"
    mv "$TEMP_FILE" "$file"
    
    echo -e "${GREEN}[SUCCESS]${NC} Fixed $CONFIG_NAME configmap file"
  fi
done

# Step 8: Apply ConfigMaps
echo -e "${YELLOW}[INFO]${NC} Applying ConfigMaps..."
for file in kubernetes/configmaps/*.yaml; do
  if [ -f "$file" ]; then
    echo -e "${YELLOW}[INFO]${NC} Applying $file"
    kubectl apply -f "$file"
  fi
done

# Step 9: Apply Deployments
echo -e "${YELLOW}[INFO]${NC} Applying Deployments..."
for file in kubernetes/deployments/*.yaml; do
  if [ -f "$file" ]; then
    echo -e "${YELLOW}[INFO]${NC} Applying $file"
    kubectl apply -f "$file"
    
    # Extract service name from filename for status checking later
    SERVICE_NAME=$(basename "$file" .yaml)
    SERVICES+=("$SERVICE_NAME")
  fi
done

# Step 10: Apply Services
echo -e "${YELLOW}[INFO]${NC} Applying Services..."
for file in kubernetes/services/*.yaml; do
  if [ -f "$file" ]; then
    echo -e "${YELLOW}[INFO]${NC} Applying $file"
    kubectl apply -f "$file"
  fi
done

# Step 11: Wait for deployments to start
echo -e "${YELLOW}[INFO]${NC} Waiting for deployments to start..."
sleep 30

# Step 12: Check deployment status
echo -e "${YELLOW}[INFO]${NC} Checking deployment status..."
kubectl get deployments -n $NAMESPACE

# Step 13: Wait for services to get external IPs
echo -e "${YELLOW}[INFO]${NC} Waiting for services to obtain external IPs..."
echo -e "${YELLOW}[INFO]${NC} This may take a few minutes..."
sleep 60

# Step 14: Display service information
echo -e "${GREEN}[SUCCESS]${NC} Deployment complete! Here are your service endpoints:"
kubectl get services -n $NAMESPACE

# Step 15: Check for resources that don't have minimum availability
UNAVAILABLE_DEPLOYMENTS=$(kubectl get deployments -n $NAMESPACE -o jsonpath='{.items[?(@.status.availableReplicas<@.status.replicas)].metadata.name}' 2>/dev/null)
if [ -n "$UNAVAILABLE_DEPLOYMENTS" ]; then
  echo -e "${RED}[WARNING]${NC} The following deployments don't have minimum availability:"
  for DEPLOY in $UNAVAILABLE_DEPLOYMENTS; do
    echo -e "${RED}- $DEPLOY${NC}"
    echo -e "${YELLOW}[INFO]${NC} Checking pod status for $DEPLOY:"
    kubectl get pods -n $NAMESPACE -l app=$DEPLOY
    
    # Get pod details for problematic deployments
    POD_NAME=$(kubectl get pods -n $NAMESPACE -l app=$DEPLOY -o jsonpath='{.items[0].metadata.name}' 2>/dev/null)
    if [ -n "$POD_NAME" ]; then
      echo -e "${YELLOW}[INFO]${NC} Last few log lines for pod $POD_NAME:"
      kubectl logs $POD_NAME -n $NAMESPACE --tail=20 || echo -e "${RED}[ERROR]${NC} Could not get logs"
    fi
  done
else
  echo -e "${GREEN}[SUCCESS]${NC} All deployments have reached minimum availability."
fi

echo -e "\n${GREEN}[INFO]${NC} Deployment completed successfully!"
echo -e "${YELLOW}[INFO]${NC} To check logs for a specific service, use:"
echo -e "kubectl logs -f deployment/<service-name> -n $NAMESPACE"
echo -e "Example: kubectl logs -f deployment/user-service -n $NAMESPACE"

echo -e "\n${YELLOW}[INFO]${NC} To access the services, use the external IPs shown above."
echo -e "${YELLOW}[INFO]${NC} Remember to configure your client applications to point to these new endpoints." 