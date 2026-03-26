# Enabled Talent — 30/60/90 Day Check-In Workflow
Agentic AI Prototype v2.0

## Quick Start

1. Open Command Prompt (Windows) or Terminal (Mac)
2. Navigate to this folder:
   ```
   cd enabled-talent
   ```
3. Install dependencies (first time only):
   ```
   npm install
   ```
4. Start the app:
   ```
   npm run dev
   ```
5. Open your browser to: **http://localhost:5173**

## Deploying to Vercel

1. Push this folder to a GitHub repository
2. Import the repo at vercel.com/new
3. Add your API key as an environment variable:
   - Key: `VITE_ANTHROPIC_API_KEY`
   - Value: your Anthropic API key (starts with sk-ant-)
4. In `src/App.jsx` line 40, replace the hardcoded key with:
   ```js
   const ANTHROPIC_API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY;
   ```

## Files
- `src/App.jsx` — the entire application (dashboard, survey, and AI insights)
- `src/main.jsx` — React entry point (do not edit)
- `src/index.css` — base styles (do not edit)
- `index.html` — HTML shell (do not edit)
