
FROM node:22-alpine AS client-build

WORKDIR /app/client

COPY client/package.json client/package-lock.json ./
RUN npm ci

COPY client/ .


ENV VITE_API_BASE_URL=""
RUN npm run build

FROM node:22-alpine

WORKDIR /app


COPY server/package.json server/package-lock.json ./
RUN npm ci --omit=dev


COPY server/ .


COPY --from=client-build /app/client/dist ./client/dist


ENV NODE_ENV=production
ENV CLIENT_BUILD_PATH=/app/client/dist

EXPOSE 5000

CMD ["node", "server.js"]
