#!/bin/bash

# StudioSyncWork Integration Tests Runner
# This script runs all integration tests for Supabase and Cloudinary

echo "🚀 Starting StudioSyncWork Integration Tests..."
echo "=============================================="

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Run Supabase integration tests
echo ""
echo "🔧 Running Supabase Integration Tests..."
echo "----------------------------------------"
npm run test src/integrations/supabase/__tests__/

# Run Cloudinary integration tests
echo ""
echo "☁️  Running Cloudinary Integration Tests..."
echo "-------------------------------------------"
npm run test src/integrations/cloudinary/__tests__/

# Run all integration tests together
echo ""
echo "🧪 Running All Integration Tests..."
echo "------------------------------------"
npm run test:run

echo ""
echo "✅ Integration tests completed!"
echo "=============================================="
