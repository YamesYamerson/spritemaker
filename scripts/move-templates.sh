#!/bin/bash

# Script to move downloaded template files to the correct templates folder
# Usage: ./scripts/move-templates.sh

echo "Moving downloaded templates to templates folder..."

# Get the Downloads folder path
DOWNLOADS_DIR="$HOME/Downloads"
TEMPLATES_DIR="public/templates"

# Check if templates directory exists
if [ ! -d "$TEMPLATES_DIR" ]; then
    echo "Creating templates directory..."
    mkdir -p "$TEMPLATES_DIR"
fi

# Find all JSON files in Downloads that look like templates
find "$DOWNLOADS_DIR" -name "*_*x*.json" -type f | while read file; do
    # Extract size from filename (e.g., "TemplateName_32x32.json" -> "32x32")
    filename=$(basename "$file")
    size=$(echo "$filename" | grep -o '[0-9]\+x[0-9]\+')
    
    if [ ! -z "$size" ]; then
        # Create size-specific folder
        size_dir="$TEMPLATES_DIR/$size"
        if [ ! -d "$size_dir" ]; then
            mkdir -p "$size_dir"
            echo "Created directory: $size_dir"
        fi
        
        # Move the file
        mv "$file" "$size_dir/"
        echo "Moved $filename to $size_dir/"
    fi
done

echo "Template organization complete!"
echo ""
echo "You can now:"
echo "1. Refresh your browser to see the new templates"
echo "2. Use the Import button to load templates from files"
echo "3. Templates will appear in the TemplatePanel for the matching canvas size"
