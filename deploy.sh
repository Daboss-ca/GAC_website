#!/bin/bash

# Build the Expo web project
npx expo export --platform web

# Go to deploy folder
cd ../GAC_website_deploy || exit

# Switch to gh-pages branch
git checkout gh-pages

# Remove old build files (keep CNAME, .nojekyll if exist)
rm -rf * 

# Copy new build
cp -r ../GAC_website/dist/* .
cp -r ../GAC_website/dist/.* . 2>/dev/null

# Ensure SPA fallback and custom domain
echo greatawakeningchurch.dpdns.org > CNAME
cp index.html 404.html
touch .nojekyll

# Commit and push
git add .
git commit -m "Update Expo web build"
git push origin gh-pages --force

echo "Deployment finished! 🚀"
