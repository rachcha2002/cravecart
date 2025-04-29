# PowerShell script to rebuild and redeploy payment-service to GKE
# Stop on error
$ErrorActionPreference = "Stop"

Write-Host "🔄 Rebuilding payment-service..." -ForegroundColor Cyan

# Navigate to project root
$ROOT_DIR = "E:\cravecart"
Set-Location $ROOT_DIR

# Set project ID
$PROJECT_ID = "cravecart-457103"

# Build the Docker image
Write-Host "🔨 Building Docker image..." -ForegroundColor Yellow
docker build -t gcr.io/$PROJECT_ID/payment-service:latest -f services/payment-service/Dockerfile services/payment-service

# Push the image to Google Container Registry
Write-Host "⬆️ Pushing to Google Container Registry..." -ForegroundColor Yellow
docker push gcr.io/$PROJECT_ID/payment-service:latest

# Ensure the namespace exists
$NAMESPACE = "cravecart"
Write-Host "🔍 Checking if namespace $NAMESPACE exists..." -ForegroundColor Yellow
$namespaceExists = kubectl get namespace $NAMESPACE 2>$null
if (-not $namespaceExists) {
    Write-Host "📦 Creating namespace $NAMESPACE..." -ForegroundColor Green
    kubectl create namespace $NAMESPACE
}

# Update the Kubernetes deployment
Write-Host "🚀 Redeploying to Kubernetes..." -ForegroundColor Green
$deploymentExists = $true
try {
    kubectl rollout restart deployment payment-service -n $NAMESPACE
} catch {
    $deploymentExists = $false
    Write-Host "⚠️ Deployment not found. Creating the deployment..." -ForegroundColor Yellow
    
    # Check if the deployment yaml exists
    if (Test-Path "kubernetes\deployments\payment-service.yaml") {
        kubectl apply -f kubernetes\deployments\payment-service.yaml
    } else {
        Write-Host "❌ Deployment YAML file not found. Please create kubernetes\deployments\payment-service.yaml first." -ForegroundColor Red
        exit 1
    }
}

if ($deploymentExists) {
    kubectl rollout status deployment payment-service -n $NAMESPACE --timeout=180s
}

Write-Host "✅ payment-service rebuild and deployment complete!" -ForegroundColor Green
Write-Host "📊 Check status with: kubectl get pods -n $NAMESPACE -l app=payment-service" -ForegroundColor Cyan 