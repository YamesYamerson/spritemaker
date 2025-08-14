#!/bin/bash

# Copy All GIMP Icons Script
# This script copies all available GIMP icons to our assets folder for browsing

echo "🎨 Copying all GIMP icons to assets folder..."

# Create the icons directory if it doesn't exist
mkdir -p public/icons/gimp-all/svg
mkdir -p public/icons/gimp-all/png-16
mkdir -p public/icons/gimp-all/png-24
mkdir -p public/icons/gimp-all/png-32
mkdir -p public/icons/gimp-all/png-48
mkdir -p public/icons/gimp-all/default-svg
mkdir -p public/icons/gimp-all/symbolic-svg

# GIMP installation paths to check
GIMP_PATHS=(
    "/Applications/GIMP.app/Contents/Resources/share/gimp/3.0/icons"
    "/Applications/GIMP.app/Contents/Resources/share/gimp/2.10/icons"
    "/usr/share/gimp/2.0/icons"
    "/usr/local/share/gimp/2.0/icons"
)

# Find the actual GIMP icons path
GIMP_ICONS_PATH=""
for path in "${GIMP_PATHS[@]}"; do
    if [ -d "$path" ]; then
        GIMP_ICONS_PATH="$path"
        echo "✅ Found GIMP icons at: $path"
        break
    fi
done

if [ -z "$GIMP_ICONS_PATH" ]; then
    echo "❌ GIMP icons not found in expected locations"
    echo "Please install GIMP or check the installation path"
    exit 1
fi

echo "📁 Copying icons from: $GIMP_ICONS_PATH"

# Copy all SVG icons (scalable)
if [ -d "$GIMP_ICONS_PATH/Legacy/scalable/apps" ]; then
    echo "📋 Copying SVG icons..."
    cp -r "$GIMP_ICONS_PATH/Legacy/scalable/apps"/* public/icons/gimp-all/svg/
fi

# Copy all PNG icons from different sizes
if [ -d "$GIMP_ICONS_PATH/Legacy/16x16/apps" ]; then
    echo "📋 Copying 16x16 PNG icons..."
    cp -r "$GIMP_ICONS_PATH/Legacy/16x16/apps"/* public/icons/gimp-all/png-16/
fi

if [ -d "$GIMP_ICONS_PATH/Legacy/24x24/apps" ]; then
    echo "📋 Copying 24x24 PNG icons..."
    cp -r "$GIMP_ICONS_PATH/Legacy/24x24/apps"/* public/icons/gimp-all/png-24/
fi

if [ -d "$GIMP_ICONS_PATH/Legacy/32x32/apps" ]; then
    echo "📋 Copying 32x32 PNG icons..."
    cp -r "$GIMP_ICONS_PATH/Legacy/32x32/apps"/* public/icons/gimp-all/png-32/
fi

if [ -d "$GIMP_ICONS_PATH/Legacy/48x48/apps" ]; then
    echo "📋 Copying 48x48 PNG icons..."
    cp -r "$GIMP_ICONS_PATH/Legacy/48x48/apps"/* public/icons/gimp-all/png-48/
fi

# Copy Default theme icons if available
if [ -d "$GIMP_ICONS_PATH/Default/scalable/apps" ]; then
    echo "📋 Copying Default theme SVG icons..."
    cp -r "$GIMP_ICONS_PATH/Default/scalable/apps"/* public/icons/gimp-all/default-svg/
fi

# Copy Symbolic theme icons if available
if [ -d "$GIMP_ICONS_PATH/Symbolic/scalable/apps" ]; then
    echo "📋 Copying Symbolic theme SVG icons..."
    cp -r "$GIMP_ICONS_PATH/Symbolic/scalable/apps"/* public/icons/gimp-all/symbolic-svg/
fi

# Create a summary file
echo "📊 Creating icon summary..."
find public/icons/gimp-all -name "*.svg" -o -name "*.png" | wc -l > public/icons/gimp-all/icon-count.txt
find public/icons/gimp-all -name "*.svg" -o -name "*.png" | sort > public/icons/gimp-all/icon-list.txt

echo "🎉 GIMP icons copied successfully!"
echo "📁 Check the following directories:"
echo "   - public/icons/gimp-all/svg/ (SVG icons)"
echo "   - public/icons/gimp-all/png-16/ (16x16 PNG icons)"
echo "   - public/icons/gimp-all/png-24/ (24x24 PNG icons)"
echo "   - public/icons/gimp-all/png-32/ (32x32 PNG icons)"
echo "   - public/icons/gimp-all/png-48/ (48x48 PNG icons)"
echo "   - public/icons/gimp-all/default-svg/ (Default theme)"
echo "   - public/icons/gimp-all/symbolic-svg/ (Symbolic theme)"
echo ""
echo "📊 Total icons copied: $(cat public/icons/gimp-all/icon-count.txt)"
echo "📋 Full icon list: public/icons/gimp-all/icon-list.txt"
