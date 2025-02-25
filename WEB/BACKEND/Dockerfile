# Use your original Node.js version
FROM node:22.14.0-bookworm

# Set the working directory inside the container
WORKDIR /app

# Copy package files and install dependencies
COPY CODE/package*.json ./
RUN npm install

# Copy the rest of the application code
COPY CODE/ .

# Expose port 5000 (as in your original Dockerfile)
EXPOSE 5000

# Start the server using your original start command
CMD ["npm", "run", "dev"]