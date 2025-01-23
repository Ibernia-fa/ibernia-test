# Step 1: Use Node.js to build the Angular app
FROM node:18 as build-stage

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install --legacy-peer-deps

# Copy the Angular project files
COPY . .

# Build the Angular app
RUN npm run build --prod

# Step 2: Use Nginx to serve the Angular app
FROM nginx:alpine as production-stage

# Copy the built app to Nginx's HTML directory
COPY --from=build-stage /app/dist/ibernia-app/browser /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
