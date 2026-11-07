#!/usr/bin/env bash
# Build the site and publish dist/ to the gh-pages branch that GitHub Pages
# serves. Usage: ./scripts/deploy.sh
set -euo pipefail

repo="https://github.com/RahulDevv777/rahuldevstack.pro.git"
cd "$(dirname "$0")/.."

npm run build
touch dist/.nojekyll

cd dist
git init -q
git add -A
git -c user.name="rahuldevv" -c user.email="rahulmuthamsetty5677@gmail.com" \
  commit -q -m "deploy: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
git push -q -f "$repo" HEAD:gh-pages
rm -rf .git

echo "deployed → https://rahuldevv777.github.io/rahuldevstack.pro/"
