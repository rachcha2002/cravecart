#!/bin/bash

# Exit on error
set -e

RESTAURANT_IP="34.133.20.229"

echo "Starting deployment of Restaurant Service with static IP $RESTAURANT_IP"

# Create namespace if it doesn't exist
kubectl create namespace cravecart --dry-run=client -o yaml | kubectl apply -f -
echo "Namespace cravecart created or confirmed"

# Check if restaurant service YAML exists
if [ ! -f "kubernetes/services/restaurant-service.yaml" ]; then
  echo "ERROR: Restaurant service YAML file not found"
  exit 1
fi

# Check if restaurant deployment YAML exists
if [ ! -f "kubernetes/deployments/restaurant-service.yaml" ]; then
  echo "ERROR: Restaurant deployment YAML file not found"
  exit 1
fi

# Update the service YAML with the correct static IP
echo "Updating restaurant service with static IP $RESTAURANT_IP"
sed -i "s|cloud.google.com/load-balancer-ip: .*|cloud.google.com/load-balancer-ip: \"$RESTAURANT_IP\"|g" kubernetes/services/restaurant-service.yaml

# Apply the deployment
echo "Deploying restaurant service deployment..."
kubectl apply -f kubernetes/deployments/restaurant-service.yaml

# Apply the service
echo "Deploying restaurant service with static IP..."
kubectl apply -f kubernetes/services/restaurant-service.yaml

# Patch the service directly to ensure IP is set
echo "Patching restaurant service to ensure static IP is applied..."
kubectl patch service restaurant-service -n cravecart -p "{\"metadata\":{\"annotations\":{\"cloud.google.com/load-balancer-ip\":\"$RESTAURANT_IP\"}},\"spec\":{\"loadBalancerIP\":\"$RESTAURANT_IP\"}}"

echo "Waiting for restaurant service to be assigned the static IP (this may take a few minutes)..."
sleep 15

# Check the service status
echo "Checking restaurant service status:"
kubectl get service restaurant-service -n cravecart

# Verify the IP assignment
assigned_ip=$(kubectl get service restaurant-service -n cravecart -o jsonpath="{.status.loadBalancer.ingress[0].ip}" 2>/dev/null)
echo "Restaurant Service:"
echo "  Desired IP: $RESTAURANT_IP"
echo "  Assigned IP: $assigned_ip"

if [ "$assigned_ip" = "$RESTAURANT_IP" ]; then
  echo "SUCCESS: Restaurant service deployed with correct static IP!"
else
  echo "WARNING: Restaurant service IP doesn't match. You may need to wait longer or check your GCP configuration."
fi

# Check pods
echo "Checking restaurant service pods:"
kubectl get pods -n cravecart -l app=restaurant-service

echo "Restaurant service deployment completed." 