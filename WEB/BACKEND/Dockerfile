FROM node:23-bookworm

WORKDIR /app

COPY CODE/package*.json ./

RUN npm install

COPY CODE/ .

EXPOSE 5000

# On startup: copy installed modules to host volume, then run server
CMD ["sh", "-c", "cp -r node_modules /app_host && npm run dev"]
