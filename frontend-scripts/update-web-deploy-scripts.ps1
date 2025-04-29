# PowerShell script to update web deployment scripts
# Stop on error
$ErrorActionPreference = "Stop"

# Set variables
$OLD_PROJECT_ID = "cravecart-457103"
$NEW_PROJECT_ID = "cravecart-web-458310"

Write-Host "🔄 Updating web deployment scripts with new project ID: $NEW_PROJECT_ID" -ForegroundColor Cyan

# Navigate to project root
$ROOT_DIR = "E:\cravecart"
Set-Location $ROOT_DIR

# Update bash script
Write-Host "📝 Updating deploy-web-portals.sh" -ForegroundColor Yellow
$bashContent = Get-Content "scripts\deploy-web-portals.sh" -Raw
$bashContent = $bashContent -replace "gcr.io/$OLD_PROJECT_ID/", "gcr.io/$NEW_PROJECT_ID/"
Set-Content -Path "scripts\deploy-web-portals.sh" -Value $bashContent
Write-Host "✅ Updated: scripts\deploy-web-portals.sh" -ForegroundColor Green

# Update PowerShell script
Write-Host "📝 Updating deploy-web-portals.ps1" -ForegroundColor Yellow
$psContent = Get-Content "scripts\deploy-web-portals.ps1" -Raw
$psContent = $psContent -replace "gcr.io/$OLD_PROJECT_ID/", "gcr.io/$NEW_PROJECT_ID/"
Set-Content -Path "scripts\deploy-web-portals.ps1" -Value $psContent
Write-Host "✅ Updated: scripts\deploy-web-portals.ps1" -ForegroundColor Green

Write-Host "✅ All deployment scripts updated successfully!" -ForegroundColor Green
Write-Host "📋 Next steps: Run the updated scripts to deploy the web applications to the cluster." -ForegroundColor Cyan 