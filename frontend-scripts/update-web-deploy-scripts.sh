#!/bin/bash

# Exit on error
set -e

# Set variables
OLD_PROJECT_ID="cravecart-457103"
NEW_PROJECT_ID="cravecart-web-458310"

echo "🔄 Updating web deployment scripts with new project ID: $NEW_PROJECT_ID"

# Navigate to project root
ROOT_DIR=$(git rev-parse --show-toplevel 2>/dev/null || echo "/e/cravecart")
cd "$ROOT_DIR"

# Update bash script
echo "📝 Updating deploy-web-portals.sh"
sed -i "s|gcr.io/$OLD_PROJECT_ID/|gcr.io/$NEW_PROJECT_ID/|g" scripts/deploy-web-portals.sh
echo "✅ Updated: scripts/deploy-web-portals.sh"

# Update PowerShell script
echo "📝 Updating deploy-web-portals.ps1"
sed -i "s|gcr.io/$OLD_PROJECT_ID/|gcr.io/$NEW_PROJECT_ID/|g" scripts/deploy-web-portals.ps1
echo "✅ Updated: scripts/deploy-web-portals.ps1"

echo "✅ All deployment scripts updated successfully!"
echo "📋 Next steps: Run the updated scripts to deploy the web applications to the cluster." 