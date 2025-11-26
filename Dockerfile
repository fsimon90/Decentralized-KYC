# -------------------------------------------------
# 1. Build Stage (Node)
# -------------------------------------------------
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY dkyc-frontend/package*.json ./dkyc-frontend/

# Install all dependencies INCLUDING devDependencies
ENV NODE_ENV=development
RUN cd dkyc-frontend && npm install --include=dev

# Copy the rest of the project
COPY dkyc-frontend ./dkyc-frontend

# Build the Vite project
RUN cd dkyc-frontend && npm run build



# -------------------------------------------------
# 2. Production Stage (Nginx)
# -------------------------------------------------
FROM nginx:stable-alpine

RUN rm -rf /usr/share/nginx/html/*

COPY --from=builder /app/dkyc-frontend/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
