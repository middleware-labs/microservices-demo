#!/bin/bash

# Deployment script for Middleware Session Generator

set -e

echo "🚀 Deploying Middleware Session Generator Automation..."

# Check if we're in the right directory
if [[ ! -f "Dockerfile" ]] || [[ ! -f "cronjob.yaml" ]]; then
    echo "❌ Error: Please run this script from the automation directory"
    exit 1
fi

# Check if kubectl is available
if ! command -v kubectl &> /dev/null; then
    echo "❌ Error: kubectl is not installed or not in PATH"
    exit 1
fi

# Check if docker is available
if ! command -v docker &> /dev/null; then
    echo "❌ Error: docker is not installed or not in PATH"
    exit 1
fi

echo "📦 Building Docker image..."
./build.sh

echo ""
echo "🔍 Checking Kubernetes cluster connection..."
kubectl cluster-info --request-timeout=10s > /dev/null
if [[ $? -ne 0 ]]; then
    echo "❌ Error: Unable to connect to Kubernetes cluster"
    exit 1
fi

echo "✅ Connected to Kubernetes cluster"

echo ""
echo "🚀 Deploying CronJob to Kubernetes..."
kubectl apply -f cronjob.yaml

echo ""
echo "✅ Deployment completed successfully!"

echo ""
echo "📊 Checking deployment status..."
kubectl get cronjobs middleware-session-generator

echo ""
echo "🧪 Running a test job to verify the setup..."
kubectl create job --from=cronjob/middleware-session-generator test-middleware-session-$(date +%s) 2>/dev/null || echo "Note: Test job creation skipped (may already exist)"

echo ""
echo "📋 Useful commands:"
echo "• Check CronJob status: kubectl get cronjobs"
echo "• View recent jobs: kubectl get jobs -l app=middleware-session-generator"
echo "• Check logs: kubectl logs -l app=middleware-session-generator --tail=50"
echo "• Manual test run: kubectl create job --from=cronjob/middleware-session-generator manual-test-\$(date +%s)"

echo ""
echo "⏰ The CronJob is scheduled to run daily at 2:00 AM UTC"
echo "   You can modify the schedule in cronjob.yaml if needed"

echo ""
echo "🎯 The automation will:"
echo "   1. Navigate to your frontend application"
echo "   2. Click the 'Call User API' button"
echo "   3. Browse additional pages to generate session data"
echo "   4. Ensure fresh data appears on your Middleware dashboard"

echo ""
echo "✨ Setup complete! Your Middleware dashboard should receive fresh session data daily."
