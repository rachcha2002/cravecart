# PowerShell script to rebuild and redeploy a single backend service

param(
    [Parameter(Mandatory=$true)]
    [string]$service
)

# Configuration
$validServices = @("user-service", "order-service", "restaurant-service", "payment-service", "notification-service", "delivery-service")
$namespace = "cravecart"

# Validate service name
if ($validServices -notcontains $service) {
    Write-Host "Invalid service name: $service" -ForegroundColor Red
    Write-Host "Valid services are: $($validServices -join ', ')" -ForegroundColor Yellow
    exit 1
}

# Get project ID from gcloud
$projectId = $(gcloud config get-value project)
$region = "us-central1"

Write-Host "Starting rebuild and redeployment of $service..." -ForegroundColor Yellow

# Ensure kubectl is using the correct context
Write-Host "Verifying kubectl context..." -ForegroundColor Yellow
kubectl config current-context

# Build and push the service image
Write-Host "Building and pushing $service..." -ForegroundColor Yellow

# Navigate to service directory
try {
    Push-Location -Path "services\$service" -ErrorAction Stop
} catch {
    Write-Host "Service directory not found!" -ForegroundColor Red
    exit 1
}

# Build the Docker image
Write-Host "Building Docker image for $service..." -ForegroundColor Green
docker build -t "gcr.io/$projectId/$service`:latest" .

# Push to Google Container Registry
Write-Host "Pushing $service image to GCR..." -ForegroundColor Green
docker push "gcr.io/$projectId/$service`:latest"

# Go back to root directory
Pop-Location

Write-Host "Successfully built and pushed $service!" -ForegroundColor Green

# Deploy to Kubernetes
Write-Host "Deploying $service to Kubernetes..." -ForegroundColor Yellow

# Create namespace if it doesn't exist
try {
    kubectl get namespace $namespace | Out-Null
} catch {
    kubectl create namespace $namespace
}

# Apply the ConfigMap
Write-Host "Applying ConfigMap for $service..." -ForegroundColor Green
kubectl apply -f "kubernetes\configmaps\$service-config.yaml"

# Apply the Deployment
Write-Host "Applying Deployment for $service..." -ForegroundColor Green
kubectl apply -f "kubernetes\deployments\$service.yaml"

# Apply the Service
Write-Host "Applying Service for $service..." -ForegroundColor Green
kubectl apply -f "kubernetes\services\$service.yaml"

# Wait for deployment to be ready
Write-Host "Waiting for deployment to be ready..." -ForegroundColor Yellow
kubectl rollout status "deployment/$service" -n $namespace

# Get service information
Write-Host "$service has been redeployed successfully!" -ForegroundColor Green
Write-Host "Service Details:" -ForegroundColor Yellow
kubectl get service $service -n $namespace

# Get pod information
Write-Host "Pod Details:" -ForegroundColor Yellow
kubectl get pods -l "app=$service" -n $namespace

Write-Host "$service rebuild and redeployment completed!" -ForegroundColor Green 