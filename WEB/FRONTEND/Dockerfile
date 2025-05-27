# Use Node.js 23 Alpine
FROM node:23-alpine3.20

# Set the working directory inside the container to the app root
WORKDIR /app/my-react-app

# Copy package files and install dependencies
COPY CODE/my-react-app/package*.json ./
RUN npm install

# Copy the rest of the frontend code (optional, for build context completeness)
COPY CODE/my-react-app/ ./

# Expose the port for the Vite development server
EXPOSE 5173

# Command to start the Vite development server, with ls for debugging
CMD ["sh", "-c", "ls -l && npm install && npm run dev"]
