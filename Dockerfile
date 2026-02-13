# Step 1: Use Node.js to build the Angular app
FROM node:22.20.0 as build-stage

# Build configuration: "production" (api.ibernia.it) or "development" (api-dev.ibernia.it)
# Must be passed by CI or at build time: docker build --build-arg NG_BUILD_CONFIGURATION=development
ARG NG_BUILD_CONFIGURATION

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install --legacy-peer-deps

# Copy the Angular project files
COPY . .

# Build the Angular app with the chosen environment
RUN npm run build -- --configuration=${NG_BUILD_CONFIGURATION} --verbose

# Step 2: Use Nginx to serve the Angular app
FROM nginx:alpine as production-stage

# Copy the built app to Nginx's HTML directory
COPY --from=build-stage /app/dist/ibernia-app/browser /usr/share/nginx/html

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf
# Expose port 80
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
