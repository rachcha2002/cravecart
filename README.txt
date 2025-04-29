# CraveCart Microservices Deployment Guide

This document provides comprehensive instructions for deploying the CraveCart food delivery platform, which consists of multiple microservices and frontend applications.

## Table of Contents
1. Project Overview
2. Files That Need Configuration
3. Step-by-Step Configuration Guide
   - 3.1 Local Development Configuration
   - 3.2 Cloud/Kubernetes Deployment Configuration
   - 3.3 Mobile App Deployment
4. Deployment Commands
5. Post-Deployment Verification
6. Common Issues and Troubleshooting
7. Updating Existing Deployments
8. Additional Resources

## 1. Project Overview

CraveCart is a comprehensive food delivery platform with the following components:

- **Core Microservices**:
  - **User Service**: Handles authentication, user profiles, and roles
  - **Restaurant Service**: Manages restaurant information and menus
  - **Order Service**: Processes and tracks customer orders
  - **Payment Service**: Handles payments via Stripe
  - **Delivery Service**: Manages delivery personnel and order deliveries
  - **Notification Service**: Sends notifications via email, SMS, and push

- **Web Portals**:
  - Customer Portal: For end customers to browse, order food
  - Restaurant Portal: For restaurant owners to manage their menu and orders
  - Admin Portal: For system administrators to oversee operations

- **Mobile Application**:
  - Rider App: For delivery personnel to manage deliveries

## 2. Files That Need Configuration

### A. Environment Files

**Required for each microservice**:

1. Create `.env` files for each service based on the examples:
```
services/user-service/.env
services/restaurant-service/.env
services/order-service/.env
services/payment-service/.env
services/delivery-service/.env
services/notification-service/.env
```

**Web Portal Environment Files**:
```
web/customer-portal/.env
web/restaurant-portal/.env
web/admin-portal/.env
```

**Mobile App Environment File**:
```
mobile/rider-app/.env
```

### B. Cloud Deployment Configuration Files

If deploying to Google Kubernetes Engine (GKE):

1. **Modify `scripts/full-deploy.sh` or `scripts/deploy-without-order.sh`**:
   - Update the `PROJECT_ID` variable to match your GCP project
   - Set the `CLUSTER_NAME` and `CLUSTER_ZONE` as needed

2. **Update Kubernetes ConfigMaps** with correct service URLs and credentials:
   - `kubernetes/configmaps/user-service-config.yaml`
   - `kubernetes/configmaps/restaurant-service-config.yaml`
   - `kubernetes/configmaps/order-service-config.yaml`
   - `kubernetes/configmaps/payment-service-config.yaml`
   - `kubernetes/configmaps/delivery-service-config.yaml`
   - `kubernetes/configmaps/notification-service-config.yaml`

3. **Update Kubernetes Secrets** with sensitive information:
   - `kubernetes/secrets/mongodb-secret.yaml`
   - `kubernetes/secrets/notification-secrets.yaml`
   - `kubernetes/secrets/payment-secrets.yaml`

## 3. Step-by-Step Configuration Guide

### 3.1 Local Development Configuration

1. **Configure User Service**:
   Create `services/user-service/.env` with:
   ```
   PORT=3001
   MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/cravecart
   JWT_SECRET=your_jwt_secret_key
   JWT_EXPIRATION=7d
   SERVICE_NAME=user-service
   NODE_ENV=development
   
   # Service URLs (for local development)
   ORDER_SERVICE_URL=http://order-service:5003
   RESTAURANT_SERVICE_URL=http://restaurant-service:5004
   NOTIFICATION_SERVICE_URL=http://notification-service:5005
   DELIVERY_SERVICE_URL=http://delivery-service:3005
   PAYMENT_SERVICE_URL=http://payment-service:5002
   USER_SERVICE_URL=http://user-service:3001
   ```

2. **Configure Restaurant Service**:
   Create `services/restaurant-service/.env` with:
   ```
   PORT=5004
   MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/cravecart
   JWT_SECRET=your_jwt_secret_key
   SERVICE_NAME=restaurant-service
   NODE_ENV=development
   
   # Service URLs
   ORDER_SERVICE_URL=http://order-service:5003
   RESTAURANT_SERVICE_URL=http://restaurant-service:5004
   NOTIFICATION_SERVICE_URL=http://notification-service:5005
   DELIVERY_SERVICE_URL=http://delivery-service:3005
   PAYMENT_SERVICE_URL=http://payment-service:5002
   USER_SERVICE_URL=http://user-service:3001
   ```

3. **Configure Order Service**:
   Create `services/order-service/.env` with:
   ```
   PORT=5003
   MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/cravecart
   JWT_SECRET=your_jwt_secret_key
   SERVICE_NAME=order-service
   NODE_ENV=development
   
   # Service URLs
   ORDER_SERVICE_URL=http://order-service:5003
   RESTAURANT_SERVICE_URL=http://restaurant-service:5004
   NOTIFICATION_SERVICE_URL=http://notification-service:5005
   DELIVERY_SERVICE_URL=http://delivery-service:3005
   PAYMENT_SERVICE_URL=http://payment-service:5002
   USER_SERVICE_URL=http://user-service:3001
   ```

4. **Configure Payment Service**:
   Create `services/payment-service/.env` with:
   ```
   PORT=5002
   MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/cravecart
   JWT_SECRET=your_jwt_secret_key
   SERVICE_NAME=payment-service
   NODE_ENV=development
   
   # Stripe configuration
   STRIPE_SECRET_KEY=your_stripe_secret_key
   STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
   
   # Service URLs
   ORDER_SERVICE_URL=http://order-service:5003
   RESTAURANT_SERVICE_URL=http://restaurant-service:5004
   NOTIFICATION_SERVICE_URL=http://notification-service:5005
   DELIVERY_SERVICE_URL=http://delivery-service:3005
   PAYMENT_SERVICE_URL=http://payment-service:5002
   USER_SERVICE_URL=http://user-service:3001
   ```

5. **Configure Delivery Service**:
   Create `services/delivery-service/.env` with:
   ```
   PORT=3005
   MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/cravecart
   JWT_SECRET=your_jwt_secret_key
   JWT_EXPIRATION=7d
   SERVICE_NAME=delivery-service
   NODE_ENV=development
   
   # Service URLs
   ORDER_SERVICE_URL=http://order-service:5003
   RESTAURANT_SERVICE_URL=http://restaurant-service:5004
   NOTIFICATION_SERVICE_URL=http://notification-service:5005
   DELIVERY_SERVICE_URL=http://delivery-service:3005
   PAYMENT_SERVICE_URL=http://payment-service:5002
   USER_SERVICE_URL=http://user-service:3001
   ```

6. **Configure Notification Service**:
   Create `services/notification-service/.env` with:
   ```
   PORT=5005
   MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/cravecart
   JWT_SECRET=your_jwt_secret_key
   SERVICE_NAME=notification-service
   NODE_ENV=development
   
   # Email Configuration
   EMAIL_SERVICE=gmail
   EMAIL_FROM=your_email@gmail.com
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASSWORD=your_app_password
   
   # Notify.lk Configuration (if used)
   NOTIFYLK_SENDER_ID=your_sender_id
   NOTIFYLK_USER_ID=your_user_id
   NOTIFYLK_API_KEY=your_api_key
   
   # Firebase Configuration (if used)
   FIREBASE_SERVICE_ACCOUNT_PATH=/path/to/firebase-service-account.json
   
   # Service URLs
   ORDER_SERVICE_URL=http://order-service:5003
   RESTAURANT_SERVICE_URL=http://restaurant-service:5004
   NOTIFICATION_SERVICE_URL=http://notification-service:5005
   DELIVERY_SERVICE_URL=http://delivery-service:3005
   PAYMENT_SERVICE_URL=http://payment-service:5002
   USER_SERVICE_URL=http://user-service:3001
   ```

7. **Web Portals Configuration**:
   For each portal, create `.env` files with appropriate API endpoints.
   
   Example for `web/customer-portal/.env`:
   ```
   REACT_APP_API_URL=http://localhost:3001
   REACT_APP_MENU_URL=http://localhost:5004/api
   REACT_APP_NOTIFICATION_API_URL=http://localhost:5005
   REACT_APP_PAYMENT_API_URL=http://localhost:5002/api/payments
   REACT_APP_ORDER_API_URL=http://localhost:5003
   REACT_APP_DELIVERY_API_URL=http://localhost:3005
   REACT_APP_NOTIFICATION_SERVICE_URL=http://localhost:5005
   REACT_APP_NAME=CraveCart
   REACT_APP_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
   REACT_APP_ENV=development
   ```
   
   Example for `web/restaurant-portal/.env`:
   ```
   REACT_APP_API_URL=http://localhost:3001/api
   REACT_APP_ORDER_SERVICE_URL=http://localhost:5003/api
   REACT_APP_SOCKET_URL=http://localhost:5003
   ```
   
   Example for `web/admin-portal/.env`:
   ```
   REACT_APP_API_URL=http://localhost:3001/api
   REACT_APP_ORDER_SERVICE_URL=http://localhost:5003/api
   REACT_APP_RESTAURANT_SERVICE_URL=http://localhost:5004/api
   REACT_APP_PAYMENT_SERVICE_URL=http://localhost:5002/api
   REACT_APP_DELIVERY_SERVICE_URL=http://localhost:3005/api
   REACT_APP_NOTIFICATION_SERVICE_URL=http://localhost:5005/api
   ```

8. **Rider App Configuration**:
   Create `mobile/rider-app/.env` with:
   ```
   EXPO_PUBLIC_BASE_URL="http://localhost"
   EXPO_PUBLIC_AUTH_SERVICE="http://localhost:3001/api"
   EXPO_PUBLIC_ORDER_SERVICE="http://localhost:5003/api/deliveries"
   EXPO_PUBLIC_DELIVERY_SERVICE="http://localhost:3005/api/deliveries"
   EXPO_PUBLIC_NOTIFICATION_SERVICE="http://localhost:5005/api"
   EXPO_PUBLIC_SOCKET_SERVICE="http://localhost:3005"
   EXPO_PUBLIC_CLOUDNAME="your_cloudinary_cloud_name"
   EXPO_PUBLIC_UPLOAD_PRESET="your_cloudinary_upload_preset"
   ```

### 3.2 Cloud/Kubernetes Deployment Configuration

1. **Update Project IDs and Cluster Information**:
   In `scripts/full-deploy.sh` (or `scripts/deploy-without-order.sh`), modify:
   ```bash
   PROJECT_ID="your-gcp-project-id"
   CLUSTER_NAME="your-cluster-name"
   CLUSTER_ZONE="your-preferred-zone"
   ```

2. **Configure Static IPs**:
   If you need to use specific static IPs, update `scripts/assign-static-ips.sh`.
   
   Then, update all Kubernetes ConfigMaps with these IPs:
   
   Example updated sections for all ConfigMaps in `kubernetes/configmaps/`:
   ```yaml
   # Service URLs
   ORDER_SERVICE_URL: "http://your-order-service-ip:5003"
   RESTAURANT_SERVICE_URL: "http://your-restaurant-service-ip:5004"
   NOTIFICATION_SERVICE_URL: "http://your-notification-service-ip:5005"
   DELIVERY_SERVICE_URL: "http://your-delivery-service-ip:3005"
   PAYMENT_SERVICE_URL: "http://your-payment-service-ip:5002"
   USER_SERVICE_URL: "http://your-user-service-ip:3001"
   
   # Web URLs
   CUSTOMER_WEB_URL: "https://your-customer-domain"
   ADMIN_WEB_URL: "https://your-admin-domain"
   RESTAURANT_WEB_URL: "https://your-restaurant-domain"
   ```

3. **Update Kubernetes ConfigMaps**:
   For each service's ConfigMap, ensure all environment variables match your production needs.
   
   Key files to modify:
   - `kubernetes/configmaps/user-service-config.yaml`
   - `kubernetes/configmaps/restaurant-service-config.yaml`
   - `kubernetes/configmaps/order-service-config.yaml`
   - `kubernetes/configmaps/payment-service-config.yaml`
   - `kubernetes/configmaps/delivery-service-config.yaml`
   - `kubernetes/configmaps/notification-service-config.yaml`

4. **Update Kubernetes Secrets**:
   Update sensitive information in:
   
   `kubernetes/secrets/mongodb-secret.yaml`:
   ```yaml
   apiVersion: v1
   kind: Secret
   metadata:
     name: mongodb-secret
     namespace: cravecart
   type: Opaque
   data:
     username: <base64-encoded-username>
     password: <base64-encoded-password>
     connection-string: <base64-encoded-connection-string>
   ```
   
   `kubernetes/secrets/notification-secrets.yaml`:
   ```yaml
   apiVersion: v1
   kind: Secret
   metadata:
     name: notification-secrets
     namespace: cravecart
   type: Opaque
   data:
     email-password: <base64-encoded-email-password>
     notify-lk-api-key: <base64-encoded-api-key>
     firebase-service-account: <base64-encoded-service-account>
   ```
   
   `kubernetes/secrets/payment-secrets.yaml`:
   ```yaml
   apiVersion: v1
   kind: Secret
   metadata:
     name: payment-secrets
     namespace: cravecart
   type: Opaque
   data:
     stripe-secret-key: <base64-encoded-stripe-secret-key>
     stripe-webhook-secret: <base64-encoded-webhook-secret>
   ```

5. **Configure Docker Image Registry**:
   In each deployment file under `kubernetes/deployments/`, update the image repository:
   
   Example update for `kubernetes/deployments/user-service.yaml`:
   ```yaml
   spec:
     containers:
     - name: user-service
       image: gcr.io/your-project-id/user-service:latest
   ```
   
   Repeat for all deployment files.

6. **Update Service Configurations**:
   Check all service configurations in `kubernetes/services/` to ensure ports and types are correct.

7. **Configure TLS and Domain Names**:
   If using HTTPS, update `kubernetes/ingress/managed-certificate.yaml` and `kubernetes/ingress/api-ingress.yaml` with your domain names.

### 3.3 Mobile App Deployment

1. **Update Environment Variables**:
   In `mobile/rider-app/eas.json` update environment variables for each build profile:
   
   ```json
   "development": {
     "developmentClient": true,
     "distribution": "internal",
     "env": {
       "EXPO_PUBLIC_BASE_URL": "http://your-base-url",
       "EXPO_PUBLIC_AUTH_SERVICE": "http://your-user-service:3001/api",
       "EXPO_PUBLIC_ORDER_SERVICE": "http://your-order-service:5003/api/deliveries",
       "EXPO_PUBLIC_DELIVERY_SERVICE": "http://your-delivery-service:3005/api/deliveries",
       "EXPO_PUBLIC_NOTIFICATION_SERVICE": "http://your-notification-service:5005/api",
       "EXPO_PUBLIC_SOCKET_SERVICE": "http://your-delivery-service:3005",
       "EXPO_PUBLIC_CLOUDNAME": "your_cloudinary_name",
       "EXPO_PUBLIC_UPLOAD_PRESET": "your_upload_preset"
     }
   },
   "preview": {
     // Similar environment configuration
   },
   "production": {
     // Production environment configuration
   }
   ```

2. **Update Google Services**:
   If using Firebase for notifications, update `mobile/rider-app/google-services.json` with your Firebase configuration.

## 4. Deployment Commands

### For Local Development (Docker Compose):

1. Clone the repository (if not already done):
   ```
   git clone <repository-url>
   cd cravecart
   ```

2. Create `.env` files for each service based on the example files as described in section 3.1.

3. Build and start all services using Docker Compose:
   ```
   docker-compose up -d
   ```

4. To view logs for a specific service:
   ```
   docker-compose logs -f <service-name>
   ```

5. To stop all services:
   ```
   docker-compose down
   ```

### For Cloud Deployment (GKE):

1. Full deployment:
   ```bash
   bash scripts/full-deploy.sh
   ```

2. OR deployment without order service (if needed):
   ```bash
   bash scripts/deploy-without-order.sh
   ```

3. OR create cluster first, then deploy services:
   ```bash
   bash scripts/create-cluster.sh
   bash scripts/deploy-services.sh
   ```

4. For Windows users:
   ```bash
   powershell -ExecutionPolicy Bypass -File .\scripts\deploy-services.ps1
   ```

5. To deploy individual services (e.g., restaurant service):
   ```bash
   bash scripts/deploy-restaurant-service.sh
   ```

## 5. Post-Deployment Verification

1. **Verify service health**:
   ```bash
   # For local deployment
   curl http://localhost:3001/health  # User Service
   curl http://localhost:5004/health  # Restaurant Service
   # etc.
   
   # For Kubernetes deployment
   kubectl get pods -n cravecart
   kubectl logs -f deployment/user-service -n cravecart
   ```

2. **Check service connectivity**:
   Test authentication flow through the user service, then test core functionality in other services.

3. **Verify frontend applications**:
   Access the web portals and ensure they can connect to backend services:
   - Customer Portal: http://localhost:3000 (local) or your custom domain
   - Restaurant Portal: http://localhost:3002 (local) or your custom domain
   - Admin Portal: http://localhost:3003 (local) or your custom domain

4. **Check external IPs (GKE)**:
   ```bash
   kubectl get services -n cravecart
   ```

## 6. Common Issues and Troubleshooting

1. **Database Connection Issues**:
   - Verify MongoDB credentials and connection strings
   - Check network rules to ensure services can reach the database
   - Check MongoDB logs: `kubectl logs -f deployment/mongodb -n cravecart`

2. **Service Communication Issues**:
   - Ensure all service URLs in environment files are correctly set
   - Check for network policies that might block service-to-service communication
   - Test connectivity between services with curl commands

3. **Kubernetes Deployment Issues**:
   - Check pod logs: `kubectl logs -f deployment/<service-name> -n cravecart`
   - Check pod status: `kubectl describe pod <pod-name> -n cravecart`
   - Ensure ConfigMaps are correctly mounted
   - Verify that static IPs are assigned properly: `kubectl get services -n cravecart`

4. **Docker Compose Issues**:
   - Check logs with `docker-compose logs -f <service-name>`
   - Ensure required ports are free and not used by other applications
   - Verify that all services can resolve each other by hostname within the network

5. **Mobile App Issues**:
   - Ensure the environment variables point to accessible service URLs
   - Check that Cloudinary credentials for image upload are correct
   - Verify Firebase configuration for push notifications

6. **SSL/TLS Issues**:
   - Verify that managed certificates are properly provisioned
   - Check ingress configuration and annotations
   - Ensure domains are properly configured in DNS

## 7. Updating Existing Deployments

To update an already deployed system:

1. **Pull the latest code**:
   ```bash
   git pull
   ```

2. **For Docker Compose (Local)**:
   ```bash
   docker-compose down
   docker-compose build
   docker-compose up -d
   ```

3. **For Kubernetes (GKE)**:
   ```bash
   bash scripts/update-cluster.sh
   ```

4. **For individual service updates**:
   ```bash
   # Example for updating just the restaurant service
   bash scripts/deploy-restaurant-service.sh
   ```

## 8. Additional Resources

- For service-specific documentation, refer to README.md files in each service directory:
  - services/user-service/README.md
  - services/restaurant-service/README.md
  - services/order-service/README.md
  - etc.

- For Kubernetes-specific documentation, refer to:
  - kubernetes/README.md

- For mobile app development, refer to:
  - mobile/rider-app/README.md

- For detailed API endpoints:
  - Check individual service README.md files for API documentation

- For cloud infrastructure diagrams and architecture:
  - Refer to project documentation in your internal team wiki