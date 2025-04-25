FROM node:23-bookworm

WORKDIR /app

# copy package.json files first and install deps into image layer
COPY CODE/package*.json ./
RUN npm install

# copy the remainder of the source (except anything in .dockerignore)
COPY CODE/ .

EXPOSE 5000

# ────────────────────────────────────────────────────────────────
# On container start:
#   1) copy fresh node_modules to /modules_cache (named volume)
#   2) copy them back into the bind-mounted host folder if missing
#   3) start the dev server
# ────────────────────────────────────────────────────────────────
CMD sh -c "\
  cp -r node_modules /modules_cache 2>/dev/null || true && \
  [ -d /app/node_modules ] || cp -r /modules_cache/node_modules /app && \
  npm run dev"
