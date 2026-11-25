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

# Do everything, then deploy to Cloudflare Workers (Cloudflare credentials through `ctx`, see ctx.toml):
# clear caches, fix + lint + format, typecheck, CV (+ LinkedIn copy), thumbnails, build (with discovery), audit meta tags
deploy:
    rm -rf dist .wrangler node_modules/.vite
    pnpm fix
    pnpm typecheck
    typst compile cv/cv.typ public/cv.pdf
    pnpm linkedin
    pnpm thumbnails
    pnpm build
    pnpm check:meta
    ctx ops pnpm deploy
