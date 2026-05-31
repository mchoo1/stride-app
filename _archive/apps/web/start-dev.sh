#!/bin/bash
# Stride Dev Server Startup Script
# Runs the Next.js dev server from a real (non-FUSE) filesystem to avoid
# io_uring/FUSE compatibility issues with Node.js v22.

set -e

PROJECT_SRC="/sessions/pensive-laughing-hopper/mnt/Fitness App/apps/web"
DEV_DIR="/sessions/pensive-laughing-hopper/nextapp"

echo "🚀 Setting up Stride dev server..."

# Create dev directory on real ext4 disk
mkdir -p "$DEV_DIR"

# Copy source and config files
echo "📁 Syncing source files..."
cp -r "$PROJECT_SRC/src" "$DEV_DIR/"
cp "$PROJECT_SRC/package.json" "$DEV_DIR/"
cp "$PROJECT_SRC/package-lock.json" "$DEV_DIR/" 2>/dev/null || true
cp "$PROJECT_SRC/next.config.js" "$DEV_DIR/"
cp "$PROJECT_SRC/tsconfig.json" "$DEV_DIR/"
cp "$PROJECT_SRC/postcss.config.js" "$DEV_DIR/" 2>/dev/null || true
cp "$PROJECT_SRC/tailwind.config.ts" "$DEV_DIR/" 2>/dev/null || true

# Install dependencies from cache if needed
if [ ! -d "$DEV_DIR/node_modules/next" ]; then
  echo "📦 Installing dependencies (from npm cache)..."
  cd "$DEV_DIR" && npm install --prefer-offline
fi

# Start the dev server
echo "✅ Starting Next.js dev server at http://localhost:3000"
cd "$DEV_DIR" && node node_modules/.bin/next dev --port 3000
