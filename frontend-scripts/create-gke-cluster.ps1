# PowerShell script to create GKE cluster for CraveCart Web Portals
# Stop on error
$ErrorActionPreference = "Stop"

# Set variables
$PROJECT_ID = "cravecart-web-458310"
$CLUSTER_NAME = "cravecart-web-cluster"
$REGION = "us-central1"
$ZONE = "us-central1-a"
$NODE_COUNT = 5
$MACHINE_TYPE = "e2-standard-2"  # 2 vCPUs, 8GB memory
$DISK_SIZE = "50GB"  # Changed from 100GB to 50GB

Write-Host "🚀 Creating GKE cluster for CraveCart Web Portals..." -ForegroundColor Cyan
Write-Host "Project ID: $PROJECT_ID"
Write-Host "Cluster Name: $CLUSTER_NAME"
Write-Host "Region: $REGION"
Write-Host "Node Count: $NODE_COUNT"
Write-Host "Machine Type: $MACHINE_TYPE"
Write-Host "Disk Size: $DISK_SIZE"

# Ensure the project is set correctly
Write-Host "⚙️ Setting project to $PROJECT_ID..." -ForegroundColor Yellow
gcloud config set project $PROJECT_ID

# Enable required APIs if not already enabled
Write-Host "🔧 Enabling required GCP APIs..." -ForegroundColor Yellow
gcloud services enable container.googleapis.com `
    compute.googleapis.com `
    gkeconnect.googleapis.com `
    gkehub.googleapis.com `
    cloudresourcemanager.googleapis.com

# Create the GKE cluster
Write-Host "🌐 Creating Kubernetes cluster..." -ForegroundColor Green
gcloud container clusters create $CLUSTER_NAME `
    --project=$PROJECT_ID `
    --zone=$ZONE `
    --num-nodes=$NODE_COUNT `
    --machine-type=$MACHINE_TYPE `
    --disk-type=pd-standard `
    --disk-size=$DISK_SIZE `
    --enable-network-policy `
    --enable-ip-alias `
    --release-channel=regular `
    --tags=web-portal,cravecart `
    --enable-vertical-pod-autoscaling `
    --scopes=gke-default,compute-rw,storage-rw `
    --addons=HttpLoadBalancing,HorizontalPodAutoscaling

# Configure kubectl to use the new cluster
Write-Host "🔄 Configuring kubectl to use the new cluster..." -ForegroundColor Yellow
gcloud container clusters get-credentials $CLUSTER_NAME --zone=$ZONE --project=$PROJECT_ID

# Create the cravecartweb namespace
Write-Host "📦 Creating 'cravecartweb' namespace..." -ForegroundColor Yellow
kubectl create namespace cravecartweb --dry-run=client -o yaml | kubectl apply -f -

Write-Host "✅ GKE cluster creation complete!" -ForegroundColor Green
Write-Host "Cluster info:" -ForegroundColor Cyan
kubectl cluster-info
Write-Host ""
Write-Host "Node status:" -ForegroundColor Cyan
kubectl get nodes
Write-Host ""
Write-Host "📋 Next steps: Run deploy-web-portals.ps1 script to deploy the web applications to this cluster." -ForegroundColor Cyan 