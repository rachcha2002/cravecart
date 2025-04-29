# CraveCart - Food Delivery Platform

CraveCart is a comprehensive food delivery platform built using a microservices architecture. This system connects customers, restaurants, and delivery personnel through a modern, scalable application stack.

![CraveCart Logo](https://res.cloudinary.com/dn1w8k2l1/image/upload/v1745527245/logo_jxgxfg.png)

## System Overview

CraveCart consists of the following components:

### Core Microservices

- **User Service**: Handles authentication, user profiles, and role management
- **Restaurant Service**: Manages restaurant profiles, menus, and availability
- **Order Service**: Processes and tracks food orders
- **Payment Service**: Processes payments via Stripe
- **Delivery Service**: Manages delivery personnel and order deliveries
- **Notification Service**: Sends notifications via email, SMS, and push notifications

### Client Applications

- **Customer Portal**: Web interface for customers to browse restaurants and place orders
- **Restaurant Portal**: Web dashboard for restaurant owners to manage menu and orders
- **Admin Portal**: Web interface for system administrators
- **Rider App**: Mobile application for delivery personnel (iOS & Android)

## Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: MongoDB
- **Frontend**: React, TypeScript, Tailwind CSS
- **Mobile**: React Native with Expo
- **Infrastructure**: Docker, Kubernetes, Google Cloud Platform
- **API Gateway**: Express-based API gateway
- **Authentication**: JWT
- **Payments**: Stripe
- **Notifications**: Email, SMS (via Notify.lk), Firebase Cloud Messaging

## Prerequisites

- Node.js (v18 or higher)
- Docker and Docker Compose
- MongoDB (local or Atlas)
- Google Cloud SDK (for GKE deployment)
- kubectl (for Kubernetes)

## Local Development

### Setup Environment Files

Each service requires its own `.env` file. Create these based on the example files:

```
cp services/user-service/.env.example services/user-service/.env
cp services/restaurant-service/.env.example services/restaurant-service/.env
cp services/order-service/.env.example services/order-service/.env
cp services/payment-service/.env.example services/payment-service/.env
cp services/delivery-service/.env.example services/delivery-service/.env
cp services/notification-service/.env.example services/notification-service/.env
```

For web applications:

```
cp web/customer-portal/.env.example web/customer-portal/.env
cp web/restaurant-portal/.env.example web/restaurant-portal/.env
cp web/admin-portal/.env.example web/admin-portal/.env
```

For the rider app:

```
cp mobile/rider-app/.env.example mobile/rider-app/.env
```

### Docker Compose Deployment

To start all services locally:

```bash
docker-compose up -d
```

This will start:
- All backend microservices
- Web portals (Customer, Restaurant, Admin)
- MongoDB (if configured)

To stop all services:

```bash
docker-compose down
```

### Accessing Local Services

- Customer Portal: http://localhost:3000
- Restaurant Portal: http://localhost:3002
- Admin Portal: http://localhost:3003
- User Service API: http://localhost:3001
- Restaurant Service API: http://localhost:5004
- Order Service API: http://localhost:5003
- Payment Service API: http://localhost:5002
- Delivery Service API: http://localhost:3005
- Notification Service API: http://localhost:5005

## Cloud Deployment (GKE)

The project includes scripts for deploying to Google Kubernetes Engine (GKE).

### Setup Google Cloud Project

1. Create a GCP project
2. Enable required APIs:
   - Kubernetes Engine API
   - Container Registry API
   - Cloud Storage API

3. Update project ID in deployment scripts:
   
   In `scripts/full-deploy.sh`:
   ```
   PROJECT_ID="your-gcp-project-id"
   CLUSTER_NAME="your-cluster-name"
   CLUSTER_ZONE="your-preferred-zone"
   ```

### Deploy to GKE

#### Option 1: Full Deployment

```bash
bash scripts/full-deploy.sh
```

This script:
- Creates a GKE cluster (if it doesn't exist)
- Builds and pushes Docker images for all services
- Deploys all Kubernetes resources
- Applies ConfigMaps and Secrets
- Sets up required networking

#### Option 2: Deploy Without Order Service

```bash
bash scripts/deploy-without-order.sh
```

#### Option 3: Create Cluster First, Then Deploy Services

```bash
bash scripts/create-cluster.sh
bash scripts/deploy-services.sh
```

### Access Cloud-Deployed Services

After deployment, services will be accessible via their external IPs:

```bash
kubectl get services -n cravecart
```

## Mobile Rider App Development

### Prerequisites
- Node.js
- npm or yarn
- Expo CLI
- Android Studio or Xcode (for emulator/simulator)

### Setup

1. Install dependencies:
   ```bash
   cd mobile/rider-app
   npm install
   ```

2. Configure environment:
   Edit `.env` file with appropriate service URLs.

3. Start development server:
   ```bash
   npx expo start
   ```

4. Build for production:
   ```bash
   npx eas build --platform android
   # or
   npx eas build --platform ios
   ```

## Project Structure

```
cravecart/
├── docker-compose.yml            # Local development setup with Docker
├── kubernetes/                   # Kubernetes deployment files
│   ├── configmaps/               # Environment configurations
│   ├── deployments/              # Service deployments
│   ├── services/                 # Service exposing configurations
│   └── ...
├── mobile/                       # Mobile applications
│   └── rider-app/                # Delivery personnel app
├── scripts/                      # Deployment and utility scripts
├── services/                     # Backend microservices
│   ├── api-gateway/              # API Gateway service
│   ├── delivery-service/         # Delivery management service
│   ├── notification-service/     # Notification service
│   ├── order-service/            # Order management service
│   ├── payment-service/          # Payment processing service
│   ├── restaurant-service/       # Restaurant management service
│   └── user-service/             # User authentication and management
└── web/                          # Web applications
    ├── admin-portal/             # Admin dashboard
    ├── customer-portal/          # Customer-facing website
    └── restaurant-portal/        # Restaurant dashboard
```

## API Documentation

Each service has its own API endpoints. Refer to the README files in each service directory for details:

- [User Service API](/services/user-service/README.md)
- [Restaurant Service API](/services/restaurant-service/README.md)
- [Order Service API](/services/order-service/README.md)
- [Payment Service API](/services/payment-service/README.md)
- [Delivery Service API](/services/delivery-service/README.md)
- [Notification Service API](/services/notification-service/README.md)

## Common Issues and Troubleshooting

### Database Connection Issues
- Verify MongoDB credentials and connection strings
- Check if MongoDB is running locally or if Atlas connection is valid
- Ensure correct database names are being used

### Service Communication Issues
- Check if service URLs in .env files are correctly configured
- Verify that Docker network is functioning properly
- For Kubernetes, check if services have the correct selectors

### Kubernetes Deployment Issues
- Check pod logs: `kubectl logs -f deployment/<service-name> -n cravecart`
- Ensure ConfigMaps are correctly mounted 
- Verify that static IPs are assigned properly

### Web App Issues
- Check browser console for errors
- Verify API endpoints in environment variables
- Check if backend services are accessible

### Mobile App Issues
- Ensure environment variables point to accessible service URLs
- Verify Cloudinary configuration for image uploads
- Check Firebase configuration for push notifications

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the ISC License.

## Acknowledgements

- [Express.js](https://expressjs.com/)
- [MongoDB](https://www.mongodb.com/)
- [React](https://reactjs.org/)
- [React Native](https://reactnative.dev/)
- [Expo](https://expo.dev/)
- [Docker](https://www.docker.com/)
- [Kubernetes](https://kubernetes.io/)
- [Stripe](https://stripe.com/)
- [Tailwind CSS](https://tailwindcss.com/)
