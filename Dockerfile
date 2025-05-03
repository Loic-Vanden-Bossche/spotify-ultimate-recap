# --- Build Stage ---
FROM node:22-alpine AS builder

WORKDIR /app

# Install dependencies
COPY ./app/package.json ./app/package-lock.json* ./
RUN npm ci

# Copy source code
COPY ./app .

# Generate Prisma Client
RUN npx prisma generate

# Build the Astro SSR app
RUN npm run build

# remove file in prisma/generated/client/linux-musl-openssl-3.0.x
RUN rm -f ./src/generated/client/linux-musl-openssl-3.0.x

# Move necessary files to the correct location
RUN mv ./src/generated/client/libquery_engine-debian-openssl-3.0.x.so.node node_modules/.prisma/client/libquery_engine-debian-openssl-3.0.x.so.node

# --- Production Stage ---
FROM node:22-slim

RUN apt-get update \
    && apt-get install -y --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/*

# Create a non-root user
RUN groupadd -r app && useradd -r -g app app

WORKDIR /app

# Install only production dependencies
COPY ./app/package.json ./app/package-lock.json* ./
RUN npm config set ignore-scripts true && npm ci --omit=dev

# Copy built assets
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public
COPY --from=builder /app/.astro ./.astro
COPY --from=builder /app/astro.config.* ./
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Set environment variables
ENV NODE_ENV=production

# Set file permissions
RUN chown -R app:app /app

# Use non-root user
USER app

# Expose the application port
EXPOSE 4321

# Start the server
CMD ["node", "./dist/server/entry.mjs"]