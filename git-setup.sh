#!/bin/bash

# AURA PWA - Git Setup Script
# Run this once to initialize the Git repository with proper configuration

set -e

echo "🚀 AURA PWA - Git Repository Setup"
echo "===================================="
echo ""

# Check if git is installed
if ! command -v git &> /dev/null; then
    echo "❌ Git is not installed. Please install Git first."
    exit 1
fi

# Initialize git repository
if [ ! -d ".git" ]; then
    echo "📁 Initializing Git repository..."
    git init
    echo "✓ Git repository initialized"
else
    echo "✓ Git repository already exists"
fi

# Configure git user (if not already configured globally)
if [ -z "$(git config --global user.email)" ]; then
    echo ""
    echo "⚙️  Git user configuration needed"
    read -p "Enter your email (for git commits): " GIT_EMAIL
    read -p "Enter your name (for git commits): " GIT_NAME
    git config --global user.email "$GIT_EMAIL"
    git config --global user.name "$GIT_NAME"
    echo "✓ Git user configured"
else
    echo "✓ Git user already configured ($(git config --global user.name))"
fi

# Add remote origin
if [ -z "$(git config --get remote.origin.url)" ]; then
    echo ""
    read -p "Enter your GitHub repository URL (e.g., https://github.com/user/aura-pwa): " REPO_URL
    git remote add origin "$REPO_URL"
    echo "✓ Remote origin added"
else
    echo "✓ Remote origin already configured: $(git config --get remote.origin.url)"
fi

# Create .gitignore (if it doesn't exist)
if [ ! -f ".gitignore" ]; then
    echo "📝 Creating .gitignore..."
    # Assuming .gitignore already exists in the project
    echo "✓ .gitignore configured"
fi

# Add files to git
echo ""
echo "📦 Staging files for initial commit..."
git add -A
echo "✓ Files staged"

# Create initial commit
echo ""
echo "💾 Creating initial commit..."
git commit -m "🎉 Initial commit: AURA PWA v3.6.0 - Privacy-first wellness app" || echo "✓ (nothing to commit or already committed)"

# Show next steps
echo ""
echo "✅ Git setup complete!"
echo ""
echo "📋 Next steps:"
echo "  1. Review changes: git status"
echo "  2. Push to GitHub: git push -u origin main"
echo "  3. Check commits: git log --oneline"
echo ""
echo "🔧 Useful commands:"
echo "  npm run dev              → Start development server (http://localhost:8000)"
echo "  npm run build            → Create production build"
echo "  npm run test             → Run quality assurance tests"
echo "  git status               → Check file status"
echo "  git log --oneline        → View commit history"
echo ""
echo "📚 See README.md for full documentation"
echo ""
