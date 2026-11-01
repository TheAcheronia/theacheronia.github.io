#!/usr/bin/env bash
set -e

REPO_URL="https://github.com/TheAcheronia/page.git"

echo "=========================================================="
echo "⚡ TheAcheronia Website — Git Deployment Helper"
echo "=========================================================="

cd "$(dirname "$0")"

# Check if git is initialized inside page/
if [ ! -d ".git" ]; then
    echo "📦 Initializing local git repository in ./page..."
    git init
    git branch -M main
fi

# Check remote
if ! git remote | grep -q "origin"; then
    echo "🔗 Adding remote origin -> $REPO_URL..."
    git remote add origin "$REPO_URL"
else
    echo "✓ Remote origin already configured: $(git remote get-url origin)"
fi

# Check git user config locally
if ! git config user.name > /dev/null 2>&1; then
    echo "👤 Configuring local git user.name -> TheAcheronia..."
    git config user.name "TheAcheronia"
fi
if ! git config user.email > /dev/null 2>&1; then
    echo "📧 Configuring local git user.email -> 218118446+TheAcheronia@users.noreply.github.com..."
    git config user.email "218118446+TheAcheronia@users.noreply.github.com"
fi

echo "📝 Staging changes..."
git add -A

COMMIT_MSG="feat: modern website release with Arcy Music showcase & interactive CLI"
if git diff --cached --quiet; then
    echo "✓ Working tree clean, no new changes to commit."
else
    git commit -m "$COMMIT_MSG"
    echo "✓ Changes committed successfully."
fi

echo ""
echo "🚀 Ready to push to GitHub!"
echo "Run the following command whenever you are ready:"
echo ""
echo "    git push -u origin main"
echo ""
echo "Then enable GitHub Pages at:"
echo "    https://github.com/TheAcheronia/page/settings/pages"
echo "    (Source: Deploy from a branch -> main -> / (root) -> Save)"
echo "=========================================================="
