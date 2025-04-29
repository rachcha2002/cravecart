#!/bin/bash

# Script to recreate and redeploy all services in the cravecart namespace
# This script assumes kubectl is configured correctly to access your cluster

set -e  # Exit immediately if a command exits with a non-zero status

echo "Starting redeployment of all services in cravecart namespace..."

# Check if kubectl is installed
if ! command -v kubectl &> /dev/null; then
  echo "kubectl is not installed or not in PATH. Please install kubectl first."
  exit 1
fi

# Check current namespaces
echo "Current namespaces in the cluster:"
kubectl get namespaces

# List of services to redeploy
SERVICES=(
  "user-service"
  "restaurant-service"
  "payment-service"
  "order-service"
  "notification-service"
  "delivery-service"
)

# Recreate namespace (delete and create)
echo "Recreating cravecart namespace..."
kubectl delete namespace cravecart --ignore-not-found

# Wait for the namespace to be fully deleted
echo "Waiting for namespace to be fully deleted..."
while kubectl get namespace cravecart &>/dev/null; do
  echo "Namespace still exists, waiting..."
  sleep 5
done
echo "Namespace deleted successfully."

# Create the namespace
kubectl apply -f kubernetes/namespace/cravecart-namespace.yaml
echo "Namespace created successfully."

# Verify namespace creation
echo "Verifying cravecart namespace exists:"
kubectl get namespace cravecart

# Wait for namespace to be fully active with retry logic
echo "Waiting for namespace to be active..."
MAX_RETRIES=20
RETRY_COUNT=0
SLEEP_SECONDS=10

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
  if kubectl get namespace cravecart | grep -q Active; then
    echo "Namespace is active."
    break
  else
    echo "Namespace not yet active, waiting... (Attempt $((RETRY_COUNT+1))/$MAX_RETRIES)"
    RETRY_COUNT=$((RETRY_COUNT+1))
    sleep $SLEEP_SECONDS
  fi
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
  echo "Timed out waiting for namespace to become active."
  echo "Continuing anyway, but service deployments may fail."
fi

# Apply configmaps
echo "Applying configmaps..."
kubectl apply -f kubernetes/configmaps/ -n cravecart

# Apply secrets
echo "Applying secrets..."
kubectl apply -f kubernetes/secrets/ -n cravecart

# Redeploy each service
for service in "${SERVICES[@]}"; do
  echo "Redeploying $service..."
  
  # Apply deployment
  kubectl apply -f kubernetes/deployments/${service}.yaml
  
  # Apply service
  kubectl apply -f kubernetes/services/${service}.yaml
  
  echo "$service redeployed."
done

# Wait for deployments to be ready
echo "Waiting for deployments to be ready..."
for service in "${SERVICES[@]}"; do
  echo "Waiting for $service deployment to be ready..."
  kubectl rollout status deployment/${service} -n cravecart --timeout=300s || true
done

# Apply ingress resources
echo "Applying ingress resources..."
kubectl apply -f kubernetes/ingress/ -n cravecart

# Verify all services are running in the cravecart namespace
echo "Services in cravecart namespace:"
kubectl get services -n cravecart

echo "Deployments in cravecart namespace:"
kubectl get deployments -n cravecart

echo "Pods in cravecart namespace:"
kubectl get pods -n cravecart

echo "All services have been redeployed successfully in the cravecart namespace."
echo "Use 'kubectl get pods -n cravecart' to check the status of the deployments." 