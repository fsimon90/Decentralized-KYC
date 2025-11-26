# -------------------------------------------------
# 1. Build Stage (Node)
# -------------------------------------------------
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY dkyc-frontend/package*.json ./dkyc-frontend/

# Install dependencies including devDependencies
RUN cd dkyc-frontend && npm install --include=dev

# Copy source
COPY dkyc-frontend ./dkyc-frontend

# FIX: Ensure vite binary is executable (Windows CRLF issue)
RUN chmod -R +x dkyc-frontend/node_modules/.bin

# Build app
RUN cd dkyc-frontend && npm run build



# -------------------------------------------------
# 2. Production Stage (Nginx)
# -------------------------------------------------
FROM nginx:stable-alpine

RUN rm -rf /usr/share/nginx/html/*

COPY --from=builder /app/dkyc-frontend/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
