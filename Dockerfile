# Stage 1: build
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .

ARG _VITE_TIMETRACKER_BACKEND_URL
CMD sh -c 'echo "APP_ENV=$_VITE_TIMETRACKER_BACKEND_URL"' 
RUN npm run build

# Stage 2: serve con nginx
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]