#!/bin/bash

# CementOS Cloud Run Deployment Script
# This script builds and deploys the CementOS system to Google Cloud Run

set -e

# Configuration
PROJECT_ID="mistri-472714"
SERVICE_NAME="cemenos"
REGION="us-central1"
IMAGE_NAME="gcr.io/${PROJECT_ID}/${SERVICE_NAME}"

echo "🚀 Starting CementOS deployment to Cloud Run..."

# Check if gcloud is installed and authenticated
if ! command -v gcloud &> /dev/null; then
    echo "❌ gcloud CLI is not installed. Please install it first."
    exit 1
fi

# Set the project
echo "📋 Setting project to ${PROJECT_ID}..."
gcloud config set project ${PROJECT_ID}

# Enable required APIs
echo "🔧 Enabling required APIs..."
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com

# Build the Docker image using Cloud Build
echo "🏗️  Building Docker image..."
gcloud builds submit --tag ${IMAGE_NAME} .

# Deploy to Cloud Run
echo "🚀 Deploying to Cloud Run..."
gcloud run deploy ${SERVICE_NAME} \
    --image ${IMAGE_NAME} \
    --platform managed \
    --region ${REGION} \
    --allow-unauthenticated \
    --memory 2Gi \
    --cpu 2 \
    --timeout 300 \
    --concurrency 80 \
    --max-instances 10 \
    --set-env-vars "PROJECT_ID=${PROJECT_ID}" \
    --set-env-vars "ENVIRONMENT=production" \
    --port 8080

# Get the service URL
SERVICE_URL=$(gcloud run services describe ${SERVICE_NAME} --region=${REGION} --format="value(status.url)")

echo "✅ Deployment completed successfully!"
echo "🌐 Service URL: ${SERVICE_URL}"
echo "📊 Health Check: ${SERVICE_URL}/health"
echo "📚 API Documentation: ${SERVICE_URL}/docs"
echo "💬 Chat Endpoint: ${SERVICE_URL}/chat"

# Test the deployment
echo "🧪 Testing deployment..."
if curl -f "${SERVICE_URL}/health" > /dev/null 2>&1; then
    echo "✅ Health check passed!"
else
    echo "❌ Health check failed. Please check the logs:"
    echo "gcloud logs read --service=${SERVICE_NAME} --region=${REGION}"
fi

echo "🎉 CementOS is now live at: ${SERVICE_URL}"
