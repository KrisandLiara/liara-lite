# Authentication & Middleware

Authentication is handled by Supabase. The frontend obtains a JWT after sign in via the Supabase client and includes it in the `Authorization` header for API calls.

The backend Express server applies an `authenticate` middleware to protected routes:

1. Extracts the `Bearer` token from the header.
2. Calls `supabase.auth.getUser` to validate the token.
3. If valid, attaches the user object to `req.user`; otherwise returns `401`.

Edge Functions also require a valid JWT when invoked from the browser. When running server‑to‑server (such as from another Edge Function) a service role key is used instead.
