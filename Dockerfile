# Stage 1: Build the React application
FROM node:18-alpine AS builder

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json (or yarn.lock)
COPY package*.json ./
# If you use yarn, uncomment the next line and comment out the npm install line
# COPY yarn.lock ./

# Install dependencies
RUN npm install
# If you use yarn, uncomment the next line and comment out the npm install line
# RUN yarn install

# Copy the rest of the application code
COPY . .

# Build the application
# Assuming your build script is "build" in package.json
RUN npm run build

# Stage 2: Serve the application with Nginx
FROM nginx:alpine

# Copy the build output from the builder stage to Nginx's web root
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy a custom Nginx configuration file (optional, but often needed for SPAs)
# COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"] 