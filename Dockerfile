# Use Node.js 18 as the base image
FROM node:18-alpine AS base

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json (if available)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Build the frontend
FROM base AS frontend-build
WORKDIR /app/frontend
RUN npm install
RUN npm run build

# Final stage: Setup the backend and copy built frontend
FROM node:18-alpine AS production

# Set working directory
WORKDIR /app

# Copy backend package.json and install dependencies
COPY package*.json ./
RUN npm install --only=production

# Copy backend source code
COPY backend/ ./backend/

# Copy built frontend from the frontend-build stage
COPY --from=frontend-build /app/frontend/dist ./frontend/dist

# Expose the port the app runs on
EXPOSE 5000

# Command to run the application
CMD ["node", "backend/src/index.js"]