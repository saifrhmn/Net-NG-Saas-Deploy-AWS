# ---------- build ----------
FROM node:20-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Optional: override the API URL baked into environment.prod.ts
#   docker build --build-arg API_BASE_URL=https://api.example.com/api/ .
ARG API_BASE_URL=""
RUN if [ -n "$API_BASE_URL" ]; then \
      sed -i "s#^\([[:space:]]*BASE_URL:[[:space:]]*\)'[^']*'#\1'${API_BASE_URL}'#" src/environments/environment.prod.ts; \
    fi \
 && npx ng build --configuration production

# ---------- runtime ----------
FROM nginx:1.27-alpine AS final
COPY nginx.conf /etc/nginx/conf.d/default.conf
# Angular 17+ application builder outputs to dist/<name>/browser
COPY --from=build /app/dist/berger-karbar/browser /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
