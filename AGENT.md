# Block Town Survivors - Deployment Guide

## Tech Stack
- React + TypeScript
- Three.js / React Three Fiber
- Vite (build tool)
- Tailwind CSS (CDN)

## GitHub Pages Deployment

### Prerequisites
Ensure these files are configured correctly before deployment:

1. **index.html** - Must include Vite entry point:
   ```html
   <script type="module" src="/index.tsx"></script>
   ```

2. **vite.config.ts** - Must set base path matching repo name:
   ```ts
   base: '/Block-Town-Survivors/',
   ```

3. **constants.ts** - Sound paths must use BASE_URL:
   ```ts
   const BASE = import.meta.env.BASE_URL;
   export const SOUND_PATHS = {
     SHOOT: `${BASE}sounds/pistol_fire.wav`,
     // ...
   };
   ```

4. **public/sounds/** - All static audio assets must be in `public/` folder:
   ```
   public/
   └── sounds/
       ├── bgm/
       │   ├── bgm1.mp3
       │   └── bgm2.mp3
       ├── pistol_fire.wav
       ├── shotgun_fire.wav
       ├── enemy_hit.wav
       ├── enemy_dead.wav
       ├── player_hit1.wav
       ├── player_hit2.wav
       ├── player_hit3.wav
       ├── mgl_fire.wav
       └── mgl_hit.wav
   ```

   **Important:** Do NOT put sounds in a root `sounds/` folder - they must be in `public/sounds/` for Vite to include them in the build.

### Workflow Setup
Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches:
      - main
      - master
      - 'claude/deploy-github-pages-*'  # Optional: deploy from feature branches
  workflow_dispatch:

permissions:
  contents: write

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm install

      - name: Build
        run: npm run build

      - name: Deploy to gh-pages branch
        uses: peaceiris/actions-gh-pages@v4
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
          publish_branch: gh-pages
```

### GitHub Pages Setup (after first workflow run)
1. Go to **Settings > Pages**
2. Set Source: "Deploy from a branch"
3. Set Branch: `gh-pages` / `/ (root)`
4. Save

The game will be available at: `https://<username>.github.io/Block-Town-Survivors/`

### Manual Deployment
```bash
npm install
npm run build
# Built files in ./dist
```

### Common Issues
| Issue | Solution |
|-------|----------|
| **Build produces only 2 modules** | Missing `<script type="module" src="/index.tsx"></script>` in index.html |
| **Black page / 404 on assets** | Check `base` path in vite.config.ts matches repo name |
| **Sounds not loading** | Ensure sounds are in `public/sounds/` and paths use `import.meta.env.BASE_URL` |
| **BGM 404 errors** | BGM files must be in `public/sounds/bgm/`, not root `sounds/bgm/` |
| **Source files served instead of build** | GitHub Pages must point to `gh-pages` branch, not `main` |
| **gh-pages branch not created** | Workflow only runs on push to configured branches - merge PR or add branch pattern |
| **BGM not playing** | Ensure `audioManager.setMute(!options.soundEnabled)` is called before `playBGM()` in App.tsx |
