# PowerShell script to build and deploy web portals to GKE

# Stop on error
$ErrorActionPreference = "Stop"

Write-Host "🔄 Building and deploying web portals to GKE..." -ForegroundColor Cyan

# Navigate to project root
$ROOT_DIR = "E:\cravecart"
Set-Location $ROOT_DIR

# Create namespace if it doesn't exist
Write-Host "🌐 Creating namespace cravecartweb if it doesn't exist..." -ForegroundColor Yellow
kubectl apply -f kubernetes/namespace/cravecartweb.yaml

# Function to build and deploy a web portal
function Build-And-Deploy {
    param (
        [string]$portal
    )
    Write-Host "🔨 Building $portal..." -ForegroundColor Yellow
    
    # Navigate to portal directory
    Set-Location "$ROOT_DIR\web\$portal"
    
    # Build Docker image
    docker build -t "gcr.io/cravecart-web-458310/$portal`:latest" .
    
    # Push to Google Container Registry
    Write-Host "⬆️ Pushing $portal image to GCR..." -ForegroundColor Yellow
    docker push "gcr.io/cravecart-web-458310/$portal`:latest"
    
    # Deploy ConfigMap and Deployment
    Write-Host "🚀 Deploying $portal..." -ForegroundColor Green
    kubectl apply -f "$ROOT_DIR\kubernetes\configmaps\$portal-config.yaml"
    kubectl apply -f "$ROOT_DIR\kubernetes\deployments\$portal.yaml"
    
    # Return to root directory
    Set-Location $ROOT_DIR
}

# Deploy ConfigMaps
Write-Host "📋 Applying ConfigMaps..." -ForegroundColor Yellow
kubectl apply -f kubernetes/configmaps/customer-portal-config.yaml
kubectl apply -f kubernetes/configmaps/restaurant-portal-config.yaml
kubectl apply -f kubernetes/configmaps/admin-portal-config.yaml

# Build and deploy each portal
Build-And-Deploy -portal "customer-portal"
Build-And-Deploy -portal "restaurant-portal"
Build-And-Deploy -portal "admin-portal"

# Wait for services to be assigned external IPs
Write-Host "⏳ Waiting for LoadBalancer services to get external IPs..." -ForegroundColor Yellow
kubectl wait --namespace cravecartweb --for=condition=available --timeout=300s deployments --all

Write-Host "✅ All web portals deployed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "📊 External access points:" -ForegroundColor Cyan
Write-Host "Customer Portal: $(kubectl get svc -n cravecartweb customer-portal -o jsonpath='{.status.loadBalancer.ingress[0].ip}')"
Write-Host "Restaurant Portal: $(kubectl get svc -n cravecartweb restaurant-portal -o jsonpath='{.status.loadBalancer.ingress[0].ip}')"
Write-Host "Admin Portal: $(kubectl get svc -n cravecartweb admin-portal -o jsonpath='{.status.loadBalancer.ingress[0].ip}')" 