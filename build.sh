#!/bin/bash
# Lekhoni Kahini - Build & Submit Script
# Usage:
#   ./build.sh preview    → Build APK for testing
#   ./build.sh production → Build AAB for Play Store
#   ./build.sh submit     → Build + Submit to Play Store

set -e

echo "🇵🇰 Lekhoni Kahini - Build Script"
echo "================================="

# Check eas-cli
if ! command -v eas &> /dev/null; then
  echo "📦 Installing eas-cli..."
  npm install -g eas-cli
fi

# Login check
echo "🔐 Checking EAS login..."
eas whoami || eas login

case "${1:-preview}" in
  preview)
    echo "🔨 Building APK (preview)..."
    eas build --platform android --profile preview
    ;;
  production)
    echo "🔨 Building AAB (production)..."
    eas build --platform android --profile production
    ;;
  submit)
    echo "🚀 Building + Submitting to Play Store..."
    eas build --platform android --profile production --auto-submit
    ;;
  *)
    echo "Usage: ./build.sh [preview|production|submit]"
    exit 1
    ;;
esac

echo "✅ Done!"
