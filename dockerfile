# Stage 1: Build Stage
FROM node:18-alpine as build

# Set the working directory inside the container
WORKDIR /app

# Copy the package.json and package-lock.json (if you have one)
COPY package*.json ./

# Install the dependencies
RUN npm install --production

# Copy the rest of the application
COPY . .

# Stage 2: Runtime Stage
FROM node:18-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy only the necessary files from the build stage
COPY --from=build /app /app

# Expose the port your app runs on (3001 in this case)
EXPOSE 3001

# Command to run your app
CMD ["node", "server.js"]  
# Adjust according to your app's entry point