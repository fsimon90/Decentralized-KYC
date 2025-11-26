# -------------------------------------------------
# 1. Build Stage (Node)
# -------------------------------------------------
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy only package files first (for caching dependencies)
COPY dkyc-frontend/package*.json ./dkyc-frontend/

# Install dependencies
RUN cd dkyc-frontend && npm install

# Copy rest of the frontend project
COPY dkyc-frontend ./dkyc-frontend

# Build the Vite React app
RUN cd dkyc-frontend && npm run build



# -------------------------------------------------
# 2. Production Stage (Nginx)
# -------------------------------------------------
FROM nginx:stable-alpine

# Remove default nginx static files
RUN rm -rf /usr/share/nginx/html/*

# Copy built frontend files from the builder stage
COPY --from=builder /app/dkyc-frontend/dist /usr/share/nginx/html

# Copy custom nginx config (Optional if you want SPA routing)
# COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
