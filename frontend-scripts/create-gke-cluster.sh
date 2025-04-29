#!/bin/bash

# Exit on error
set -e

# Set variables
PROJECT_ID="cravecart-web-458310"
CLUSTER_NAME="cravecart-web-cluster"
REGION="us-central1"
ZONE="us-central1-a"
NODE_COUNT=5
MACHINE_TYPE="e2-standard-2"  # 2 vCPUs, 8GB memory
DISK_SIZE="50GB"

echo "🚀 Creating GKE cluster for CraveCart Web Portals..."
echo "Project ID: $PROJECT_ID"
echo "Cluster Name: $CLUSTER_NAME"
echo "Region: $REGION"
echo "Node Count: $NODE_COUNT"
echo "Machine Type: $MACHINE_TYPE"
echo "Disk Size: $DISK_SIZE"

# Ensure the project is set correctly
gcloud config set project $PROJECT_ID

# Enable required APIs if not already enabled
echo "🔧 Enabling required GCP APIs..."
gcloud services enable container.googleapis.com \
    compute.googleapis.com \
    gkeconnect.googleapis.com \
    gkehub.googleapis.com \
    cloudresourcemanager.googleapis.com

# Create the GKE cluster
echo "🌐 Creating Kubernetes cluster..."
gcloud container clusters create $CLUSTER_NAME \
    --project=$PROJECT_ID \
    --zone=$ZONE \
    --num-nodes=$NODE_COUNT \
    --machine-type=$MACHINE_TYPE \
    --disk-type=pd-standard \
    --disk-size=$DISK_SIZE \
    --enable-network-policy \
    --enable-ip-alias \
    --release-channel=regular \
    --tags=web-portal,cravecart \
    --enable-vertical-pod-autoscaling \
    --scopes=gke-default,compute-rw,storage-rw \
    --addons=HttpLoadBalancing,HorizontalPodAutoscaling

# Configure kubectl to use the new cluster
echo "🔄 Configuring kubectl to use the new cluster..."
gcloud container clusters get-credentials $CLUSTER_NAME --zone=$ZONE --project=$PROJECT_ID

# Create the cravecartweb namespace
echo "📦 Creating 'cravecartweb' namespace..."
kubectl create namespace cravecartweb --dry-run=client -o yaml | kubectl apply -f -

echo "✅ GKE cluster creation complete!"
echo "Cluster info:"
kubectl cluster-info
echo ""
echo "Node status:"
kubectl get nodes
echo ""
echo "📋 Next steps: Run deploy-web-portals.sh script to deploy the web applications to this cluster." 