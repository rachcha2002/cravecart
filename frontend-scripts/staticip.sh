#!/bin/bash

# Exit on error
set -e

# Set the project ID and region
PROJECT_ID="cravecart-web-458310"
REGION="us-central1"

# Configure gcloud to use the project
gcloud config set project $PROJECT_ID

echo "🔄 Reserving static IPs for web portals in $PROJECT_ID..."

# Reserve static IPs with the same addresses from the screenshot
echo "⚙️ Reserving admin-portal IP: 130.211.196.201"
gcloud compute addresses create admin-portal-ip \
  --project=$PROJECT_ID \
  --region=$REGION \
  --addresses=130.211.196.201

echo "⚙️ Reserving customer-portal IP: 35.226.62.115"
gcloud compute addresses create customer-portal-ip \
  --project=$PROJECT_ID \
  --region=$REGION \
  --addresses=35.226.62.115

echo "⚙️ Reserving restaurant-portal IP: 34.134.98.231"
gcloud compute addresses create restaurant-portal-ip \
  --project=$PROJECT_ID \
  --region=$REGION \
  --addresses=34.134.98.231

echo "✅ Static IPs reserved successfully!"

# Update Kubernetes service configs with the static IPs
echo "🔄 Updating Kubernetes Service configurations..."

# Create temporary files for each service
for portal in admin customer restaurant; do
  # Extract current service config
  echo "📄 Creating updated service config for $portal-portal"
  kubectl get service $portal-portal -n cravecartweb -o yaml > $portal-service.yaml
  
  # Update the loadBalancerIP in the service
  IP_ADDRESS=$(gcloud compute addresses describe $portal-portal-ip --region=$REGION --format="get(address)")
  
  # Use sed to update the file
  if grep -q "loadBalancerIP:" $portal-service.yaml; then
    # Update existing loadBalancerIP
    sed -i "s/loadBalancerIP: .*/loadBalancerIP: $IP_ADDRESS/" $portal-service.yaml
  else
    # Add loadBalancerIP field
    sed -i "/type: LoadBalancer/a \ \ loadBalancerIP: $IP_ADDRESS" $portal-service.yaml
  fi
  
  # Apply the updated service configuration
  echo "🚀 Applying updated service for $portal-portal"
  kubectl apply -f $portal-service.yaml
  
  # Clean up the temporary file
  rm $portal-service.yaml
done

echo "✅ All services updated with static IPs!"
echo ""
echo "📊 Services information:"
kubectl get services -n cravecartweb