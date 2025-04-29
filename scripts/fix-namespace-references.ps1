# PowerShell script to fix incorrect namespace references
# Change all instances of "cravecartweb" to "cravecart"

Write-Host "Fixing incorrect namespace references (cravecartweb -> cravecart)..."

# Directories to search in
$directories = @(
    "kubernetes/configmaps",
    "kubernetes/deployments",
    "kubernetes/services",
    "kubernetes/ingress"
)

$totalFixed = 0

foreach ($dir in $directories) {
    if (Test-Path $dir) {
        Write-Host "Checking files in $dir..."
        $files = Get-ChildItem -Path $dir -Filter "*.yaml"
        
        foreach ($file in $files) {
            $content = Get-Content -Path $file.FullName -Raw
            
            if ($content -match "cravecartweb") {
                Write-Host "Fixing namespace in $($file.FullName)"
                $newContent = $content -replace "cravecartweb", "cravecart"
                $newContent | Set-Content -Path $file.FullName
                Write-Host "  Fixed: $($file.Name)"
                $totalFixed++
            }
        }
    } else {
        Write-Host "Directory $dir does not exist, skipping."
    }
}

if ($totalFixed -gt 0) {
    Write-Host "Fixed $totalFixed files with incorrect namespace references."
} else {
    Write-Host "No files with incorrect namespace references found."
}

Write-Host "All files have been processed."
Write-Host "You should now be able to redeploy everything to the cravecart namespace." 