# PowerShell script to rebuild and redeploy all backend services

# Configuration
$services = @("user-service", "order-service", "restaurant-service", "payment-service", "notification-service", "delivery-service")
$namespace = "cravecart"

# Get project ID from gcloud
$projectId = $(gcloud config get-value project)
$region = "us-central1"

Write-Host "Starting rebuild and redeployment of all backend services..." -ForegroundColor Yellow

# Ensure kubectl is using the correct context
Write-Host "Verifying kubectl context..." -ForegroundColor Yellow
kubectl config current-context

# Function to build and push a service
function Build-And-Push {
    param (
        [string]$service
    )
    
    Write-Host "Building and pushing $service..." -ForegroundColor Yellow
    
    # Navigate to service directory
    Push-Location -Path "services\$service"
    
    # Build the Docker image
    Write-Host "Building Docker image for $service..." -ForegroundColor Green
    docker build -t "gcr.io/$projectId/$service`:latest" .
    
    # Push to Google Container Registry
    Write-Host "Pushing $service image to GCR..." -ForegroundColor Green
    docker push "gcr.io/$projectId/$service`:latest"
    
    # Go back to root directory
    Pop-Location
    
    Write-Host "Successfully built and pushed $service!" -ForegroundColor Green
}

# Function to deploy a service
function Deploy-Service {
    param (
        [string]$service
    )
    
    Write-Host "Deploying $service to Kubernetes..." -ForegroundColor Yellow
    
    # Apply the ConfigMap
    Write-Host "Applying ConfigMap for $service..." -ForegroundColor Green
    kubectl apply -f "kubernetes\configmaps\$service-config.yaml"
    
    # Apply the Deployment
    Write-Host "Applying Deployment for $service..." -ForegroundColor Green
    kubectl apply -f "kubernetes\deployments\$service.yaml"
    
    # Apply the Service
    Write-Host "Applying Service for $service..." -ForegroundColor Green
    kubectl apply -f "kubernetes\services\$service.yaml"
    
    Write-Host "Successfully deployed $service!" -ForegroundColor Green
}

# Main execution

# Create namespace if it doesn't exist
try {
    kubectl get namespace $namespace | Out-Null
} catch {
    kubectl create namespace $namespace
}

# Process each service
foreach ($service in $services) {
    Write-Host "Processing $service..." -ForegroundColor Yellow
    
    # Build and push Docker image
    Build-And-Push -service $service
    
    # Deploy to Kubernetes
    Deploy-Service -service $service
    
    Write-Host "Completed processing for $service!" -ForegroundColor Green
}

# Wait for deployments to be ready
Write-Host "Waiting for all deployments to be ready..." -ForegroundColor Yellow
foreach ($service in $services) {
    kubectl rollout status "deployment/$service" -n $namespace
}

# Get all services
Write-Host "All services have been redeployed successfully!" -ForegroundColor Green
Write-Host "Current Services:" -ForegroundColor Yellow
kubectl get services -n $namespace

# Get all pods
Write-Host "Current Pods:" -ForegroundColor Yellow
kubectl get pods -n $namespace

Write-Host "Backend services rebuild and redeployment completed!" -ForegroundColor Green 