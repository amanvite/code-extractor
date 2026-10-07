# Use the official Playwright image containing Node.js and Chromium
FROM mcr.microsoft.com/playwright:v1.40.0-jammy

WORKDIR /app

# Install standard dependencies
COPY package*.json ./
RUN npm install

# Copy source code and build
COPY . .
RUN npm run build

# Expose the API port
EXPOSE 3001

# Start the server
CMD ["npm", "start"]