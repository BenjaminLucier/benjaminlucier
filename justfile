set shell := ["zsh", "-cu"]

# List available commands
default:
    @just --list

# Install dependencies
install:
    pnpm install

# Start the dev server
dev:
    pnpm dev

# Update all dependencies to latest allowed versions
update:
    pnpm update

# Check the Cloudflare credentials in envchain are valid
whoami:
    envchain "$(<.ctx)" pnpm wrangler whoami

# Do everything, then deploy to Cloudflare Workers (CLOUDFLARE_API_TOKEN + CLOUDFLARE_ACCOUNT_ID from envchain, namespace in .ctx):
# clear caches, fix + lint + format, typecheck, CV, thumbnails, build (with discovery), audit meta tags
deploy:
    rm -rf dist .wrangler node_modules/.vite
    pnpm fix
    pnpm typecheck
    typst compile cv/cv.typ public/cv.pdf
    pnpm thumbnails
    pnpm build
    pnpm check:meta
    envchain "$(<.ctx)" pnpm deploy
