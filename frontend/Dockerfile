# Use an official Node image for CRA build
FROM node:20-alpine AS builder
WORKDIR /app

# Install dependencies (including any CRA scripts)
COPY frontend/package*.json ./
RUN npm ci

# Copy source and build
COPY frontend/ ./
RUN npm run build

# Serve with nginx
FROM nginx:alpine
COPY --from=builder /app/build /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]