-- Drop dependent RLS policies first
DROP POLICY IF EXISTS "API keys are deletable by admins" ON "public"."api_keys";
DROP POLICY IF EXISTS "API keys are insertable by admins" ON "public"."api_keys";
DROP POLICY IF EXISTS "API keys are updatable by admins" ON "public"."api_keys";
DROP POLICY IF EXISTS "API keys are viewable by admins" ON "public"."api_keys";
DROP POLICY IF EXISTS "Admins can update all profiles" ON "public"."user_profiles";
DROP POLICY IF EXISTS "Admins can view all guest sessions" ON "public"."guest_sessions";
DROP POLICY IF EXISTS "Admins can view all profiles" ON "public"."user_profiles";
DROP POLICY IF EXISTS "Admins can view all token usage" ON "public"."token_usage";

-- Now, drop the function
DROP FUNCTION IF EXISTS is_admin(); 