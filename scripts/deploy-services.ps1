# PowerShell script for deploying CraveCart services with static IPs

Write-Host "Starting CraveCart services deployment with static IPs..."

# Create the cravecart namespace if it doesn't exist
Write-Host "Creating or confirming namespace 'cravecart'..."
kubectl create namespace cravecart --dry-run=client -o yaml | kubectl apply -f -

# Update all service files with namespace
$serviceFiles = Get-ChildItem -Path "kubernetes\services\*.yaml"
foreach ($file in $serviceFiles) {
    Write-Host "Updating $($file.Name) with cravecart namespace"
    
    # Read the file content
    $content = Get-Content -Path $file.FullName
    
    # Check if namespace already exists
    if (-not ($content | Select-String -Pattern "namespace: cravecart")) {
        # Add namespace after name in metadata section
        $updatedContent = @()
        $nameFound = $false
        
        foreach ($line in $content) {
            $updatedContent += $line
            if ($line -match '^\s*name:' -and -not $nameFound) {
                $updatedContent += "  namespace: cravecart"
                $nameFound = $true
            }
        }
        
        # Write updated content back to file
        $updatedContent | Set-Content -Path $file.FullName
    }
}

# Deploy all services
Write-Host "Deploying services with static IPs..."

# User Service - 34.111.116.231
Write-Host "Deploying User Service with IP 34.111.116.231"
kubectl apply -f kubernetes/services/user-service.yaml

# Order Service - 34.120.173.60
Write-Host "Deploying Order Service with IP 34.120.173.60"
kubectl apply -f kubernetes/services/order-service.yaml

# Restaurant Service - 34.149.70.241
Write-Host "Deploying Restaurant Service with IP 34.149.70.241"
kubectl apply -f kubernetes/services/restaurant-service.yaml

# Notification Service - 34.54.230.50
Write-Host "Deploying Notification Service with IP 34.54.230.50"
kubectl apply -f kubernetes/services/notification-service.yaml

# Payment Service - 34.110.189.129
Write-Host "Deploying Payment Service with IP 34.110.189.129"
kubectl apply -f kubernetes/services/payment-service.yaml

# Delivery Service - 35.244.210.204
Write-Host "Deploying Delivery Service with IP 35.244.210.204"
kubectl apply -f kubernetes/services/delivery-service.yaml

Write-Host "Waiting for services to get external IPs..."
Start-Sleep -Seconds 10

# Check service status
Write-Host "Checking service status..."
kubectl get services -n cravecart

Write-Host "Verifying static IP assignments..."
$services = @("user-service", "order-service", "restaurant-service", "notification-service", "payment-service", "delivery-service")
foreach ($service in $services) {
    Write-Host "Checking $service..."
    kubectl get service $service -n cravecart -o jsonpath="{.status.loadBalancer.ingress[0].ip}{'\n'}"
}

Write-Host "CraveCart services deployment completed." 