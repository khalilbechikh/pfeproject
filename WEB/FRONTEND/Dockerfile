# Use Node.js 23 on Alpine Linux for a lightweight image
FROM node:22.14.0-bookworm

# Set the working directory inside the container
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the frontend code
COPY . .

# Expose the port for the Vite development server
EXPOSE 5173

# Default command to start the Vite server
# Command to start the Vite development server
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
