# Migration Image
FROM node:22-alpine

# Set working directory
WORKDIR /app

# Only copy package files first for better cache
COPY ./app/package.json ./app/package-lock.json ./

# Install only production dependencies
RUN npm ci

# Copy prisma schema and migrations
COPY ./app/prisma ./prisma

# Set default command to deploy migrations
CMD ["npx", "prisma", "migrate", "deploy"]