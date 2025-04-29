#!/bin/bash

# Colors for terminal output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
SERVICES=("user-service" "order-service" "restaurant-service" "payment-service" "notification-service" "delivery-service")
NAMESPACE="cravecart"

echo -e "${YELLOW}Verifying status of all backend services...${NC}"

# Function to check a service's availability by making a request to its health endpoint
check_service_health() {
  local service=$1
  local ip=$2
  local port=$3
  
  echo -e "${YELLOW}Checking health of $service at $ip:$port...${NC}"
  
  # Attempt to reach the service's health endpoint
  response=$(curl -s -o /dev/null -w "%{http_code}" http://$ip:$port/health 2>/dev/null || echo "Connection failed")
  
  if [ "$response" == "200" ]; then
    echo -e "${GREEN}$service is healthy (Status: $response)${NC}"
    return 0
  elif [ "$response" == "Connection failed" ]; then
    echo -e "${RED}$service is unreachable${NC}"
    return 1
  else
    echo -e "${RED}$service returned unexpected status: $response${NC}"
    return 1
  fi
}

# Get all services
echo -e "${YELLOW}Current Services:${NC}"
kubectl get services -n $NAMESPACE

# Get all pods
echo -e "${YELLOW}Current Pods:${NC}"
kubectl get pods -n $NAMESPACE

# Check each service
echo -e "\n${YELLOW}Checking individual service health:${NC}"

for service in "${SERVICES[@]}"; do
  # Get service IP and port
  echo -e "${YELLOW}Getting details for $service...${NC}"
  
  # Get the external IP for the service
  ip=$(kubectl get service $service -n $NAMESPACE -o jsonpath='{.status.loadBalancer.ingress[0].ip}' 2>/dev/null)
  
  # If no external IP (LoadBalancer might be pending), try cluster IP
  if [ -z "$ip" ]; then
    ip=$(kubectl get service $service -n $NAMESPACE -o jsonpath='{.spec.clusterIP}' 2>/dev/null)
    echo -e "${YELLOW}Using cluster IP for $service: $ip${NC}"
  else
    echo -e "${YELLOW}Using external IP for $service: $ip${NC}"
  fi
  
  # Get the service port
  port=$(kubectl get service $service -n $NAMESPACE -o jsonpath='{.spec.ports[0].port}' 2>/dev/null)
  
  if [ -z "$ip" ] || [ -z "$port" ]; then
    echo -e "${RED}Could not get IP or port for $service${NC}"
    continue
  fi
  
  # Check service health
  check_service_health $service $ip $port
done

# Get recent pod logs for troubleshooting
echo -e "\n${YELLOW}Recent logs from services:${NC}"
for service in "${SERVICES[@]}"; do
  echo -e "${YELLOW}Logs for $service:${NC}"
  pod=$(kubectl get pods -n $NAMESPACE -l app=$service -o jsonpath='{.items[0].metadata.name}' 2>/dev/null)
  
  if [ -n "$pod" ]; then
    kubectl logs $pod -n $NAMESPACE --tail=20
  else
    echo -e "${RED}No pods found for $service${NC}"
  fi
  
  echo -e "${YELLOW}----------------------------------------------${NC}"
done

echo -e "${GREEN}Backend services verification completed!${NC}" 