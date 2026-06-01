# Deployment

This project has two deployment paths:

1. Full portal deployment on a Node host such as Render.
2. Static preview deployment on GitHub Pages.

Use the Node host for production because Student Portal, Lecturer Portal, login,
finance, attendance, e-learning certificates, and Mira AI need the Express API.
GitHub Pages can only serve the static files in `frontend/public`.

## Full Website And Portal On Render

1. Push this repository to GitHub.
2. In Render, create a new Blueprint from this repository.
3. Render will read `render.yaml`.
4. Set these environment variables in Render:
   - `JWT_SECRET`: a long random production secret.
   - `GEMINI_API_KEY`: optional, only needed for Mira AI.
   - `CORS_ORIGIN`: the final public URL, for example `https://your-site.onrender.com`.
5. Deploy the service.
6. Open:
   - `/`
   - `/student-portal`
   - `/lecturer-portal`
   - `/api/health`

## Static Preview On GitHub Pages

The workflow at `.github/workflows/pages.yml` builds CSS, runs syntax checks,
and publishes `frontend/public` to GitHub Pages.

Use this for brochure pages and visual preview only. The portal API will not run
on GitHub Pages.
