# frontend/Dockerfile - Multi-stage Production Container
# Stage 1: Build static assets via Node.js
FROM node:22-alpine AS builder

WORKDIR /app

# Install dependencies with cached layers
COPY package.json package-lock.json ./
RUN npm ci

# Copy frontend source and compile production bundle
COPY . .
RUN npm run build

# Stage 2: Serve compiled assets with Alpine Nginx
FROM nginx:alpine

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy build artifacts from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
