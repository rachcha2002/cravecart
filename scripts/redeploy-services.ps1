# PowerShell script to recreate and redeploy all services in the cravecart namespace
# This script assumes kubectl is configured correctly to access your cluster

# Stop on error
$ErrorActionPreference = "Stop"

Write-Host "Starting redeployment of all services in cravecart namespace..."

# Check if kubectl is installed
try {
    kubectl version --client | Out-Null
} catch {
    Write-Host "kubectl is not installed or not in PATH. Please install kubectl first."
    exit 1
}

# Check current namespaces
Write-Host "Current namespaces in the cluster:"
kubectl get namespaces

# List of services to redeploy
$services = @(
    "user-service",
    "restaurant-service",
    "payment-service",
    "order-service",
    "notification-service",
    "delivery-service"
)

# Recreate namespace (delete and create)
Write-Host "Recreating cravecart namespace..."
kubectl delete namespace cravecart --ignore-not-found

# Wait for the namespace to be fully deleted
Write-Host "Waiting for namespace to be fully deleted..."
$namespaceExists = $true
while ($namespaceExists) {
    try {
        $null = kubectl get namespace cravecart 2>$null
        Write-Host "Namespace still exists, waiting..."
        Start-Sleep -Seconds 5
    } catch {
        $namespaceExists = $false
    }
}
Write-Host "Namespace deleted successfully."

# Create the namespace
kubectl apply -f kubernetes/namespace/cravecart-namespace.yaml
Write-Host "Namespace created successfully."

# Verify namespace creation
Write-Host "Verifying cravecart namespace exists:"
kubectl get namespace cravecart

# Wait for namespace to be fully active with retry logic
Write-Host "Waiting for namespace to be active..."
$maxRetries = 20
$retryCount = 0
$sleepSeconds = 10

while ($retryCount -lt $maxRetries) {
    $namespaceStatus = kubectl get namespace cravecart -o jsonpath="{.status.phase}" 2>$null
    if ($namespaceStatus -eq "Active") {
        Write-Host "Namespace is active."
        break
    } else {
        Write-Host "Namespace not yet active, waiting... (Attempt $($retryCount+1)/$maxRetries)"
        $retryCount++
        Start-Sleep -Seconds $sleepSeconds
    }
}

if ($retryCount -eq $maxRetries) {
    Write-Host "Timed out waiting for namespace to become active."
    Write-Host "Continuing anyway, but service deployments may fail."
}

# Apply configmaps
Write-Host "Applying configmaps..."
kubectl apply -f kubernetes/configmaps/ -n cravecart

# Apply secrets
Write-Host "Applying secrets..."
kubectl apply -f kubernetes/secrets/ -n cravecart

# Redeploy each service
foreach ($service in $services) {
    Write-Host "Redeploying $service..."
    
    # Apply deployment
    kubectl apply -f kubernetes/deployments/$service.yaml
    
    # Apply service
    kubectl apply -f kubernetes/services/$service.yaml
    
    Write-Host "$service redeployed."
}

# Wait for deployments to be ready
Write-Host "Waiting for deployments to be ready..."
foreach ($service in $services) {
    Write-Host "Waiting for $service deployment to be ready..."
    try {
        kubectl rollout status deployment/$service -n cravecart --timeout=300s
    } catch {
        Write-Host "Warning: Timeout waiting for $service deployment to be ready, continuing anyway."
    }
}

# Apply ingress resources
Write-Host "Applying ingress resources..."
kubectl apply -f kubernetes/ingress/ -n cravecart

# Verify all services are running in the cravecart namespace
Write-Host "Services in cravecart namespace:"
kubectl get services -n cravecart

Write-Host "Deployments in cravecart namespace:"
kubectl get deployments -n cravecart

Write-Host "Pods in cravecart namespace:"
kubectl get pods -n cravecart

Write-Host "All services have been redeployed successfully in the cravecart namespace."
Write-Host "Use 'kubectl get pods -n cravecart' to check the status of the deployments." 