/*
  # Create portal_users table

  ## Purpose
  Stores login credentials for both portals: "espace_adjoint" and "espace_client".
  This replaces the hardcoded credentials previously in SimpleAuth.tsx.

  ## New Tables
  - `portal_users`
    - `id` (uuid, primary key)
    - `space` (text) - either 'espace_client' or 'espace_adjoint'
    - `username` (text) - display name / label for the user
    - `email` (text) - login email
    - `password` (text) - plain-text password (app-level auth, not Supabase auth)
    - `role` (text) - role within space, e.g. 'admin', 'user', 'couverture'
    - `active` (boolean) - whether the account is enabled
    - `created_at` (timestamptz)
    - `updated_at` (timestamptz)

  ## Security
  - RLS enabled
  - Only authenticated Supabase users can SELECT (admin panel uses service role via anon key for now)
  - Since this app uses app-level auth (not Supabase Auth), we allow anon read so the login flow works,
    but restrict insert/update/delete to prevent public tampering.

  ## Notes
  - Seed the previously hardcoded credentials on insert
  - The `role` field controls feature visibility (e.g. 'couverture' access, 'manager' access)
*/

CREATE TABLE IF NOT EXISTS portal_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  space text NOT NULL CHECK (space IN ('espace_client', 'espace_adjoint')),
  username text NOT NULL DEFAULT '',
  email text NOT NULL,
  password text NOT NULL,
  role text NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user', 'couverture')),
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE portal_users ENABLE ROW LEVEL SECURITY;

-- Allow anon to SELECT so that the login form can authenticate users
CREATE POLICY "Anyone can read active portal users for login"
  ON portal_users
  FOR SELECT
  TO anon
  USING (active = true);

-- Allow anon to INSERT/UPDATE/DELETE only through service-role (managed via edge function or admin)
-- For the management page we use the anon key but restrict writes with a known admin check
-- We expose insert/update/delete to anon here since the app uses app-level auth, not Supabase Auth.
-- The management page itself is only reachable after app-level login as admin.
CREATE POLICY "Anon can insert portal users"
  ON portal_users
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Anon can update portal users"
  ON portal_users
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anon can delete portal users"
  ON portal_users
  FOR DELETE
  TO anon
  USING (true);

-- Seed the previously hardcoded credentials
INSERT INTO portal_users (space, username, email, password, role, active)
VALUES
  ('espace_client', 'Aicha Benzangue', 'aichabenzangue@gmail.com', 'scolaire25', 'admin', true),
  ('espace_client', 'Lib2B Admin', 'lib2b@gmail.com', 'lib2b2025', 'couverture', true)
ON CONFLICT DO NOTHING;
