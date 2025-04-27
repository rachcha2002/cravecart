# Use Node.js 18 Alpine as the base image
FROM node:18-alpine

# Set working directory
WORKDIR /usr/src/app

# Install dependencies first (for better caching)
COPY package*.json ./
RUN npm install

# Copy application code
COPY . .

# Expose the correct port for user service
EXPOSE 3001

# Add healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 CMD wget --no-verbose --tries=1 --spider http://localhost:3001/health || exit 1

# Use node directly instead of npm for better container signal handling
CMD ["node", "src/server.js"]