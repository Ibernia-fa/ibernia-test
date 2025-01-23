FROM node:lts as build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install --legacy-peer-deps
RUN npm install -g @angular/cli
COPY . .
RUN ng build --configuration=production

FROM nginx:latest
USER root
COPY nginx.conf /etc/nginx/nginx.conf
COPY --from=build app/dist/ibernia-app/browser /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]