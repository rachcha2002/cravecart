#!/bin/bash

echo "Cleaning up CraveCart resources from Kubernetes..."

# Delete all resources in the cravecart namespace
kubectl delete ingress --all -n cravecart
kubectl delete deployments --all -n cravecart
kubectl delete services --all -n cravecart
kubectl delete configmaps --all -n cravecart
kubectl delete secrets --all -n cravecart

echo "All CraveCart resources have been removed."
echo "To completely remove the namespace as well, run: kubectl delete namespace cravecart"
