# Use the official Playwright image
FROM mcr.microsoft.com/playwright:v1.40.0-jammy

WORKDIR /app

# Copy the exact essential files
COPY package*.json ./
COPY tsconfig.json ./
COPY src/ ./src/

# Install standard dependencies, plus tsx to run the code directly
RUN npm install
RUN npm install -g tsx

# Expose the API port
EXPOSE 3001

# Execute the TypeScript file directly, bypassing the build step
CMD ["tsx", "src/index.ts"]