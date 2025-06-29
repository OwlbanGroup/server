#!/bin/bash
# Test script to check markdownlint compliance and rendering of docker_wsl2_setup_guide.md

# Check if markdownlint is installed
if ! command -v markdownlint &> /dev/null
then
    echo "markdownlint could not be found, please install it to run this test."
    exit 1
fi

# Run markdownlint on the file
echo "Running markdownlint on docker_wsl2_setup_guide.md..."
markdownlint docker_wsl2_setup_guide.md

# Check if markdownlint passed without errors
if [ $? -eq 0 ]; then
    echo "markdownlint passed with no errors."
else
    echo "markdownlint found issues. Please review the output above."
fi

# Optional: Render markdown to HTML using pandoc if installed
if command -v pandoc &> /dev/null
then
    echo "Rendering markdown to HTML using pandoc for visual inspection..."
    pandoc docker_wsl2_setup_guide.md -o /tmp/docker_wsl2_setup_guide.html
    echo "HTML output saved to /tmp/docker_wsl2_setup_guide.html"
else
    echo "pandoc not found, skipping markdown rendering test."
fi

echo "Test completed."
