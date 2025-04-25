FROM node:23-bookworm

WORKDIR /app

# copy package.json files first and install deps into image layer
COPY CODE/package*.json ./
RUN npm install

# copy the remainder of the source (except anything in .dockerignore)
COPY CODE/ .

EXPOSE 5000
CMD ["sh", "-c", "npm install && npm run dev"]
