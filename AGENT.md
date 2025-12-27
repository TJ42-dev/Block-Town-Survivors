# Block Town Survivors - Deployment Guide

## Tech Stack
- React + TypeScript
- Three.js / React Three Fiber
- Vite (build tool)
- Tailwind CSS (CDN)

## GitHub Pages Deployment

### How it works
1. Push to `main`, `master`, or configured branch triggers GitHub Actions
2. Workflow builds with Vite and deploys to `gh-pages` branch
3. GitHub Pages serves from `gh-pages` branch

### Key Configuration
- **vite.config.ts**: `base: '/Block-Town-Survivors/'` (must match repo name)
- **constants.ts**: Sound paths use `import.meta.env.BASE_URL` for correct asset loading
- **public/sounds/**: Static assets must be in `public/` folder for Vite

### GitHub Pages Setup
1. Go to Settings > Pages
2. Set Source: "Deploy from a branch"
3. Set Branch: `gh-pages` / `/ (root)`
4. Save

### Changing Deploy Branch
Edit `.github/workflows/deploy.yml` line 5:
```yaml
branches: ['main', 'master']  # Add or remove branches here
```

### Manual Deployment
```bash
npm install
npm run build
# Built files in ./dist
```

### Common Issues
- **Black page / 404 on assets**: Check `base` path in vite.config.ts matches repo name
- **Sounds not loading**: Ensure sounds are in `public/sounds/` and paths use BASE_URL
- **Source files served instead of build**: GitHub Pages must point to `gh-pages` branch, not `main`
- **BGM not playing**: Ensure `audioManager.setMute(!options.soundEnabled)` is called before `playBGM()` in App.tsx
