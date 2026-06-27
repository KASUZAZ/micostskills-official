# MiCoSTSkills Website

Static website with a local Express API for the Student Portal.

## Setup

```bash
npm install
npm run build
npm start
```

Open `http://localhost:3000`.

On Windows you can also double-click `start-micost.bat`, then open:

- `http://localhost:3000/student-portal`
- `http://localhost:3000/lecturer-portal`
- `http://localhost:3000/admin-portal`

Do not open `frontend/public/student.html` directly with `file://` for daily use because the portal needs the local Express API.

## AI Chatbox

The public Haza AI widget and Student Portal chatbot use the backend AI endpoint.

### Option A: Embed a Zapier Chatbot

Create a Zapier Chatbot, publish it, then copy its share/embed URL into `.env` or `backend/miraai.env`:

```bash
ZAPIER_CHATBOT_URL=https://interfaces.zapier.com/...
```

When this is set, the public Haza AI floating chat panel will show the Zapier Chatbot inside the existing Haza AI bubble.

### Option B: Use a Zapier Webhook as the AI engine

Use this only if your Zap can return an immediate JSON response. Create a Zap with:

1. Trigger: `Webhooks by Zapier` -> `Catch Hook`
2. AI step: `AI by Zapier`, OpenAI, Gemini, or your preferred Zapier AI action
3. Final step: `Webhooks by Zapier` -> `Respond to Webhook`

Return JSON like this from the final step:

```json
{
  "reply": "Jawapan Haza AI di sini"
}
```

Then add the Catch Hook URL to `.env` or `backend/miraai.env`:

```bash
ZAPIER_CHAT_WEBHOOK_URL=https://hooks.zapier.com/hooks/catch/...
```

When `ZAPIER_CHAT_WEBHOOK_URL` is set, Zapier is used first. If Zapier is not set, add one of these direct AI keys:

```bash
OPENAI_API_KEY=your_openai_key
OPENAI_MODEL=gpt-4o-mini
```

or:

```bash
GEMINI_API_KEY=your_gemini_key
GEMINI_MODEL=gemini-2.5-flash
```

If no key is set, the chatbox still works in local fallback mode, but it will only answer common MiCoSTSkills questions.

## Demo Login

- Admin: `admin@micostskills.local` / `admin123`
- Student: `student@micostskills.local` / `student123`
- Lecturer: `lecturer@micostskills.local` / `lecturer123`

Admin login is separated from the student and lecturer login screens. Use `/admin-portal` for admin access.

## Project Structure

- `frontend/public/` - Website pages, generated CSS, JavaScript, images, and media assets
- `frontend/src/styles/input.css` - Tailwind source CSS
- `frontend/tailwind.config.js` - Tailwind content and theme configuration
- `backend/server.js` - Express static server and local API
- `backend/data/local-data.json` - Local demo database for the Student Portal API
- `backend/database/schema.sql` - Optional MySQL schema reference
- `backend/miraai.env` - Local Haza AI environment variables
- `package.json` - Root scripts for building CSS, checking files, and running the app

## Useful Commands

```bash
npm run check
npm run build
npm start
```
