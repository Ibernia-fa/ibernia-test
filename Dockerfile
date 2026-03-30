# Step 1: Use Node.js to build the Angular app
FROM node:22.20.0 AS build-stage

# Build configuration: "production" (api.ibernia.it) or "development" (api-dev.ibernia.it)
# Must be passed by CI or at build time: docker build --build-arg NG_BUILD_CONFIGURATION=development
ARG NG_BUILD_CONFIGURATION

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install --legacy-peer-deps

ARG CACHE_BUST
COPY . .

# Require and show build configuration (fail if not set - avoids accidental production build)
RUN if [ -z "$NG_BUILD_CONFIGURATION" ]; then \
      echo "ERROR: NG_BUILD_CONFIGURATION build-arg is required (production or development)"; \
      exit 1; \
    fi && \
    echo "Building Angular with configuration: $NG_BUILD_CONFIGURATION"

# Build the Angular app with the chosen environment
RUN NODE_OPTIONS=--max-old-space-size=4096 npm run build -- --configuration=${NG_BUILD_CONFIGURATION} --verbose

# Verify the build produced output (basic sanity check)
RUN test -d /app/dist/ibernia-app/browser && \
    test -f /app/dist/ibernia-app/browser/index.html || \
    (echo "ERROR: Angular build output missing" && exit 1)

# Step 2: Use Nginx to serve the Angular app
FROM nginx:alpine AS production-stage

# Copy the built app to Nginx's HTML directory
COPY --from=build-stage /app/dist/ibernia-app/browser /usr/share/nginx/html

# Select freshness-first (development) vs performance/versioning-first (production) site config
COPY nginx.dev.conf nginx.prod.conf /tmp/nginx-configs/
ARG NG_BUILD_CONFIGURATION
RUN set -eux; \
    if [ "$NG_BUILD_CONFIGURATION" = "development" ]; then \
      cp /tmp/nginx-configs/nginx.dev.conf /etc/nginx/conf.d/default.conf; \
    elif [ "$NG_BUILD_CONFIGURATION" = "production" ]; then \
      cp /tmp/nginx-configs/nginx.prod.conf /etc/nginx/conf.d/default.conf; \
    else \
      echo "ERROR: NG_BUILD_CONFIGURATION must be development or production (got: ${NG_BUILD_CONFIGURATION:-empty})" >&2; \
      exit 1; \
    fi; \
    rm -rf /tmp/nginx-configs
# Expose port 80
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
