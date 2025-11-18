# Global Sales Insights Slack App

A demo-ready Slack Bolt (Node.js + TypeScript) app that recreates the Global Sales Insights experience shown in the screenshots. The App Home highlights key modules, the **Executive Meeting Brief** button launches a multi-step modal, and the resulting brief is delivered as a Slack Canvas (or a rich Block Kit + Markdown attachment fallback). Users can switch between **Mocked**, **LLM-generated**, or **Prebuilt Canvas** data sources via the Settings button.

## Features
- App Home layout that mirrors the provided design: welcome copy, "Key Use Cases" link, Action Hub buttons, and a View-As picker.
- Executive Meeting Brief workflow with two modals (template selection + detailed inputs).
- Settings modal that persists per-user data source preferences (stored in `.data/user-preferences.json`), including a live Slack Canvas search (via `files.list`) and a one-click reset.
- Mock customer dataset with three fully-populated accounts, plus three prebuilt Canvas markdown templates.
- Optional OpenAI integration (`OPENAI_API_KEY`) to generate narrative content.
- Canvas delivery helper that uses Slack's Canvases API when available or falls back to a DM containing Block Kit plus a Markdown attachment.
- Product-ready Slack manifest located at `manifest/product-slack-app-manifest.json`.

## Project structure
```
src/
  app.ts                         # Bolt bootstrap + routing
  blocks/common.ts               # Shared Block Kit helpers
  home/publishHome.ts            # App Home renderer
  modals/executiveBrief/         # Modal builders + submit handler
  modals/settingsModal.ts        # Settings modal logic
  data/mockCustomerData.ts       # Demo accounts + select helpers
  prebuilt/                      # Markdown canvases + registry
  services/                      # briefBuilder, canvas delivery, llm helpers
  store/userPrefs.ts             # JSON-backed user preference store
manifest/product-slack-app-manifest.json
```

## Requirements
- Node.js 18.17+ (Render will provide Node 20 by default).
- Slack workspace with the Canvases feature (required for sharing existing Canvases).
- (Optional) OpenAI API key for the LLM mode.

## Environment variables
Create a `.env` (or set in Render):
```
SLACK_BOT_TOKEN=xoxb-...
SLACK_SIGNING_SECRET=...
SLACK_USER_TOKEN=xoxp-... # user token authorized with canvases:read,canvases:write
OPENAI_API_KEY= (optional)
USE_CANVAS_API=false # set true only if your workspace has Canvas API access
DATA_SOURCE_DEFAULT=mock # mock | llm | prebuilt
CANVAS_SHARE_CHANNEL= # optional channel to auto-share canvases
PORT=3000
```

## Local development
1. Install dependencies: `npm install`
2. Copy `.env.example` to `.env` and fill in the Slack credentials.
3. Run the dev server: `npm run dev`
4. Expose `http://localhost:3000` to Slack via ngrok/Cloudflared and set the Request URL to `<tunnel>/slack/events`.

## Render deployment
1. Create the root folder `global-sales-insights` (already handled) and push it to your Git provider.
2. In Render, create a **Web Service**:
   - Build command: `npm ci && npm run build`
   - Start command: `node dist/app.js`
   - Environment: Node 20 LTS (default)
   - Add the same environment variables from `.env`.
3. Render provides `PORT`; the app already reads it. Health probe uses `GET /healthz`.
4. Update Slack **Event Subscriptions** and **Interactivity** URLs to `https://<service>.onrender.com/slack/events`.
5. Reinstall the Slack app so the new domain is trusted.

## Slack app setup (manual steps outside this repo)
1. Create the Slack app at https://api.slack.com/apps → “From scratch”.
2. Paste the manifest in `manifest/product-slack-app-manifest.json` (update the URLs for your Render instance) or manually configure:
   - Bot scopes: `chat:write`, `files:read`, `files:write`, `users:read`, `users.profile:read`.
   - User scopes: `canvases:read`, `canvases:write` (installing the app will produce a user token used for Canvas APIs).
   - Enable App Home (Home + Messages tabs), Interactivity, and the `app_home_opened` event.
3. Install the app to your workspace to obtain the **Bot User OAuth Token**.
4. (Optional) Request access to the Canvas API if your workspace hasn’t enabled it.
5. Create at least one real Slack Canvas and copy its content into `src/prebuilt/canvases/` if you want to customize the hardcoded templates.
6. Provide an OpenAI API key if you plan to demo the LLM mode; otherwise the code falls back to a scripted narrative.

## Data sources
- **Mocked Data**: Uses the sample accounts under `src/data/mockCustomerData.ts` to build rich sections (metrics, goals, risks, contacts, opportunities).
- **LLM Generated**: Calls OpenAI (if configured) with the selected account context to produce narrative markdown.
- **Prebuilt Canvas**: Shares an existing Slack Canvas that you select in **Settings**. Pick a Canvas once, keep the familiar template + inputs flow, and the bot DM's the Canvas (with an “Executive Brief requested” summary) via its Messages tab when you submit (requires a `SLACK_USER_TOKEN` with `canvases:read` + `canvases:write` user scopes).

## Running the workflow
1. Open the app’s Home tab → pick a “View As” persona.
2. Hit **Executive Meeting Brief**:
   - Step 1: pick a template (same modal regardless of data source).
   - Step 2: choose “View As”, account, and local name & AOV.
3. On submit, the app saves your preferences, generates the brief, uploads the markdown, and DMs you the Canvas or fallback message.
4. Use the **Settings** button any time to switch among Mock / LLM / Prebuilt modes, pick which Slack Canvas to send, or hit **Reset Settings** for a clean slate.

## Assets for demos
- Mock accounts: Supercell Games NA, Northwind Logistics, Contoso Retail APAC.
- Prebuilt canvases: `executive-qbr.md`, `elt-brief.md`, `discovery-brief.md`.
- Settings persist per user, enabling tailored demo runs without reconfiguration.

## Scripts
- `npm run dev` – tsx watch mode for local development.
- `npm run build` – compile TypeScript to `dist/`.
- `npm start` – run the compiled app (Render uses this).
- `npm run lint` – type-check without emitting.

## Canvas fallback behavior
If `USE_CANVAS_API` is `false` or the API call fails, the app automatically:
1. Uploads the markdown brief via `files.uploadV2` to the requester.
2. Sends a DM with Block Kit sections summarizing the brief so the user still receives a rich experience.

Enjoy the demo!
