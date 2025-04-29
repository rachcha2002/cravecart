# PowerShell script to fix missing namespace in service files
# Add namespace: cravecart to all service definitions that are missing it

Write-Host "Fixing namespace in service definition files..."

$serviceFiles = Get-ChildItem -Path "kubernetes/services" -Filter "*.yaml"

foreach ($file in $serviceFiles) {
    $serviceName = [System.IO.Path]::GetFileNameWithoutExtension($file.Name)
    Write-Host "Processing $serviceName service file..."
    
    $content = Get-Content -Path $file.FullName
    
    # Check if namespace is already specified
    if (-not ($content -match "namespace:")) {
        Write-Host "Adding namespace: cravecart to $($file.FullName)"
        
        $newContent = @()
        $namespaceAdded = $false
        
        foreach ($line in $content) {
            $newContent += $line
            
            # Add namespace after name: line
            if ($line -match "^\s*name:") {
                $newContent += "  namespace: cravecart"
                $namespaceAdded = $true
            }
        }
        
        if ($namespaceAdded) {
            $newContent | Set-Content -Path $file.FullName
            Write-Host "Fixed $serviceName service file"
        } else {
            Write-Host "Could not find a suitable location to add namespace in $serviceName"
        }
    } else {
        Write-Host "Namespace already specified in $serviceName service file, skipping"
    }
}

Write-Host "All service files have been processed."
Write-Host "You can now apply the changes with: kubectl apply -f kubernetes/services/ -n cravecart" 