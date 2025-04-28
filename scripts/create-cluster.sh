#!/bin/bash

# Script to create a Google Kubernetes Engine (GKE) cluster for CraveCart
# Usage: bash create-cluster.sh [node-count]

# Set your Google Cloud project ID and cluster configuration
PROJECT_ID="cravecart-457103"
CLUSTER_NAME="cravecart-cluster"
CLUSTER_ZONE="us-central1-a"  # Regional cluster in us-central1
MACHINE_TYPE="e2-standard-2"  # 2 vCPUs, 8GB memory (reduced from 4 vCPUs)

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Get node count from args or use default - reduced to fit quota
NODE_COUNT=${1:-5}
echo -e "${YELLOW}[INFO]${NC} Will create cluster with $NODE_COUNT nodes"

# Step 1: Check if required tools are installed
echo -e "${YELLOW}[INFO]${NC} Checking required tools..."

if ! command -v gcloud &> /dev/null; then
  echo -e "${RED}[ERROR]${NC} gcloud not found. Please install Google Cloud SDK first."
  exit 1
fi

# Step 2: Ensure authenticated with gcloud
echo -e "${YELLOW}[INFO]${NC} Checking authentication..."
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" &> /dev/null; then
  echo -e "${RED}[ERROR]${NC} Not authenticated with Google Cloud. Please run 'gcloud auth login' first."
  exit 1
fi

# Step 3: Set the current project
echo -e "${YELLOW}[INFO]${NC} Setting Google Cloud project to $PROJECT_ID..."
gcloud config set project $PROJECT_ID

# Step 4: Enable required APIs
echo -e "${YELLOW}[INFO]${NC} Enabling required Google APIs..."
gcloud services enable container.googleapis.com \
  containerregistry.googleapis.com \
  cloudbuild.googleapis.com

# Step 5: Check if cluster already exists
if gcloud container clusters list --filter="name=$CLUSTER_NAME" --format="value(name)" | grep -q "$CLUSTER_NAME"; then
  echo -e "${YELLOW}[WARNING]${NC} Cluster $CLUSTER_NAME already exists."
  read -p "Do you want to delete and recreate it? (y/n) " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}[INFO]${NC} Deleting existing cluster $CLUSTER_NAME..."
    gcloud container clusters delete $CLUSTER_NAME --zone $CLUSTER_ZONE --quiet
  else
    echo -e "${GREEN}[INFO]${NC} Keeping existing cluster. Exiting."
    exit 0
  fi
fi

# Step 6: Create the GKE cluster
echo -e "${YELLOW}[INFO]${NC} Creating GKE cluster $CLUSTER_NAME with $NODE_COUNT nodes..."
echo -e "${YELLOW}[INFO]${NC} This will take several minutes..."

gcloud container clusters create $CLUSTER_NAME \
  --zone $CLUSTER_ZONE \
  --num-nodes $NODE_COUNT \
  --machine-type $MACHINE_TYPE \
  --disk-size "50" \
  --disk-type "pd-standard" \
  --scopes "https://www.googleapis.com/auth/cloud-platform" \
  --network "default" \
  --enable-ip-alias \
  --enable-autoscaling \
  --min-nodes 3 \
  --max-nodes 6 \
  --enable-autorepair \
  --enable-autoupgrade \
  --enable-vertical-pod-autoscaling \
  --logging=SYSTEM,WORKLOAD \
  --monitoring=SYSTEM \
  --addons HorizontalPodAutoscaling,HttpLoadBalancing

if [ $? -ne 0 ]; then
  echo -e "${RED}[ERROR]${NC} Failed to create cluster. Check the error message above."
  exit 1
fi

# Step 7: Configure kubectl to use the new cluster
echo -e "${YELLOW}[INFO]${NC} Configuring kubectl to use the new cluster..."
gcloud container clusters get-credentials $CLUSTER_NAME --zone $CLUSTER_ZONE --project $PROJECT_ID

# Step 8: Create the cravecart namespace
echo -e "${YELLOW}[INFO]${NC} Creating cravecart namespace..."
kubectl create namespace cravecart

# Step 9: Create cluster role binding for dashboard access (optional)
echo -e "${YELLOW}[INFO]${NC} Creating cluster role binding for dashboard access..."
kubectl create clusterrolebinding cluster-admin-binding \
  --clusterrole=cluster-admin \
  --user=$(gcloud config get-value core/account)

# Step 10: Display cluster information
echo -e "${GREEN}[SUCCESS]${NC} GKE cluster $CLUSTER_NAME created successfully!"
echo -e "${YELLOW}[INFO]${NC} Cluster information:"
gcloud container clusters describe $CLUSTER_NAME --zone $CLUSTER_ZONE --format="table(name, location, currentNodeCount, currentMasterVersion, status)"

echo -e "${YELLOW}[INFO]${NC} Node information:"
kubectl get nodes

echo -e "\n${GREEN}[INFO]${NC} Your Kubernetes cluster is now ready."
echo -e "${YELLOW}[INFO]${NC} To deploy CraveCart services, run: bash scripts/full-deploy.sh"
echo -e "${YELLOW}[INFO]${NC} To view the Kubernetes dashboard, run: kubectl proxy"
echo -e "${YELLOW}[INFO]${NC} Then visit: http://localhost:8001/api/v1/namespaces/kubernetes-dashboard/services/https:kubernetes-dashboard:/proxy/"

echo -e "\n${YELLOW}[NOTE]${NC} Resource configuration has been reduced to fit within quota limits."
echo -e "${YELLOW}[NOTE]${NC} If you need more resources, request quota increases at:"
echo -e "${YELLOW}[NOTE]${NC} https://console.cloud.google.com/iam-admin/quotas?project=$PROJECT_ID" 