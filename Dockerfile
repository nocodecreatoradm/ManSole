# Use a Node.js base image
FROM node:20-alpine AS build-frontend

# Set working directory for frontend build
WORKDIR /app

# Copy frontend package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy all frontend source files and build the project
COPY . .
RUN npm run build

# Stage 2: Production environment
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy server package files and install production dependencies
COPY server/package*.json ./server/
RUN cd server && npm install --production

# Copy server source code
COPY server/ ./server/

# Copy the built frontend from the previous stage
COPY --from=build-frontend /app/dist ./dist

# Set environment variables (can be overridden by Easypanel)
ENV PORT=4000
ENV NODE_ENV=production

# Expose the port the app runs on
EXPOSE 4000

# Start the application
CMD ["node", "server/index.js"]
