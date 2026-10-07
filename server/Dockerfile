# Use the official Playwright image
FROM mcr.microsoft.com/playwright:v1.40.0-jammy

WORKDIR /app

# 1. Copy ONLY the strict essential files (Bypassing .dockerignore completely)
COPY package*.json ./
COPY tsconfig.json ./
COPY src/ ./src/

# 2. Install fresh Linux dependencies
RUN npm install

# 3. Build the project natively in the container
RUN npx tsc

# 4. Expose port and start
EXPOSE 3001
CMD ["npm", "start"]