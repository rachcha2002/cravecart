# PowerShell script to update Kubernetes deployment files
# Stop on error
$ErrorActionPreference = "Stop"

# Set variables
$PROJECT_ID = "cravecart-web-458310"
$NAMESPACE = "cravecartweb"

Write-Host "🔄 Updating Kubernetes deployment files for project: $PROJECT_ID" -ForegroundColor Cyan

# Navigate to project root
$ROOT_DIR = "E:\cravecart"
Set-Location $ROOT_DIR

# Function to update deployment files
function Update-DeploymentFile {
    param (
        [string]$file
    )
    Write-Host "📝 Updating file: $file" -ForegroundColor Yellow
    
    # Read file content
    $content = Get-Content $file -Raw
    
    # Update project ID in image references
    $content = $content -replace "gcr.io/cravecart-457103/", "gcr.io/$PROJECT_ID/"
    
    # Ensure replicas is set to 1
    $content = $content -replace "replicas: 2", "replicas: 1"
    
    # Write updated content back to file
    Set-Content -Path $file -Value $content
    
    Write-Host "✅ Updated: $file" -ForegroundColor Green
}

# Update all deployment files
Write-Host "🔍 Finding deployment files..." -ForegroundColor Yellow
$deploymentFiles = Get-ChildItem -Path "kubernetes\deployments\*-portal.yaml"
foreach ($file in $deploymentFiles) {
    Update-DeploymentFile -file $file.FullName
}

Write-Host "✅ All deployment files updated successfully!" -ForegroundColor Green
Write-Host "📋 Next steps: Run deploy-web-portals.ps1 script to deploy the web applications to the cluster." -ForegroundColor Cyan 