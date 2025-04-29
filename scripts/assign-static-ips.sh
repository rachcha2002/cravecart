#!/bin/bash

# Exit on error
set -e

echo "Starting assignment of reserved static IPs to CraveCart services..."

# Make sure namespace exists
kubectl create namespace cravecart --dry-run=client -o yaml | kubectl apply -f -
echo "Verified cravecart namespace"

# Get GCP Project ID
PROJECT_ID=$(gcloud config get-value project)
echo "Using GCP Project: $PROJECT_ID"

# Get current GKE cluster location/region
CLUSTER_LOCATION=$(gcloud container clusters list --format="value(location)")
echo "Cluster location: $CLUSTER_LOCATION"

# Function to check if IP address is reserved and available
check_static_ip() {
    local ip_name=$1
    local ip_address=$2
    
    echo "Checking IP $ip_address ($ip_name)..."
    
    # Check if the address exists
    if ! gcloud compute addresses list --filter="address=$ip_address" --format="get(name)" | grep -q .; then
        echo "ERROR: IP address $ip_address is not reserved in project $PROJECT_ID."
        echo "Reserve it first with: gcloud compute addresses create $ip_name --addresses=$ip_address --region=$CLUSTER_LOCATION"
        return 1
    fi
    
    # Check if the address is in use
    if gcloud compute addresses describe $ip_name --region=$CLUSTER_LOCATION --format="get(status)" | grep -q "IN_USE"; then
        echo "WARNING: IP address $ip_address is already in use."
    fi
    
    return 0
}

# Define the services and their static IPs
declare -A service_ips
service_ips["user-service"]="34.132.7.64"
service_ips["order-service"]="34.45.142.152"
service_ips["restaurant-service"]="34.133.20.229"
service_ips["notification-service"]="34.58.115.37"
service_ips["payment-service"]="34.121.113.108"
service_ips["delivery-service"]="35.226.92.191"

# First verify that all IPs are reserved
echo "Verifying all IP addresses are reserved in GCP..."
for service in "${!service_ips[@]}"; do
    ip_address=${service_ips[$service]}
    ip_name="${service}-ip"
    
    # Try to check the IP - if it fails, try to reserve it
    if ! check_static_ip "$ip_name" "$ip_address"; then
        echo "Attempting to reserve IP $ip_address as $ip_name..."
        gcloud compute addresses create "$ip_name" --addresses="$ip_address" --region="$CLUSTER_LOCATION"
    fi
done

# Now assign the IPs to services
echo "Assigning reserved static IPs to services..."
for service in "${!service_ips[@]}"; do
    ip_address=${service_ips[$service]}
    
    echo "Updating $service with IP $ip_address"
    
    # Check if service exists
    if kubectl get service $service -n cravecart &>/dev/null; then
        # Patch the existing service
        kubectl patch service $service -n cravecart -p "{\"metadata\":{\"annotations\":{\"cloud.google.com/load-balancer-ip\":\"$ip_address\"}},\"spec\":{\"loadBalancerIP\":\"$ip_address\"}}"
        
        # If the service already has a different IP, we need to recreate it
        current_ip=$(kubectl get service $service -n cravecart -o jsonpath="{.status.loadBalancer.ingress[0].ip}" 2>/dev/null)
        if [ "$current_ip" != "" ] && [ "$current_ip" != "$ip_address" ]; then
            echo "Service $service has IP $current_ip instead of $ip_address. Recreating..."
            kubectl delete service $service -n cravecart
            kubectl apply -f <(kubectl get service $service -n cravecart -o yaml | sed -e "s/cloud.google.com\/load-balancer-ip: .*/cloud.google.com\/load-balancer-ip: \"$ip_address\"/" -e "/status:/,\$d")
        fi
    else
        echo "Warning: Service $service does not exist in namespace cravecart"
    fi
done

echo "Waiting for services to get external IPs (this may take a few minutes)..."
sleep 30

# Verify the services have the correct IPs
echo "Verifying static IP assignments..."
kubectl get services -n cravecart

# Check each service's IP
echo "Detailed IP verification:"
for service in "${!service_ips[@]}"; do
    desired_ip=${service_ips[$service]}
    actual_ip=$(kubectl get service $service -n cravecart -o jsonpath="{.status.loadBalancer.ingress[0].ip}" 2>/dev/null)
    
    echo "$service:"
    echo "  Desired IP: $desired_ip"
    echo "  Actual IP:  $actual_ip"
    
    if [ "$actual_ip" != "$desired_ip" ]; then
        echo "  WARNING: IPs do not match!"
    else
        echo "  SUCCESS: IPs match correctly"
    fi
done

echo "IP assignment completed. If some IPs are not matching, you may need to:"
echo "1. Make sure the static IPs are reserved in the same region as your GKE cluster"
echo "2. Check if the IPs are already in use by other resources"
echo "3. Recreate the services manually with the correct IP annotations"

# Patch all services with their static IPs

# User Service
kubectl patch service user-service -n cravecart -p '{"metadata":{"annotations":{"cloud.google.com/load-balancer-ip":"34.132.7.64"}},"spec":{"loadBalancerIP":"34.132.7.64"}}'

# Order Service
kubectl patch service order-service -n cravecart -p '{"metadata":{"annotations":{"cloud.google.com/load-balancer-ip":"34.45.142.152"}},"spec":{"loadBalancerIP":"34.45.142.152"}}'

# Restaurant Service
kubectl patch service restaurant-service -n cravecart -p '{"metadata":{"annotations":{"cloud.google.com/load-balancer-ip":"34.133.20.229"}},"spec":{"loadBalancerIP":"34.133.20.229"}}'

# Notification Service
kubectl patch service notification-service -n cravecart -p '{"metadata":{"annotations":{"cloud.google.com/load-balancer-ip":"34.58.115.37"}},"spec":{"loadBalancerIP":"34.58.115.37"}}'

# Payment Service
kubectl patch service payment-service -n cravecart -p '{"metadata":{"annotations":{"cloud.google.com/load-balancer-ip":"34.121.113.108"}},"spec":{"loadBalancerIP":"34.121.113.108"}}'

# Delivery Service
kubectl patch service delivery-service -n cravecart -p '{"metadata":{"annotations":{"cloud.google.com/load-balancer-ip":"35.226.92.191"}},"spec":{"loadBalancerIP":"35.226.92.191"}}'

# Verify the services
kubectl get services -n cravecart 