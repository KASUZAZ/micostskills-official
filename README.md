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

Do not open `frontend/public/student.html` directly with `file://` for daily use because the portal needs the local Express API.

## Demo Login

- Admin: `admin@micostskills.local` / `admin123`
- Student: `student@micostskills.local` / `student123`
- Lecturer: `lecturer@micostskills.local` / `lecturer123`

## Project Structure

- `frontend/public/` - Website pages, generated CSS, JavaScript, images, and media assets
- `frontend/src/styles/input.css` - Tailwind source CSS
- `frontend/tailwind.config.js` - Tailwind content and theme configuration
- `backend/server.js` - Express static server and local API
- `backend/data/local-data.json` - Local demo database for the Student Portal API
- `backend/database/schema.sql` - Optional MySQL schema reference
- `backend/miraai.env` - Local Mira AI environment variables
- `package.json` - Root scripts for building CSS, checking files, and running the app

## Useful Commands

```bash
npm run check
npm run build
npm start
```
