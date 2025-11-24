#!/bin/bash
# Start Expo development server for iOS

echo "🚀 Starting Expo development server for iOS..."
echo "📱 This will open the iOS Simulator automatically"
echo ""

cd "$(dirname "$0")"
npx expo start --ios


