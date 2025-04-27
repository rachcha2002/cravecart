#!/bin/bash

# Set the Docker repository name
DOCKER_REPO=cravecart

# Define the base directory (two levels up from k8s/cravecart)
BASE_DIR="$(cd ../../ && pwd)"
echo "Building from base directory: $BASE_DIR"

# Build and tag backend services
echo "Building backend service images..."

# User Service
echo "Building user-service image..."
docker build -t $DOCKER_REPO/user-service:latest -f $BASE_DIR/services/user-service/Dockerfile $BASE_DIR/services/user-service

# Restaurant Service
echo "Building restaurant-service image..."
docker build -t $DOCKER_REPO/restaurant-service:latest -f $BASE_DIR/services/restaurant-service/Dockerfile $BASE_DIR/services/restaurant-service

# Order Service
echo "Building order-service image..."
docker build -t $DOCKER_REPO/order-service:latest -f $BASE_DIR/services/order-service/Dockerfile $BASE_DIR/services/order-service

# Payment Service
echo "Building payment-service image..."
docker build -t $DOCKER_REPO/payment-service:latest -f $BASE_DIR/services/payment-service/Dockerfile $BASE_DIR/services/payment-service

# Delivery Service
echo "Building delivery-service image..."
docker build -t $DOCKER_REPO/delivery-service:latest -f $BASE_DIR/services/delivery-service/Dockerfile $BASE_DIR/services/delivery-service

# Notification Service
echo "Building notification-service image..."
docker build -t $DOCKER_REPO/notification-service:latest -f $BASE_DIR/services/notification-service/Dockerfile $BASE_DIR/services/notification-service

# Build and tag frontend applications
echo "Building frontend application images..."

# Customer Portal
echo "Building customer-portal image..."
docker build -t $DOCKER_REPO/customer-portal:latest -f $BASE_DIR/web/customer-portal/Dockerfile $BASE_DIR/web/customer-portal

# Restaurant Portal
echo "Building restaurant-portal image..."
docker build -t $DOCKER_REPO/restaurant-portal:latest -f $BASE_DIR/web/restaurant-portal/Dockerfile $BASE_DIR/web/restaurant-portal

# Admin Portal
echo "Building admin-portal image..."
docker build -t $DOCKER_REPO/admin-portal:latest -f $BASE_DIR/web/admin-portal/Dockerfile $BASE_DIR/web/admin-portal

echo "All Docker images built successfully!"
echo "You can now run ./deploy.sh to deploy the application to Kubernetes."