# Frontend React + Vite — build rồi serve tĩnh bằng nginx.
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci 2>/dev/null || npm install
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
# Proxy /api và /audio sang backend (xem nginx.conf nếu cần đổi host).
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
