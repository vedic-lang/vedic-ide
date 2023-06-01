#!/bin/bash

# Check if prettier is installed
if ! command -v prettier &> /dev/null; then
    echo "Prettier is not installed. Please install it first."
    exit 1
fi

# Format HTML files
echo "Formatting HTML files..."
find . -type f -name "*.html" -exec prettier --parser html --write {} \;

# Format CSS files
echo "Formatting CSS files..."
find . -type f -name "*.css" -exec prettier --parser css --write {} \;

# Format JavaScript files
echo "Formatting JavaScript files..."
find . -type f \( -name "*.js" -o -name "*.jsx" \) -exec prettier --parser babel --write {} \;

echo "Formatting complete!"
