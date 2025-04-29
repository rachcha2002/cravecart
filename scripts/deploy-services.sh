#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

echo "Starting CraveCart services deployment with static IPs..."

# Create the cravecart namespace if it doesn't exist
kubectl create namespace cravecart --dry-run=client -o yaml | kubectl apply -f -
echo "Namespace 'cravecart' created or confirmed."

# Add namespace to service files if needed
for service_file in kubernetes/services/*.yaml; do
  echo "Updating $service_file with cravecart namespace"
  # Use yq or kubectl to properly add the namespace or directly edit the files
  # This is a safer approach than using sed for YAML files
  cp $service_file ${service_file}.bak
  cat ${service_file}.bak | awk '{print} /^  name:/ && !ns_added {print "  namespace: cravecart"; ns_added=1}' > $service_file
  rm ${service_file}.bak
done

# Deploy all services
echo "Deploying services with static IPs..."

# User Service - 34.111.116.231
kubectl apply -f kubernetes/services/user-service.yaml
echo "User Service deployed with IP 34.111.116.231"

# Order Service - 34.120.173.60
kubectl apply -f kubernetes/services/order-service.yaml
echo "Order Service deployed with IP 34.120.173.60"

# Restaurant Service - 34.149.70.241
kubectl apply -f kubernetes/services/restaurant-service.yaml
echo "Restaurant Service deployed with IP 34.149.70.241"

# Notification Service - 34.54.230.50
kubectl apply -f kubernetes/services/notification-service.yaml
echo "Notification Service deployed with IP 34.54.230.50"

# Payment Service - 34.110.189.129
kubectl apply -f kubernetes/services/payment-service.yaml
echo "Payment Service deployed with IP 34.110.189.129"

# Delivery Service - 35.244.210.204
kubectl apply -f kubernetes/services/delivery-service.yaml
echo "Delivery Service deployed with IP 35.244.210.204"

echo "Waiting for services to get external IPs..."
sleep 10

# Check service status
kubectl get services -n cravecart

echo "Verifying static IP assignments..."
for service in user-service order-service restaurant-service notification-service payment-service delivery-service; do
  echo "Checking $service..."
  kubectl get service $service -n cravecart -o jsonpath="{.status.loadBalancer.ingress[0].ip}{'\n'}"
done

echo "CraveCart services deployment completed." 