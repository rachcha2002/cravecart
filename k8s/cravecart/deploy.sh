#!/bin/bash

# Create namespace if it doesn't exist
kubectl create namespace cravecart 2>/dev/null || true
kubectl config set-context --current --namespace=cravecart

# Install NGINX Ingress Controller if not already installed
echo "Checking if NGINX Ingress Controller is installed..."
if ! kubectl get pods -n ingress-nginx -l app.kubernetes.io/name=ingress-nginx 2>/dev/null | grep -q Running; then
  echo "Installing NGINX Ingress Controller..."
  kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.8.2/deploy/static/provider/cloud/deploy.yaml
  echo "Waiting for NGINX Ingress Controller to be ready..."
  kubectl wait --namespace ingress-nginx \
    --for=condition=ready pod \
    --selector=app.kubernetes.io/component=controller \
    --timeout=120s
fi

# Apply ConfigMaps
echo "Applying ConfigMaps..."
kubectl apply -f configmaps/

# Apply Secrets
echo "Applying Secrets..."
kubectl apply -f secrets/

# Apply backend services
echo "Deploying backend services..."
kubectl apply -f services/backend-services.yaml

# Apply backend deployments
echo "Deploying backend applications..."
kubectl apply -f deployments/user-service.yaml
kubectl apply -f deployments/restaurant-service.yaml
kubectl apply -f deployments/notification-service.yaml
kubectl apply -f deployments/order-service.yaml
kubectl apply -f deployments/payment-service.yaml
kubectl apply -f deployments/delivery-service.yaml

echo "Waiting for backend services to be ready..."
kubectl wait --for=condition=available --timeout=120s deployment/user-service
kubectl wait --for=condition=available --timeout=120s deployment/restaurant-service
kubectl wait --for=condition=available --timeout=120s deployment/notification-service
kubectl wait --for=condition=available --timeout=120s deployment/order-service
kubectl wait --for=condition=available --timeout=120s deployment/payment-service
kubectl wait --for=condition=available --timeout=120s deployment/delivery-service

# Apply frontend services
echo "Deploying frontend services..."
kubectl apply -f services/frontend-services.yaml

# Apply frontend deployments
echo "Deploying frontend applications..."
kubectl apply -f deployments/customer-portal.yaml
kubectl apply -f deployments/restaurant-portal.yaml
kubectl apply -f deployments/admin-portal.yaml

echo "Waiting for frontend applications to be ready..."
kubectl wait --for=condition=available --timeout=120s deployment/customer-portal
kubectl wait --for=condition=available --timeout=120s deployment/restaurant-portal
kubectl wait --for=condition=available --timeout=120s deployment/admin-portal

# Apply Ingress
echo "Setting up Ingress..."
kubectl apply -f ingress/cravecart-ingress.yaml

echo "Deployment complete!"
echo "Please add the following entries to your hosts file:"
echo "127.0.0.1 cravecart.local"
echo "127.0.0.1 restaurant.cravecart.local"
echo "127.0.0.1 admin.cravecart.local"

echo "You can access the applications at:"
echo "- Customer Portal: http://cravecart.local"
echo "- Restaurant Portal: http://restaurant.cravecart.local"
echo "- Admin Portal: http://admin.cravecart.local"

echo "Checking pod status..."
kubectl get pods
