# CraveCart Kubernetes Deployment

This directory contains Kubernetes configuration files for deploying the CraveCart microservices on Google Kubernetes Engine (GKE).

## Architecture

The system consists of 6 microservices, each with its own dedicated LoadBalancer and static IP address:
- user-service (34.8.57.185): Handles user registration, authentication, and profile management
- restaurant-service (34.111.17.63): Manages restaurant information, menus, and availability
- order-service (34.49.43.70): Processes and tracks customer orders
- payment-service (34.102.186.211): Manages payment processing using Stripe
- notification-service (34.120.18.225): Sends notifications via email, SMS, and push notifications
- delivery-service (34.110.175.144): Tracks delivery personnel and manages order deliveries

## Prerequisites

- Google Cloud account
- [Google Cloud SDK](https://cloud.google.com/sdk/docs/install) installed
- [kubectl](https://kubernetes.io/docs/tasks/tools/) installed
- [Docker](https://docs.docker.com/get-docker/) installed

## Deployment Steps

1. Edit the `PROJECT_ID` variable in `scripts/deploy-to-gke.sh` to match your GCP project ID:
   ```bash
   PROJECT_ID="your-gcp-project-id"
   ```

2. Make the deployment script executable:
   ```bash
   chmod +x scripts/deploy-to-gke.sh
   ```

3. Run the deployment script:
   ```bash
   ./scripts/deploy-to-gke.sh
   ```

4. The script will:
   - Create a GKE cluster if it doesn't exist
   - Reserve static IP addresses for each service
   - Build and push Docker images for each service
   - Deploy all Kubernetes resources (ConfigMaps, Deployments, Services)
   - Display the external IPs for accessing the services

## Accessing the Services

After deployment, each service will be accessible through its dedicated static IP address:
- User Service: http://34.8.57.185:3001
- Restaurant Service: http://34.111.17.63:5004
- Order Service: http://34.49.43.70:5003
- Payment Service: http://34.102.186.211:5002
- Notification Service: http://34.120.18.225:5005
- Delivery Service: http://34.110.175.144:3005

## Monitoring and Troubleshooting

To view the status of your deployments:
```bash
kubectl get deployments
```

To view the status of your pods:
```bash
kubectl get pods
```

To view logs for a specific pod:
```bash
kubectl logs <pod-name>
```

## Configuration Management

All configuration is stored in ConfigMaps, including sensitive information as requested. In a production environment, you might want to use Kubernetes Secrets for sensitive data.

## Clean Up

To delete the GKE cluster and all resources:
```bash
gcloud container clusters delete cravecart-cluster --zone us-central1-a
``` 