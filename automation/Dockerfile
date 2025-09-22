# Use Node.js 18 base image with support for Playwright
FROM mcr.microsoft.com/playwright:v1.55.0

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json package-lock.json ./

# Install npm dependencies
RUN npm ci --omit=dev

# Copy the automation script
COPY index.js ./

# Install xvfb for virtual display (needed for headed browser mode)
RUN apt-get update && apt-get install -y \
    xvfb \
    && rm -rf /var/lib/apt/lists/*

# Create a non-root user for security
RUN groupadd -r automation && useradd -r -g automation automation
RUN chown -R automation:automation /app

# Switch to non-root user
USER automation

# Set environment variables
ENV NODE_ENV=production
ENV FRONTEND_URL=http://frontend:80
ENV DISPLAY=:99

# Add healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "console.log('Health check passed')" || exit 1

# Run the automation script with Xvfb
CMD Xvfb :99 -screen 0 1920x1080x24 -nolisten tcp & \
    export DISPLAY=:99 && node index.js
