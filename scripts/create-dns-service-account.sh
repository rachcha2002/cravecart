#!/bin/bash

# Set your GCP project ID
PROJECT_ID="your-gcp-project-id"

# Create service account
gcloud iam service-accounts create dns01-solver \
  --project $PROJECT_ID \
  --display-name "dns01-solver"

# Create service account key
gcloud iam service-accounts keys create key.json \
  --project $PROJECT_ID \
  --iam-account dns01-solver@$PROJECT_ID.iam.gserviceaccount.com

# Grant the IAM role
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member serviceAccount:dns01-solver@$PROJECT_ID.iam.gserviceaccount.com \
  --role roles/dns.admin

# Create Kubernetes secret from the key file
kubectl create secret generic clouddns-dns01-solver-svc-acct \
  --from-file=key.json

# Clean up the key file
rm key.json 