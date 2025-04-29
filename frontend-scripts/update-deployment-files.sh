#!/bin/bash

# Exit on error
set -e

# Set variables
PROJECT_ID="cravecart-web-458310"
NAMESPACE="cravecartweb"

echo "🔄 Updating Kubernetes deployment files for project: $PROJECT_ID"

# Navigate to project root
ROOT_DIR=$(git rev-parse --show-toplevel 2>/dev/null || echo "/e/cravecart")
cd "$ROOT_DIR"

# Function to update deployment files
update_deployment_file() {
  local file=$1
  echo "📝 Updating file: $file"
  
  # Update project ID in image references
  sed -i "s|gcr.io/cravecart-457103/|gcr.io/$PROJECT_ID/|g" "$file"
  
  # Ensure replicas is set to 1
  sed -i 's/replicas: 2/replicas: 1/g' "$file"
  
  echo "✅ Updated: $file"
}

# Update all deployment files
echo "🔍 Finding deployment files..."
for file in kubernetes/deployments/*-portal.yaml; do
  if [ -f "$file" ]; then
    update_deployment_file "$file"
  fi
done

echo "✅ All deployment files updated successfully!"
echo "📋 Next steps: Run deploy-web-portals.sh script to deploy the web applications to the cluster." 