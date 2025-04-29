#!/bin/bash

# Script to fix missing namespace in service files
# Add namespace: cravecart to all service definitions that are missing it

echo "Fixing namespace in service definition files..."

for file in kubernetes/services/*.yaml; do
  if [ -f "$file" ]; then
    SERVICE_NAME=$(basename "$file" .yaml)
    echo "Processing $SERVICE_NAME service file..."
    
    # Check if namespace is already specified
    if ! grep -q "namespace:" "$file"; then
      echo "Adding namespace: cravecart to $file"
      
      # Create a temporary file
      TEMP_FILE=$(mktemp)
      
      # Insert namespace after metadata: line
      awk '{
        print $0;
        if ($0 ~ /^[ ]*name:/) {
          print "  namespace: cravecart";
        }
      }' "$file" > "$TEMP_FILE"
      
      # Replace the original file
      mv "$TEMP_FILE" "$file"
      echo "Fixed $SERVICE_NAME service file"
    else
      echo "Namespace already specified in $SERVICE_NAME service file, skipping"
    fi
  fi
done

echo "All service files have been processed."
echo "You can now apply the changes with: kubectl apply -f kubernetes/services/ -n cravecart" 