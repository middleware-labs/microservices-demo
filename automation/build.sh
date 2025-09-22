#!/bin/bash

# Build script for Middleware Session Generator automation

set -e

echo "Building Middleware Session Generator Docker image..."

# Get the current directory name
DIR_NAME=$(basename "$(pwd)")

# Image name and tag
IMAGE_NAME="ghcr.io/middleware-labs/middleware-session-generator"
IMAGE_TAG="latest"
FULL_IMAGE_NAME="${IMAGE_NAME}:${IMAGE_TAG}"

echo "Building image: ${FULL_IMAGE_NAME}"

# Build the Docker image
docker build -t "${FULL_IMAGE_NAME}" .

echo "✅ Successfully built ${FULL_IMAGE_NAME}"

# Optional: Tag with current timestamp for versioning
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
TIMESTAMPED_TAG="${IMAGE_NAME}:${TIMESTAMP}"

docker tag "${FULL_IMAGE_NAME}" "${TIMESTAMPED_TAG}"
echo "✅ Also tagged as ${TIMESTAMPED_TAG}"

echo ""
echo "Image build complete! You can now:"
echo "1. Deploy to Kubernetes: kubectl apply -f cronjob.yaml"
echo "2. Run a test job: kubectl create job --from=cronjob/middleware-session-generator test-session-gen"
echo "3. Check logs: kubectl logs -l app=middleware-session-generator"

# Show image size
echo ""
echo "Image details:"
docker images "ghcr.io/middleware-labs/middleware-session-generator" --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}\t{{.CreatedAt}}"
