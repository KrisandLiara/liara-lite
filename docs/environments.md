# Development & Operational Environments

Liara can run locally or inside Docker. Production deployments target Supabase and container hosts.

## Local Development

- `npm run dev` starts the Vite frontend on `localhost:5173`.
- `npm run dev` inside `liara-backend/` starts the Express server on `localhost:3000`.
- The Vite config proxies `/api` to the backend to avoid CORS issues.

## Docker Compose

- `docker-compose up --build` launches two services:
  - **frontend** – built from the root `Dockerfile`, served by Nginx on port `80`.
  - **backend** – built from `liara-backend/Dockerfile`, exposed on port `3000` and loaded with variables from `.env`.

## Environment Variables

The project expects a shared `.env` file in the root. Important keys include:

- `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` – Supabase client credentials used by the frontend.
- `VITE_API_BASE_URL` – Base URL of the backend API when not proxying.
- `SUPABASE_URL` / `SUPABASE_KEY` – Used by the Express server to connect to Supabase.
- `SUPABASE_SERVICE_ROLE_KEY` – Service role key for Edge Functions.
- `OPENAI_API_KEY` or `OPENAI_API_KEY_LOCAL_DEV` – Keys for calling OpenAI.

Adjust these values per environment before running the stack.
