# Supabase Edge Function: `get-api-key`

## Overview

The `get-api-key` Edge Function is responsible for securely retrieving an API key for a given user. It is designed to fetch specific types of API keys (e.g., "openai") that are associated with a user's account through a `provider_account_id`.

## File Location

`supabase/functions/get-api-key/index.ts` (Assumed)

## Functionality

1.  **CORS Handling**: Responds to OPTIONS requests for CORS preflight.
2.  **Input Validation**: Expects a JSON body with:
    *   `userId` (string): The ID of the user requesting the key.
    *   `keyNames` (string[]): An array of possible names for the API key (e.g., `["OpenAI", "Default"]`).
    *   `type` (string): The type of key being requested (e.g., `"openai"`). This is a mandatory field.
3.  **Supabase Admin Client Initialization**: Uses the Supabase URL and service role key from environment variables.
4.  **User Profile Retrieval**:
    *   Fetches the `provider_account_id` from the `user_profiles` table based on the provided `userId`.
5.  **API Key Retrieval**:
    *   Queries the `api_keys_server_s` table (ensure this table name is correct and matches your schema).
    *   Filters by the fetched `provider_account_id`.
    *   Filters by the provided `keyNames` (using `IN` operator).
    *   Filters by the provided `type` (e.g., `key_type = 'openai')`.
    *   Orders by `created_at` descending and takes the first result to get the most recent matching key.
6.  **Response**:
    *   If successful, returns a JSON object with the `apiKey` (the actual `key_value`).
    *   Returns appropriate error messages and status codes for missing inputs, profile not found, key not found, or other server errors.

## Environment Variables

*   `SUPABASE_URL`: The URL of your Supabase project.
*   `SUPABASE_SERVICE_ROLE_KEY`: The service role key for your Supabase project.

## Request Body

```json
{
  "userId": "user-uuid-string",
  "keyNames": ["OpenAI", "Guest/Personal", "Default"],
  "type": "openai"
}
```

## Success Response (200 OK)

```json
{
  "apiKey": "sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
}
```

## Error Responses

*   **400 Bad Request**: If `userId`, `keyNames`, or `type` is missing.
*   **404 Not Found**: If the provider account ID is not found for the user, or if no matching API key is found.
*   **500 Internal Server Error**: For issues like failure to fetch user profile or other unexpected server-side errors.

## Dependencies

*   Relies on a `user_profiles` table with `user_id` and `provider_account_id` columns.
*   Relies on an `api_keys_server_s` table (or similar) with `provider_account_id`, `key_name`, `key_value`, `key_type`, and `created_at` columns.
*   Uses `../_shared/cors.ts` for CORS headers. 