# PowerShell script to verify status of all backend services

# Configuration
$services = @("user-service", "order-service", "restaurant-service", "payment-service", "notification-service", "delivery-service")
$namespace = "cravecart"

Write-Host "Verifying status of all backend services..." -ForegroundColor Yellow

# Function to check a service's availability by making a request to its health endpoint
function Test-ServiceHealth {
    param (
        [string]$service,
        [string]$ip,
        [string]$port
    )
    
    Write-Host "Checking health of $service at $ip`:$port..." -ForegroundColor Yellow
    
    # Attempt to reach the service's health endpoint
    try {
        $response = Invoke-WebRequest -Uri "http://$ip`:$port/health" -TimeoutSec 5 -ErrorAction Stop
        if ($response.StatusCode -eq 200) {
            Write-Host "$service is healthy (Status: $($response.StatusCode))" -ForegroundColor Green
            return $true
        } else {
            Write-Host "$service returned unexpected status: $($response.StatusCode)" -ForegroundColor Red
            return $false
        }
    } catch {
        Write-Host "$service is unreachable" -ForegroundColor Red
        return $false
    }
}

# Get all services
Write-Host "Current Services:" -ForegroundColor Yellow
kubectl get services -n $namespace

# Get all pods
Write-Host "Current Pods:" -ForegroundColor Yellow
kubectl get pods -n $namespace

# Check each service
Write-Host "`nChecking individual service health:" -ForegroundColor Yellow

foreach ($service in $services) {
    # Get service IP and port
    Write-Host "Getting details for $service..." -ForegroundColor Yellow
    
    # Get the external IP for the service
    $ip = $null
    try {
        $ip = kubectl get service $service -n $namespace -o jsonpath='{.status.loadBalancer.ingress[0].ip}' 2>$null
    } catch {
        # Do nothing, we'll check for cluster IP instead
    }
    
    # If no external IP (LoadBalancer might be pending), try cluster IP
    if ([string]::IsNullOrEmpty($ip)) {
        try {
            $ip = kubectl get service $service -n $namespace -o jsonpath='{.spec.clusterIP}' 2>$null
            Write-Host "Using cluster IP for $service: $ip" -ForegroundColor Yellow
        } catch {
            Write-Host "Could not get IP for $service" -ForegroundColor Red
            continue
        }
    } else {
        Write-Host "Using external IP for $service: $ip" -ForegroundColor Yellow
    }
    
    # Get the service port
    $port = $null
    try {
        $port = kubectl get service $service -n $namespace -o jsonpath='{.spec.ports[0].port}' 2>$null
    } catch {
        Write-Host "Could not get port for $service" -ForegroundColor Red
        continue
    }
    
    if ([string]::IsNullOrEmpty($ip) -or [string]::IsNullOrEmpty($port)) {
        Write-Host "Could not get IP or port for $service" -ForegroundColor Red
        continue
    }
    
    # Check service health
    Test-ServiceHealth -service $service -ip $ip -port $port
}

# Get recent pod logs for troubleshooting
Write-Host "`nRecent logs from services:" -ForegroundColor Yellow
foreach ($service in $services) {
    Write-Host "Logs for $service:" -ForegroundColor Yellow
    
    $pod = $null
    try {
        $pod = kubectl get pods -n $namespace -l "app=$service" -o jsonpath='{.items[0].metadata.name}' 2>$null
    } catch {
        Write-Host "No pods found for $service" -ForegroundColor Red
        Write-Host "----------------------------------------------" -ForegroundColor Yellow
        continue
    }
    
    if (-not [string]::IsNullOrEmpty($pod)) {
        kubectl logs $pod -n $namespace --tail=20
    } else {
        Write-Host "No pods found for $service" -ForegroundColor Red
    }
    
    Write-Host "----------------------------------------------" -ForegroundColor Yellow
}

Write-Host "Backend services verification completed!" -ForegroundColor Green 