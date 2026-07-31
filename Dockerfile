# ---- Stage 1: Build the React client ----
FROM node:22-alpine AS client-build

WORKDIR /app/client

COPY client/package.json client/package-lock.json ./
RUN npm ci

COPY client/ .

# Build with empty API base URL so the client uses same-origin requests
ENV VITE_API_BASE_URL=""
RUN npm run build

# ---- Stage 2: Run the Express server ----
FROM node:22-alpine

WORKDIR /app

# Install server dependencies
COPY server/package.json server/package-lock.json ./
RUN npm ci --omit=dev

# Copy server source
COPY server/ .

# Copy client build output into the location the server expects
COPY --from=client-build /app/client/dist ./client/dist

# Railway injects PORT as an env variable
ENV NODE_ENV=production
ENV CLIENT_BUILD_PATH=/app/client/dist

EXPOSE 5000

CMD ["node", "server.js"]
