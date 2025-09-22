# Middleware Session Generator Automation

This automation script generates daily session data for your Middleware dashboard by automatically interacting with the frontend application.

## Overview

The automation performs the following actions:
1. Navigates to the frontend application
2. Waits for the page and Middleware script to load
3. Clicks the "Call User API" button to trigger API calls
4. Browses additional pages to generate comprehensive session data
5. Ensures fresh data is available on your Middleware dashboard daily

## Files

- `index.js` - Main Playwright automation script
- `package.json` - Node.js dependencies
- `Dockerfile` - Container image configuration
- `cronjob.yaml` - Kubernetes CronJob manifest
- `build.sh` - Build script for Docker image

## Quick Start

### 1. Build the Docker Image

```bash
# Make the build script executable
chmod +x build.sh

# Build the image
./build.sh

# Or build manually:
docker build -t middleware-session-generator:latest .
```

### 2. Deploy to Kubernetes

```bash
# Deploy the CronJob
kubectl apply -f cronjob.yaml

# Check the CronJob status
kubectl get cronjobs

# View logs of the most recent job
kubectl logs -l app=middleware-session-generator --tail=100
```

### 3. Manual Testing

```bash
# Run a one-time job to test
kubectl create job --from=cronjob/middleware-session-generator test-session-gen

# Check the job status
kubectl get jobs

# View logs
kubectl logs job/test-session-gen
```

## Configuration

### Environment Variables

- `FRONTEND_URL`: URL of the frontend service (default: `http://frontend:80`)
- `NODE_ENV`: Node.js environment (default: `production`)
- `LOG_LEVEL`: Logging level (default: `info`)

### Schedule

The CronJob is configured to run daily at 2:00 AM UTC. To change the schedule, modify the `schedule` field in `cronjob.yaml`:

```yaml
spec:
  # Examples:
  schedule: "0 2 * * *"    # Daily at 2:00 AM UTC
  schedule: "0 */6 * * *"  # Every 6 hours
  schedule: "*/30 * * * *" # Every 30 minutes (for testing)
```

## Monitoring

### Check CronJob Status

```bash
# List all CronJobs
kubectl get cronjobs

# Get detailed information
kubectl describe cronjob middleware-session-generator

# View recent jobs
kubectl get jobs -l app=middleware-session-generator
```

### View Logs

```bash
# Latest job logs
kubectl logs -l app=middleware-session-generator --tail=100

# Specific job logs
kubectl logs job/middleware-session-generator-<timestamp>

# Follow logs in real-time (during testing)
kubectl logs -f job/test-session-gen
```

### Troubleshooting

1. **Job fails to start**: Check resource limits and node capacity
2. **Cannot reach frontend**: Verify the frontend service is running and accessible
3. **Timeout errors**: Increase `activeDeadlineSeconds` in the CronJob spec
4. **Image pull errors**: Ensure the Docker image is available in your cluster

## Security

The automation runs with:
- Non-root user (UID 1000)
- Minimal RBAC permissions
- Read-only root filesystem where possible
- Resource limits to prevent resource exhaustion

## Customization

To modify the automation behavior, edit `index.js`:

- Change pages to visit
- Modify wait times
- Add additional interactions
- Customize error handling

After making changes, rebuild the Docker image and redeploy:

```bash
./build.sh
kubectl rollout restart cronjob/middleware-session-generator
```
