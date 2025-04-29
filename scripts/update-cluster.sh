#!/bin/bash

# Script to update GKE cluster settings for CraveCart
# This script fixes autoscaling issues and removes any orphaned order-service resources
#
# Usage: bash update-cluster.sh

# Set your Google Cloud project ID
PROJECT_ID="cravecart-457103"
CLUSTER_NAME="cravecart-cluster"
CLUSTER_ZONE="us-central1-a"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Step 1: Check if required tools are installed
echo -e "${YELLOW}[INFO]${NC} Checking required tools..."

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

# Step 5: Update cluster node pool settings - Remove autoscaling, set fixed node count
echo -e "${YELLOW}[INFO]${NC} Updating cluster node pool settings to fixed node count..."
gcloud container clusters update $CLUSTER_NAME \
  --zone $CLUSTER_ZONE \
  --no-enable-autoscaling \
  --node-pool default-pool

if [ $? -ne 0 ]; then
  echo -e "${RED}[ERROR]${NC} Failed to update cluster autoscaling settings. Check the error message above."
  exit 1
else
  echo -e "${GREEN}[SUCCESS]${NC} Cluster autoscaling disabled successfully."
fi

# Step 6: Resize node pool to fixed size
echo -e "${YELLOW}[INFO]${NC} Resizing node pool to 8 nodes..."
gcloud container clusters resize $CLUSTER_NAME \
  --zone $CLUSTER_ZONE \
  --node-pool default-pool \
  --num-nodes 8 \
  --quiet

if [ $? -ne 0 ]; then
  echo -e "${RED}[ERROR]${NC} Failed to resize cluster. Check the error message above."
  exit 1
else
  echo -e "${GREEN}[SUCCESS]${NC} Cluster resized to 8 nodes successfully."
fi

# Step 7: Update resource allocations for deployments
echo -e "${YELLOW}[INFO]${NC} Updating resource allocations for deployments..."

# Define new resource settings
CPU_LIMITS="2.0"
CPU_REQUESTS="1.0"
MEMORY_LIMITS="4096Mi"
MEMORY_REQUESTS="2048Mi"

# Get all deployments except order-service
DEPLOYMENTS=$(kubectl get deployments -n cravecart --no-headers | grep -v "order-service" | awk '{print $1}')

for DEPLOY in $DEPLOYMENTS; do
  echo -e "${YELLOW}[INFO]${NC} Updating resources for deployment $DEPLOY..."
  
  # Update CPU and memory limits and requests
  kubectl patch deployment $DEPLOY -n cravecart --type='json' -p="[
    {\"op\": \"replace\", \"path\": \"/spec/template/spec/containers/0/resources/limits/cpu\", \"value\": \"$CPU_LIMITS\"},
    {\"op\": \"replace\", \"path\": \"/spec/template/spec/containers/0/resources/requests/cpu\", \"value\": \"$CPU_REQUESTS\"},
    {\"op\": \"replace\", \"path\": \"/spec/template/spec/containers/0/resources/limits/memory\", \"value\": \"$MEMORY_LIMITS\"},
    {\"op\": \"replace\", \"path\": \"/spec/template/spec/containers/0/resources/requests/memory\", \"value\": \"$MEMORY_REQUESTS\"}
  ]"
  
  if [ $? -ne 0 ]; then
    echo -e "${RED}[ERROR]${NC} Failed to update resources for deployment $DEPLOY."
  else
    echo -e "${GREEN}[SUCCESS]${NC} Updated resources for deployment $DEPLOY."
  fi
done

# Step 8: Clean up order-service resources
echo -e "${YELLOW}[INFO]${NC} Checking for any orphaned order-service resources..."

# Check for order-service pods
ORDER_SERVICE_PODS=$(kubectl get pods --all-namespaces -l app=order-service -o jsonpath='{.items[*].metadata.name}')
if [ -n "$ORDER_SERVICE_PODS" ]; then
  echo -e "${YELLOW}[INFO]${NC} Found orphaned order-service pods. Deleting them..."
  kubectl delete pods --all-namespaces -l app=order-service
  echo -e "${GREEN}[SUCCESS]${NC} Deleted orphaned order-service pods."
else
  echo -e "${GREEN}[INFO]${NC} No orphaned order-service pods found."
fi

# Check for order-service deployment
if kubectl get deployment order-service -n cravecart &> /dev/null; then
  echo -e "${YELLOW}[INFO]${NC} Found order-service deployment. Deleting it..."
  kubectl delete deployment order-service -n cravecart
  echo -e "${GREEN}[SUCCESS]${NC} Deleted order-service deployment."
else
  echo -e "${GREEN}[INFO]${NC} No order-service deployment found."
fi

# Check for order-service service
if kubectl get service order-service -n cravecart &> /dev/null; then
  echo -e "${YELLOW}[INFO]${NC} Found order-service service. Deleting it..."
  kubectl delete service order-service -n cravecart
  echo -e "${GREEN}[SUCCESS]${NC} Deleted order-service service."
else
  echo -e "${GREEN}[INFO]${NC} No order-service service found."
fi

# Check for order-service configmap
if kubectl get configmap order-service-config -n cravecart &> /dev/null; then
  echo -e "${YELLOW}[INFO]${NC} Found order-service configmap. Deleting it..."
  kubectl delete configmap order-service-config -n cravecart
  echo -e "${GREEN}[SUCCESS]${NC} Deleted order-service configmap."
else
  echo -e "${GREEN}[INFO]${NC} No order-service configmap found."
fi

# Step 9: Check cluster status and scaling issues
echo -e "${YELLOW}[INFO]${NC} Checking cluster status..."
kubectl get nodes
echo ""
kubectl get pods --all-namespaces

echo -e "\n${GREEN}[SUCCESS]${NC} Cluster update completed!"
echo -e "${YELLOW}[INFO]${NC} The cluster has been configured with a fixed node count of 8 nodes."
echo -e "${YELLOW}[INFO]${NC} Resources per service have been increased to: $CPU_REQUESTS CPU requests, $CPU_LIMITS CPU limits, $MEMORY_REQUESTS memory requests, $MEMORY_LIMITS memory limits."
echo -e "${YELLOW}[INFO]${NC} The 'Pod is blocking scale down because its controller can't be found' warning should be resolved now."
echo -e "${YELLOW}[INFO]${NC} The 'Can't scale down when node group size has exceeded minimum size limit' warning is no longer applicable since autoscaling has been disabled." 