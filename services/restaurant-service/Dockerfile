FROM node:18-alpine

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY . .

# Expose the correct port for restaurant service
EXPOSE 5004

# Add healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 CMD wget --no-verbose --tries=1 --spider http://localhost:5004/health || exit 1

# Use node directly instead of npm for better container signal handling
CMD ["node", "src/server.js"]
