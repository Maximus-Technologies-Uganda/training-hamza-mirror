# Blog Posts API - Production Dockerfile
# Multi-stage build for optimized container size

# ============================================
# Stage 1: Build dependencies
# ============================================
FROM node:20-slim AS builder

# Install build dependencies for native modules (better-sqlite3)
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including devDependencies for build)
RUN npm ci --only=production

# ============================================
# Stage 2: Production runtime
# ============================================
FROM node:20-slim AS runtime

# Install runtime dependencies for better-sqlite3
RUN apt-get update && apt-get install -y \
    libsqlite3-0 \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user for security
RUN groupadd -r nodejs && useradd -r -g nodejs nodejs

WORKDIR /app

# Copy built node_modules from builder
COPY --from=builder /app/node_modules ./node_modules

# Copy application source
COPY package*.json ./
COPY src/blog ./src/blog

# Create data directory for SQLite database
RUN mkdir -p /app/data && chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Environment variables
ENV NODE_ENV=production
ENV PORT=8080
ENV HOST=0.0.0.0
ENV STORAGE_TYPE=sqlite
ENV SQLITE_DB_PATH=/app/data/blog.db

# Cloud Run expects port 8080
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "fetch('http://localhost:8080/health').then(r => r.ok ? process.exit(0) : process.exit(1)).catch(() => process.exit(1))"

# Start the application
CMD ["node", "src/blog/server.js"]
