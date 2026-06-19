# syntax=docker/dockerfile:1.7

FROM oven/bun:1-slim AS base
WORKDIR /app

FROM base AS deps
COPY package.json bun.lock .npmrc ./
RUN bun install --frozen-lockfile

FROM deps AS build
COPY tsconfig.json vite.config.ts index.html components.json ./
COPY static ./static
COPY src ./src
COPY server ./server
RUN bun run build

FROM base AS runtime
ENV NODE_ENV=production
ENV PORT=3000

COPY package.json bun.lock .npmrc ./
RUN bun install --frozen-lockfile --production
COPY server ./server
COPY --from=build /app/dist ./dist

USER bun
EXPOSE 3000
CMD ["bun", "run", "start"]
