#!/usr/bin/env bash
set -e

# Test script to generate a project from the template

PROJECT_NAME="template-demo"
GITHUB_ORG="BodhiSearch"
GITHUB_PAGES="true"
BASE_PATH="/template-demo/"
PATH_SEGMENTS="1"

TARGET_DIR="/Users/amir36/Documents/workspace/src/github.com/BodhiSearch/${PROJECT_NAME}"

echo "🚀 Generating project from template..."
echo "  Project: ${PROJECT_NAME}"
echo "  Target: ${TARGET_DIR}"
echo

# Remove existing target if it exists
if [ -d "${TARGET_DIR}" ]; then
  echo "⚠️  Removing existing ${TARGET_DIR}"
  rm -rf "${TARGET_DIR}"
fi

# Copy template
echo "📦 Copying template files..."
rsync -a --exclude='.git' template/ "${TARGET_DIR}/"

# Rename dotfiles
echo "📝 Renaming dotfiles..."
cd "${TARGET_DIR}"
mv _gitignore .gitignore
mv _editorconfig .editorconfig
mv _prettierrc .prettierrc
mv _prettierignore .prettierignore

# Replace Handlebars variables
echo "🔧 Processing template variables..."

# Function to replace in file (works with both GNU and BSD sed)
replace_in_file() {
  local file=$1
  local search=$2
  local replace=$3

  if sed --version 2>/dev/null | grep -q GNU; then
    # GNU sed
    sed -i "s|${search}|${replace}|g" "$file"
  else
    # BSD sed (macOS)
    sed -i '' "s|${search}|${replace}|g" "$file"
  fi
}

# Replace variables in all files
for file in package.json vite.config.ts index.html public/404.html README.md playwright.config.ts; do
  if [ -f "$file" ]; then
    echo "  Processing $file..."
    replace_in_file "$file" "{{projectName}}" "${PROJECT_NAME}"
    replace_in_file "$file" "{{githubOrg}}" "${GITHUB_ORG}"
    replace_in_file "$file" "{{basePath}}" "${BASE_PATH}"
    replace_in_file "$file" "{{pathSegmentsToKeep}}" "${PATH_SEGMENTS}"
  fi
done

# Handle conditional blocks (simplified - just remove the handlebars syntax for true condition)
if [ "$GITHUB_PAGES" = "true" ]; then
  echo "  Enabling GitHub Pages..."
  for file in index.html README.md; do
    if [ -f "$file" ]; then
      # Remove {{#if githubPages}} and {{/if}} lines
      if sed --version 2>/dev/null | grep -q GNU; then
        sed -i '/{{#if githubPages}}/d; /{{else}}/,/{{\/if}}/d; /{{\/if}}/d' "$file"
      else
        sed -i '' '/{{#if githubPages}}/d; /{{else}}/,/{{\/if}}/d; /{{\/if}}/d' "$file"
      fi
    fi
  done
else
  echo "  Disabling GitHub Pages..."
  for file in index.html README.md; do
    if [ -f "$file" ]; then
      # Remove content between {{#if githubPages}} and {{else}}, keep {{else}} to {{/if}}
      if sed --version 2>/dev/null | grep -q GNU; then
        sed -i '/{{#if githubPages}}/,/{{else}}/d; /{{\/if}}/d' "$file"
      else
        sed -i '' '/{{#if githubPages}}/,/{{else}}/d; /{{\/if}}/d' "$file"
      fi
    fi
  done
  # Remove GitHub Pages specific files
  rm -f .github/workflows/deploy-pages.yml
  rm -f public/404.html
fi

echo "✅ Template processed successfully!"
echo
echo "📂 Project created at: ${TARGET_DIR}"
echo
echo "Next steps:"
echo "  cd ${TARGET_DIR}"
echo "  npm install"
echo "  npm run dev"
echo
