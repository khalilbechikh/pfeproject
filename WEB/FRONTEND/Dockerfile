# Use Node.js 22 on Debian Bookworm
FROM node:23-alpine3.20

# Set the working directory inside the container
WORKDIR /app

# Copy package files and install dependencies
COPY CODE/my-react-app/package*.json ./
RUN npm install

# Copy the rest of the frontend code
# Not needed due to volume mount, but included for completeness
COPY CODE/my-react-app/ ./

# Expose the port for the Vite development server
EXPOSE 5173

# Command to start the Vite development server with proper host argument
CMD ["sh", "-c", "cd my-react-app && ls && npm install && npm run dev"]
